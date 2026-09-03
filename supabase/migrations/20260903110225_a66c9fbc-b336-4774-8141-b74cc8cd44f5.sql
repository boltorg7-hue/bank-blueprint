-- 1. Accounts, balances, limits
UPDATE public.bank_accounts SET currency = 'USD', currency_minor_unit = 2 WHERE currency = 'TTD';
UPDATE public.account_balances SET currency = 'USD' WHERE currency = 'TTD';
UPDATE public.account_holds SET currency = 'USD' WHERE currency = 'TTD';
UPDATE public.beneficiaries SET destination_currency = 'USD' WHERE destination_currency = 'TTD';

UPDATE public.transfer_limits SET currency = 'USD' WHERE currency = 'TTD';
INSERT INTO public.transfer_limits (currency, max_per_transfer_minor, daily_limit_minor, monthly_limit_minor)
SELECT 'USD', 5000000, 10000000, 100000000
WHERE NOT EXISTS (SELECT 1 FROM public.transfer_limits WHERE currency = 'USD');

-- 2. Ledger chart of accounts (no entries exist yet)
UPDATE public.ledger_accounts
SET code = replace(code, '.TTD', '.USD'),
    name = replace(name, 'TTD', 'USD'),
    currency = 'USD'
WHERE currency = 'TTD';

-- 3. Settlement rails in USD (fiat + USDT)
UPDATE public.external_settlement_rails
SET code = 'USD_WIRE',
    display_name = 'Virement bancaire en dollars (USD)',
    currency = 'USD',
    document_threshold_minor = 1000000
WHERE code = 'TT_DOMESTIC';

INSERT INTO public.external_settlement_rails (
  code, display_name, country, currency, provider_key,
  is_active, is_simulation, requires_compliance_review, document_threshold_minor
)
SELECT 'USDT_SETTLEMENT', 'Règlement en USDT (Tether)', 'TT', 'USD', 'usdt_simulated',
       true, true, true, 1000000
WHERE NOT EXISTS (SELECT 1 FROM public.external_settlement_rails WHERE code = 'USDT_SETTLEMENT');

-- 4. New accounts open in USD
CREATE OR REPLACE FUNCTION public.provision_primary_account(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _lifecycle public.customer_lifecycle_state;
  _account_id uuid;
  _reference text;
  _number text;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'not authorised';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() IS DISTINCT FROM _user_id THEN
    RAISE EXCEPTION 'not authorised';
  END IF;

  SELECT lifecycle_state INTO _lifecycle FROM public.profiles WHERE id = _user_id;
  IF _lifecycle IS NULL OR _lifecycle <> 'ACTIVE' THEN
    RETURN NULL;
  END IF;

  SELECT id INTO _account_id
  FROM public.bank_accounts
  WHERE user_id = _user_id
  ORDER BY is_primary DESC, created_at
  LIMIT 1;

  IF _account_id IS NOT NULL THEN
    RETURN _account_id;
  END IF;

  _reference := public.next_account_public_reference();
  _number := '30' || lpad((floor(random() * 100000000)::bigint)::text, 8, '0');

  INSERT INTO public.bank_accounts (
    user_id, public_reference, account_type, display_name, currency,
    currency_minor_unit, status, is_primary, account_number,
    bank_code, branch_code, bic, opened_at
  ) VALUES (
    _user_id, _reference, 'CURRENT', 'Compte personnel', 'USD',
    2, 'ACTIVE', true, _number,
    '099', '0001', 'RBTTTTPXXX', now()
  )
  RETURNING id INTO _account_id;

  INSERT INTO public.account_balances (account_id, currency)
  VALUES (_account_id, 'USD');

  INSERT INTO public.account_status_history (
    account_id, user_id, previous_status, new_status, reason_category
  ) VALUES (_account_id, _user_id, NULL, 'ACTIVE', 'ACCOUNT_OPENED');

  RETURN _account_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.provision_primary_account(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_primary_account(uuid) TO service_role;
