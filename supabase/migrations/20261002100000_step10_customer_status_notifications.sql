-- STEP 10 — Notify the customer after an administrative lifecycle change.
-- Keeps the existing server-authoritative state transition and audit trail.

CREATE OR REPLACE FUNCTION public.admin_set_customer_state(
  _customer_id uuid,
  _state public.customer_lifecycle_state,
  _reason text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _previous public.customer_lifecycle_state;
  _title text;
  _body text;
BEGIN
  IF NOT public.has_permission(auth.uid(), 'customers.write') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF _state NOT IN ('ACTIVE','RESTRICTED','SUSPENDED')
     OR char_length(trim(coalesce(_reason,''))) NOT BETWEEN 8 AND 300 THEN
    RAISE EXCEPTION 'invalid state change';
  END IF;

  SELECT lifecycle_state
    INTO _previous
    FROM public.profiles
   WHERE id = _customer_id
   FOR UPDATE;

  IF _previous IS NULL THEN
    RAISE EXCEPTION 'customer not found';
  END IF;

  IF _state = 'ACTIVE'
     AND NOT EXISTS (
       SELECT 1 FROM public.bank_accounts WHERE user_id = _customer_id
     ) THEN
    RAISE EXCEPTION 'account required before activation';
  END IF;

  UPDATE public.profiles
     SET lifecycle_state = _state
   WHERE id = _customer_id;

  IF _state = 'ACTIVE' THEN
    _title := 'Compte client activé';
    _body := 'Votre statut client a été activé par RFC Royal FINANCE Bank.';
  ELSIF _state = 'RESTRICTED' THEN
    _title := 'Statut client restreint';
    _body := 'Votre statut client a été placé en restriction. Consultez votre espace client ou contactez le service client pour plus d’informations.';
  ELSE
    _title := 'Statut client suspendu';
    _body := 'Votre statut client a été suspendu. Consultez votre espace client ou contactez le service client pour connaître les prochaines étapes.';
  END IF;

  PERFORM public.emit_customer_notification(
    _customer_id,
    'customer.state_changed:' || _customer_id::text || ':' || _state::text || ':' || extract(epoch FROM clock_timestamp())::bigint,
    'ACCOUNT',
    CASE WHEN _state = 'ACTIVE' THEN 'SUCCESS' ELSE 'WARNING' END,
    _title,
    _body,
    '/app',
    NULL,
    jsonb_build_object(
      'previousState', _previous,
      'newState', _state,
      'reasonRecorded', true
    )
  );

  INSERT INTO public.admin_audit_events(
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
    'customer.state_changed',
    'customer',
    _customer_id::text,
    'customers.write',
    'ALLOWED',
    jsonb_build_object(
      'previous', _previous,
      'new', _state,
      'reason', trim(_reason)
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_customer_state(uuid, public.customer_lifecycle_state, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_customer_state(uuid, public.customer_lifecycle_state, text) TO authenticated;
