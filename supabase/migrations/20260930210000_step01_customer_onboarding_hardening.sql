/*
  STEP 01 — Customer account creation / onboarding hardening

  Goals:
  - Keep customer lifecycle transitions server-authoritative.
  - Prevent non-active customers from being treated as fully operational.
  - Make the ACTIVE transition depend on a verified identity and an active
    primary bank account.
  - Keep account activation idempotent.
*/

BEGIN;

CREATE OR REPLACE FUNCTION public.activate_approved_customer(
  _customer_id uuid,
  _reason text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _account public.bank_accounts%ROWTYPE;
  _previous_lifecycle public.customer_lifecycle_state;
BEGIN
  /*
    Only staff with the dedicated account-management permission can perform
    the final activation.
  */
  IF NOT public.has_permission(auth.uid(), 'accounts.manage') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF char_length(trim(coalesce(_reason, ''))) NOT BETWEEN 8 AND 300 THEN
    RAISE EXCEPTION 'invalid reason';
  END IF;

  /*
    Identity must have been independently verified.
  */
  IF NOT EXISTS (
    SELECT 1
    FROM public.identity_verifications
    WHERE user_id = _customer_id
      AND status = 'VERIFIED'
  ) THEN
    RAISE EXCEPTION 'identity not verified';
  END IF;

  /*
    Lock the customer's lifecycle row before activation.
  */
  SELECT lifecycle_state
  INTO _previous_lifecycle
  FROM public.profiles
  WHERE id = _customer_id
  FOR UPDATE;

  IF _previous_lifecycle IS NULL THEN
    RAISE EXCEPTION 'customer not found';
  END IF;

  /*
    The expected lifecycle immediately before activation is BANKING_REVIEW.
    We deliberately do not allow an operator to bypass the KYC/account-opening
    workflow by activating an arbitrary customer.
  */
  IF _previous_lifecycle <> 'BANKING_REVIEW' THEN
    RAISE EXCEPTION 'customer not ready for activation';
  END IF;

  /*
    Lock the primary account.
  */
  SELECT *
  INTO _account
  FROM public.bank_accounts
  WHERE user_id = _customer_id
    AND is_primary = true
  FOR UPDATE;

  IF _account.id IS NULL THEN
    RAISE EXCEPTION 'primary account not found';
  END IF;

  /*
    Idempotency:
    If the account is already active and the lifecycle is already ACTIVE,
    return its reference instead of creating a second transition.
  */
  IF _account.status = 'ACTIVE'
     AND _previous_lifecycle = 'ACTIVE' THEN
    RETURN _account.public_reference;
  END IF;

  IF _account.status <> 'PENDING' THEN
    RAISE EXCEPTION 'pending account not found';
  END IF;

  /*
    Final activation.
  */
  UPDATE public.bank_accounts
  SET
    status = 'ACTIVE',
    opened_at = COALESCE(opened_at, now()),
    updated_at = now()
  WHERE id = _account.id;

  UPDATE public.profiles
  SET lifecycle_state = 'ACTIVE'
  WHERE id = _customer_id
    AND lifecycle_state = 'BANKING_REVIEW';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'customer lifecycle changed during activation';
  END IF;

  /*
    Account status audit trail.
  */
  INSERT INTO public.account_status_history (
    account_id,
    user_id,
    previous_status,
    new_status,
    reason_category,
    internal_note,
    changed_by
  )
  VALUES (
    _account.id,
    _customer_id,
    'PENDING',
    'ACTIVE',
    'BANKING_APPROVED',
    trim(_reason),
    auth.uid()
  );

  /*
    Administrative audit trail.
  */
  INSERT INTO public.admin_audit_events (
    actor_user_id,
    action,
    resource_type,
    resource_reference,
    permission_checked,
    result,
    context
  )
  VALUES (
    auth.uid(),
    'customer.account_activated',
    'bank_account',
    _account.public_reference,
    'accounts.manage',
    'ALLOWED',
    jsonb_build_object(
      'customer_id', _customer_id,
      'reason', trim(_reason)
    )
  );

  RETURN _account.public_reference;
END;
$$;

REVOKE ALL
ON FUNCTION public.activate_approved_customer(uuid, text)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.activate_approved_customer(uuid, text)
TO authenticated;

COMMIT;
