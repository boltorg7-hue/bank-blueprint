CREATE TABLE public.financial_setting_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL CHECK (setting_key IN ('USD_PER_USDT', 'ACCOUNT_MAINTENANCE_MONTHLY', 'TRANSFER_INTERNAL', 'TRANSFER_EXTERNAL')),
  numeric_value numeric(18,6) NOT NULL CHECK (numeric_value >= 0),
  version integer NOT NULL CHECK (version > 0),
  effective_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (setting_key, version)
);
GRANT SELECT ON public.financial_setting_versions TO anon, authenticated;
GRANT ALL ON public.financial_setting_versions TO service_role;
ALTER TABLE public.financial_setting_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published financial values readable" ON public.financial_setting_versions FOR SELECT TO anon, authenticated USING (version = (SELECT max(v.version) FROM public.financial_setting_versions v WHERE v.setting_key = financial_setting_versions.setting_key));
CREATE TRIGGER financial_setting_versions_updated BEFORE UPDATE ON public.financial_setting_versions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.financial_setting_versions (setting_key, numeric_value, version) VALUES ('USD_PER_USDT', 0.9994, 1), ('ACCOUNT_MAINTENANCE_MONTHLY', 500, 1), ('TRANSFER_INTERNAL', 0, 1), ('TRANSFER_EXTERNAL', 2500, 1);

CREATE OR REPLACE FUNCTION public.update_financial_setting(_key text, _value numeric, _expected_version integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _old public.financial_setting_versions%ROWTYPE; _new public.financial_setting_versions%ROWTYPE;
BEGIN
  IF NOT public.has_permission(auth.uid(), 'settings.manage') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _key NOT IN ('USD_PER_USDT', 'ACCOUNT_MAINTENANCE_MONTHLY', 'TRANSFER_INTERNAL', 'TRANSFER_EXTERNAL') OR _value IS NULL OR _expected_version IS NULL THEN RAISE EXCEPTION 'invalid setting'; END IF;
  IF (_key = 'USD_PER_USDT' AND (_value < 0.0001 OR _value > 2 OR scale(_value) > 6)) OR (_key <> 'USD_PER_USDT' AND (_value < 0 OR _value > 10000000 OR _value <> trunc(_value))) THEN RAISE EXCEPTION 'invalid value'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(_key));
  SELECT * INTO _old FROM public.financial_setting_versions WHERE setting_key = _key ORDER BY version DESC LIMIT 1;
  IF _old.version IS DISTINCT FROM _expected_version THEN RAISE EXCEPTION 'version conflict'; END IF;
  INSERT INTO public.financial_setting_versions(setting_key, numeric_value, version, created_by) VALUES (_key, _value, _old.version + 1, auth.uid()) RETURNING * INTO _new;
  INSERT INTO public.admin_audit_events(actor_user_id, action, resource_type, resource_reference, permission_checked, result, context) VALUES (auth.uid(), 'financial_setting.updated', 'financial_setting', _key, 'settings.manage', 'ALLOWED', jsonb_build_object('old', _old.numeric_value, 'new', _new.numeric_value, 'version', _new.version));
  RETURN jsonb_build_object('setting_key', _new.setting_key, 'numeric_value', _new.numeric_value, 'version', _new.version, 'effective_at', _new.effective_at);
END; $$;
REVOKE ALL ON FUNCTION public.update_financial_setting(text, numeric, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_financial_setting(text, numeric, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_admin_transfer_limits(_max bigint, _daily bigint, _monthly bigint, _expected_updated_at timestamptz) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _old public.transfer_limits%ROWTYPE; _new public.transfer_limits%ROWTYPE;
BEGIN
  IF NOT public.has_permission(auth.uid(), 'settings.manage') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _max IS NULL OR _daily IS NULL OR _monthly IS NULL OR _max <= 0 OR _daily < _max OR _monthly < _daily THEN RAISE EXCEPTION 'invalid limits'; END IF;
  SELECT * INTO _old FROM public.transfer_limits WHERE currency = 'USD' FOR UPDATE;
  IF _old.id IS NULL OR _old.updated_at IS DISTINCT FROM _expected_updated_at THEN RAISE EXCEPTION 'version conflict'; END IF;
  UPDATE public.transfer_limits SET max_per_transfer_minor = _max, daily_limit_minor = _daily, monthly_limit_minor = _monthly, updated_at = clock_timestamp() WHERE id = _old.id RETURNING * INTO _new;
  INSERT INTO public.admin_audit_events(actor_user_id, action, resource_type, resource_reference, permission_checked, result, context) VALUES (auth.uid(), 'transfer_limits.updated', 'transfer_limits', 'USD', 'settings.manage', 'ALLOWED', jsonb_build_object('old', jsonb_build_object('max', _old.max_per_transfer_minor, 'daily', _old.daily_limit_minor, 'monthly', _old.monthly_limit_minor), 'new', jsonb_build_object('max', _max, 'daily', _daily, 'monthly', _monthly)));
  RETURN jsonb_build_object('max', _new.max_per_transfer_minor, 'daily', _new.daily_limit_minor, 'monthly', _new.monthly_limit_minor, 'updated_at', _new.updated_at);
END; $$;
REVOKE ALL ON FUNCTION public.update_admin_transfer_limits(bigint, bigint, bigint, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_admin_transfer_limits(bigint, bigint, bigint, timestamptz) TO authenticated;

CREATE TABLE public.funding_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.bank_accounts(id),
  amount_minor bigint NOT NULL CHECK (amount_minor > 0 AND amount_minor <= 100000000000),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 8 AND 500),
  idempotency_key uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  maker_user_id uuid NOT NULL REFERENCES auth.users(id),
  checker_user_id uuid REFERENCES auth.users(id),
  ledger_transaction_id uuid UNIQUE REFERENCES public.ledger_transactions(id),
  decision_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.funding_requests TO authenticated;
GRANT ALL ON public.funding_requests TO service_role;
ALTER TABLE public.funding_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finance staff read funding requests" ON public.funding_requests FOR SELECT TO authenticated USING (public.has_permission(auth.uid(), 'finance.adjustment.create') OR public.has_permission(auth.uid(), 'finance.adjustment.approve'));
CREATE TRIGGER funding_requests_updated BEFORE UPDATE ON public.funding_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.create_funding_request(_account_reference text, _amount_minor bigint, _reason text, _idempotency_key uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _account public.bank_accounts%ROWTYPE; _request public.funding_requests%ROWTYPE;
BEGIN
  IF NOT public.has_permission(auth.uid(), 'finance.adjustment.create') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _amount_minor IS NULL OR _amount_minor <= 0 OR _amount_minor > 100000000000 OR char_length(trim(coalesce(_reason, ''))) NOT BETWEEN 8 AND 500 OR _idempotency_key IS NULL THEN RAISE EXCEPTION 'invalid request'; END IF;
  SELECT * INTO _request FROM public.funding_requests WHERE idempotency_key = _idempotency_key;
  IF _request.id IS NOT NULL THEN RETURN jsonb_build_object('id', _request.id, 'status', _request.status); END IF;
  SELECT * INTO _account FROM public.bank_accounts WHERE public_reference = _account_reference AND currency = 'USD' AND status = 'ACTIVE';
  IF _account.id IS NULL THEN RAISE EXCEPTION 'account unavailable'; END IF;
  INSERT INTO public.funding_requests(account_id, amount_minor, reason, idempotency_key, maker_user_id) VALUES (_account.id, _amount_minor, trim(_reason), _idempotency_key, auth.uid()) RETURNING * INTO _request;
  INSERT INTO public.admin_audit_events(actor_user_id, action, resource_type, resource_reference, permission_checked, result) VALUES (auth.uid(), 'funding.requested', 'funding_request', _request.id::text, 'finance.adjustment.create', 'ALLOWED');
  RETURN jsonb_build_object('id', _request.id, 'status', _request.status);
END; $$;
REVOKE ALL ON FUNCTION public.create_funding_request(text, bigint, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_funding_request(text, bigint, text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.decide_funding_request(_request_id uuid, _approve boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _request public.funding_requests%ROWTYPE; _account public.bank_accounts%ROWTYPE; _customer_ledger uuid; _clearing uuid; _posted record;
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
    SELECT * INTO _posted FROM public.post_ledger_transaction('FUNDING'::public.ledger_transaction_type, 'USD', 'Approvisionnement validé', 'ADMIN_FUNDING', _request.id::text, 'funding:' || _request.id::text, jsonb_build_array(jsonb_build_object('ledgerAccountId', _clearing, 'side', 'DEBIT', 'amountMinor', _request.amount_minor), jsonb_build_object('ledgerAccountId', _customer_ledger, 'side', 'CREDIT', 'amountMinor', _request.amount_minor)), auth.uid(), '{}'::jsonb, NULL::uuid);
    UPDATE public.funding_requests SET status = 'APPROVED', checker_user_id = auth.uid(), decision_at = now(), ledger_transaction_id = _posted.id WHERE id = _request.id;
  ELSE
    UPDATE public.funding_requests SET status = 'REJECTED', checker_user_id = auth.uid(), decision_at = now() WHERE id = _request.id;
  END IF;
  INSERT INTO public.admin_audit_events(actor_user_id, action, resource_type, resource_reference, permission_checked, result, context) VALUES (auth.uid(), CASE WHEN _approve THEN 'funding.approved' ELSE 'funding.rejected' END, 'funding_request', _request.id::text, 'finance.adjustment.approve', 'ALLOWED', jsonb_build_object('ledger_transaction_id', _posted.id));
  RETURN jsonb_build_object('id', _request.id, 'status', CASE WHEN _approve THEN 'APPROVED' ELSE 'REJECTED' END, 'ledger_transaction_id', _posted.id);
END; $$;
REVOKE ALL ON FUNCTION public.decide_funding_request(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decide_funding_request(uuid, boolean) TO authenticated;