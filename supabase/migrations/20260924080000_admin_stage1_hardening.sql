-- STEP 1 — Back-office customers/accounts/funding hardening.
-- Extends the existing RBAC catalogue without changing the financial engine.

INSERT INTO public.role_permissions (role, permission) VALUES
  ('administrator', 'customers.write'),
  ('administrator', 'accounts.manage'),
  ('super_admin', 'customers.write'),
  ('super_admin', 'accounts.manage')
ON CONFLICT DO NOTHING;

-- The maker-checker funding functions are called with the authenticated staff
-- session so auth.uid() remains authoritative. Do not expose them to anon.
REVOKE ALL ON FUNCTION public.create_funding_request(text, bigint, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.decide_funding_request(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_funding_request(text, bigint, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decide_funding_request(uuid, boolean) TO authenticated;

CREATE INDEX IF NOT EXISTS funding_requests_status_created_idx
  ON public.funding_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS funding_requests_account_created_idx
  ON public.funding_requests(account_id, created_at DESC);

COMMENT ON TABLE public.funding_requests IS
  'Maker-checker requests for simulated account funding. Approval posts an immutable balanced ledger transaction.';

-- Corrects the rejection branch of the previous version: it must not read an
-- unassigned record while returning a null ledger transaction id.
CREATE OR REPLACE FUNCTION public.decide_funding_request(_request_id uuid, _approve boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _request public.funding_requests%ROWTYPE;
  _account public.bank_accounts%ROWTYPE;
  _customer_ledger uuid;
  _clearing uuid;
  _posted record;
  _ledger_transaction_id uuid := NULL;
BEGIN
  IF NOT public.has_permission(auth.uid(), 'finance.adjustment.approve') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO _request FROM public.funding_requests WHERE id = _request_id FOR UPDATE;
  IF _request.id IS NULL THEN RAISE EXCEPTION 'request not found'; END IF;
  IF _request.maker_user_id = auth.uid() THEN RAISE EXCEPTION 'four-eyes approval required'; END IF;
  IF _request.status <> 'PENDING' THEN RAISE EXCEPTION 'already decided'; END IF;
  IF _approve IS NULL THEN RAISE EXCEPTION 'invalid decision'; END IF;
  IF _approve THEN
    SELECT * INTO _account FROM public.bank_accounts WHERE id = _request.account_id FOR UPDATE;
    IF _account.status <> 'ACTIVE' OR _account.currency <> 'USD' THEN RAISE EXCEPTION 'account unavailable'; END IF;
    SELECT id INTO _customer_ledger FROM public.ledger_accounts WHERE bank_account_id = _account.id AND currency = 'USD' AND status = 'ACTIVE';
    SELECT id INTO _clearing FROM public.ledger_accounts WHERE code = 'SETTLEMENT_CLEARING.USD' AND status = 'ACTIVE';
    IF _customer_ledger IS NULL OR _clearing IS NULL THEN RAISE EXCEPTION 'ledger account unavailable'; END IF;
    SELECT * INTO _posted FROM public.post_ledger_transaction(
      'FUNDING'::public.ledger_transaction_type, 'USD', 'Approvisionnement validé',
      'ADMIN_FUNDING', _request.id::text, 'funding:' || _request.id::text,
      jsonb_build_array(
        jsonb_build_object('ledgerAccountId', _clearing, 'side', 'DEBIT', 'amountMinor', _request.amount_minor),
        jsonb_build_object('ledgerAccountId', _customer_ledger, 'side', 'CREDIT', 'amountMinor', _request.amount_minor)
      ), auth.uid(), '{}'::jsonb, NULL::uuid
    );
    _ledger_transaction_id := _posted.id;
    UPDATE public.funding_requests SET status = 'APPROVED', checker_user_id = auth.uid(), decision_at = now(), ledger_transaction_id = _ledger_transaction_id WHERE id = _request.id;
  ELSE
    UPDATE public.funding_requests SET status = 'REJECTED', checker_user_id = auth.uid(), decision_at = now() WHERE id = _request.id;
  END IF;
  INSERT INTO public.admin_audit_events(actor_user_id, action, resource_type, resource_reference, permission_checked, result, context)
  VALUES (auth.uid(), CASE WHEN _approve THEN 'funding.approved' ELSE 'funding.rejected' END, 'funding_request', _request.id::text, 'finance.adjustment.approve', 'ALLOWED', jsonb_build_object('ledger_transaction_id', _ledger_transaction_id));
  RETURN jsonb_build_object('id', _request.id, 'status', CASE WHEN _approve THEN 'APPROVED' ELSE 'REJECTED' END, 'ledger_transaction_id', _ledger_transaction_id);
END; $$;
REVOKE ALL ON FUNCTION public.decide_funding_request(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decide_funding_request(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_customer_state(
  _customer_id uuid,
  _state public.customer_lifecycle_state,
  _reason text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _previous public.customer_lifecycle_state;
BEGIN
  IF NOT public.has_permission(auth.uid(), 'customers.write') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _state NOT IN ('ACTIVE','RESTRICTED','SUSPENDED') OR char_length(trim(coalesce(_reason,''))) NOT BETWEEN 8 AND 300 THEN RAISE EXCEPTION 'invalid state change'; END IF;
  SELECT lifecycle_state INTO _previous FROM public.profiles WHERE id = _customer_id FOR UPDATE;
  IF _previous IS NULL THEN RAISE EXCEPTION 'customer not found'; END IF;
  IF _state = 'ACTIVE' AND NOT EXISTS (SELECT 1 FROM public.bank_accounts WHERE user_id = _customer_id) THEN RAISE EXCEPTION 'account required before activation'; END IF;
  UPDATE public.profiles SET lifecycle_state = _state WHERE id = _customer_id;
  INSERT INTO public.admin_audit_events(actor_user_id, action, resource_type, resource_reference, permission_checked, result, context)
  VALUES (auth.uid(), 'customer.state_changed', 'customer', _customer_id::text, 'customers.write', 'ALLOWED', jsonb_build_object('previous', _previous, 'new', _state, 'reason', trim(_reason)));
END; $$;
REVOKE ALL ON FUNCTION public.admin_set_customer_state(uuid, public.customer_lifecycle_state, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_customer_state(uuid, public.customer_lifecycle_state, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_account_status(
  _account_reference text,
  _status public.bank_account_status,
  _reason text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _account public.bank_accounts%ROWTYPE;
BEGIN
  IF NOT public.has_permission(auth.uid(), 'accounts.manage') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _status NOT IN ('ACTIVE','RESTRICTED','SUSPENDED','FROZEN') OR char_length(trim(coalesce(_reason,''))) NOT BETWEEN 8 AND 300 THEN RAISE EXCEPTION 'invalid status change'; END IF;
  SELECT * INTO _account FROM public.bank_accounts WHERE public_reference = _account_reference FOR UPDATE;
  IF _account.id IS NULL THEN RAISE EXCEPTION 'account not found'; END IF;
  IF _account.status = 'CLOSED' THEN RAISE EXCEPTION 'closed account immutable'; END IF;
  UPDATE public.bank_accounts SET status = _status WHERE id = _account.id;
  INSERT INTO public.account_status_history(account_id, user_id, previous_status, new_status, reason_category, internal_note, changed_by)
  VALUES (_account.id, _account.user_id, _account.status, _status, 'ADMIN_ACTION', trim(_reason), auth.uid());
  INSERT INTO public.admin_audit_events(actor_user_id, action, resource_type, resource_reference, permission_checked, result, context)
  VALUES (auth.uid(), 'account.status_changed', 'bank_account', _account_reference, 'accounts.manage', 'ALLOWED', jsonb_build_object('previous', _account.status, 'new', _status, 'reason', trim(_reason)));
END; $$;
REVOKE ALL ON FUNCTION public.admin_set_account_status(text, public.bank_account_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_account_status(text, public.bank_account_status, text) TO authenticated;
