CREATE OR REPLACE FUNCTION public.confirm_internal_transfer(_user_id uuid, _reference text)
 RETURNS TABLE(status transfer_status, failure_code text, transaction_reference text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _t public.transfers;
  _src public.bank_accounts;
  _dst public.bank_accounts;
  _ben public.beneficiaries;
  _lifecycle public.customer_lifecycle_state;
  _limits public.transfer_limits;
  _available bigint;
  _used_day bigint;
  _used_month bigint;
  _hold uuid;
  _src_ledger uuid;
  _dst_ledger uuid;
  _posting record;
  _txn_ref text;
  _fail text;
BEGIN
  SELECT * INTO _t FROM public.transfers tr
   WHERE tr.public_reference = _reference AND tr.sender_user_id = _user_id FOR UPDATE;
  IF _t.id IS NULL THEN RAISE EXCEPTION 'TRANSFER_UNAVAILABLE'; END IF;

  -- Idempotent recovery (§74, §75, §114).
  IF _t.status = 'COMPLETED' THEN
    SELECT lt.public_reference INTO _txn_ref FROM public.ledger_transactions lt
     WHERE lt.id = _t.ledger_transaction_id;
    RETURN QUERY SELECT _t.status, _t.failure_code, _txn_ref;
    RETURN;
  END IF;

  IF _t.status NOT IN ('READY_FOR_CONFIRMATION','CONFIRMED','FUNDS_RESERVED','PROCESSING') THEN
    RAISE EXCEPTION 'INVALID_TRANSITION';
  END IF;

  SELECT p.lifecycle_state INTO _lifecycle FROM public.profiles p WHERE p.id = _user_id;
  SELECT * INTO _src FROM public.bank_accounts a WHERE a.id = _t.source_account_id FOR UPDATE;
  SELECT * INTO _dst FROM public.bank_accounts a WHERE a.id = _t.destination_account_id;
  SELECT * INTO _ben FROM public.beneficiaries b WHERE b.id = _t.beneficiary_id;
  SELECT * INTO _limits FROM public.transfer_limits l WHERE l.currency = _t.currency;

  -- Re-validation at execution time (§126 – §128).
  IF _lifecycle IS DISTINCT FROM 'ACTIVE' OR _src.status <> 'ACTIVE' THEN
    _fail := 'ACCOUNT_RESTRICTED';
  ELSIF _dst.id IS NULL OR _dst.status <> 'ACTIVE' OR _ben.id IS NULL OR _ben.status <> 'ACTIVE' THEN
    _fail := 'DESTINATION_UNAVAILABLE';
  ELSIF _dst.currency <> _src.currency OR _t.currency <> _src.currency THEN
    _fail := 'CURRENCY_MISMATCH';
  ELSIF _limits.id IS NOT NULL AND _t.amount_minor > _limits.max_per_transfer_minor THEN
    _fail := 'LIMIT_EXCEEDED';
  END IF;

  IF _fail IS NULL AND _limits.id IS NOT NULL THEN
    SELECT COALESCE(SUM(tr.amount_minor),0) INTO _used_day FROM public.transfers tr
     WHERE tr.sender_user_id = _user_id AND tr.status = 'COMPLETED'
       AND tr.completed_at >= date_trunc('day', now());
    SELECT COALESCE(SUM(tr.amount_minor),0) INTO _used_month FROM public.transfers tr
     WHERE tr.sender_user_id = _user_id AND tr.status = 'COMPLETED'
       AND tr.completed_at >= date_trunc('month', now());
    IF _used_day + _t.amount_minor > _limits.daily_limit_minor
       OR _used_month + _t.amount_minor > _limits.monthly_limit_minor THEN
      _fail := 'LIMIT_EXCEEDED';
    END IF;
  END IF;

  IF _fail IS NULL THEN
    SELECT ab.available_balance_minor INTO _available FROM public.account_balances ab
     WHERE ab.account_id = _src.id;
    IF COALESCE(_available,0) < _t.amount_minor THEN
      _fail := 'INSUFFICIENT_FUNDS';
    END IF;
  END IF;

  IF _fail IS NOT NULL THEN
    UPDATE public.transfers
       SET status = 'FAILED', failure_code = _fail, failed_at = now(), processing_stage = NULL
     WHERE transfers.id = _t.id;
    PERFORM public.record_transfer_status(_t.id, _t.status, 'FAILED', _fail, 'SYSTEM', NULL);
    RETURN QUERY SELECT 'FAILED'::public.transfer_status, _fail, NULL::text;
    RETURN;
  END IF;

  IF _t.status = 'READY_FOR_CONFIRMATION' THEN
    UPDATE public.transfers SET status = 'CONFIRMED', confirmed_at = now() WHERE transfers.id = _t.id;
    PERFORM public.record_transfer_status(_t.id, _t.status, 'CONFIRMED', 'CUSTOMER_CONFIRMED', 'CUSTOMER', _user_id);
  END IF;

  -- Fund reservation (§57 – §63): idempotent through the hold key.
  _hold := _t.hold_id;
  IF _hold IS NULL THEN
    BEGIN
      _hold := public.create_account_hold(
        _src.id, _t.amount_minor, 'TRANSFER_PENDING', _t.public_reference,
        'transfer-hold:' || _t.id::text, NULL
      );
    EXCEPTION WHEN OTHERS THEN
      _hold := NULL;
    END;

    IF _hold IS NULL THEN
      UPDATE public.transfers
         SET status = 'FAILED', failure_code = 'INSUFFICIENT_FUNDS', failed_at = now()
       WHERE transfers.id = _t.id;
      PERFORM public.record_transfer_status(_t.id, 'CONFIRMED', 'FAILED', 'INSUFFICIENT_FUNDS', 'SYSTEM', NULL);
      RETURN QUERY SELECT 'FAILED'::public.transfer_status, 'INSUFFICIENT_FUNDS'::text, NULL::text;
      RETURN;
    END IF;

    UPDATE public.transfers
       SET status = 'FUNDS_RESERVED', hold_id = _hold WHERE transfers.id = _t.id;
    PERFORM public.record_transfer_status(_t.id, 'CONFIRMED', 'FUNDS_RESERVED', 'FUNDS_RESERVED', 'SYSTEM', NULL);
  END IF;

  UPDATE public.transfers
     SET status = 'PROCESSING', processing_started_at = COALESCE(transfers.processing_started_at, now()),
         processing_stage = 'LEDGER_POSTING'
   WHERE transfers.id = _t.id;
  PERFORM public.record_transfer_status(_t.id, 'FUNDS_RESERVED', 'PROCESSING', 'PROCESSING', 'SYSTEM', NULL);

  _src_ledger := public.ensure_bank_account_ledger_account(_src.id);
  _dst_ledger := public.ensure_bank_account_ledger_account(_dst.id);

  -- One balanced journal: sender liability debited, recipient liability credited.
  SELECT * INTO _posting FROM public.post_ledger_transaction(
    'TRANSFER',
    _t.currency,
    'Virement interne ' || _t.public_reference,
    'INTERNAL_TRANSFER',
    _t.public_reference,
    'transfer-posting:' || _t.id::text,
    jsonb_build_array(
      jsonb_build_object('ledgerAccountId', _src_ledger, 'side', 'DEBIT',
                         'amountMinor', _t.amount_minor,
                         'description', 'Virement vers ' || _t.recipient_display_snapshot),
      jsonb_build_object('ledgerAccountId', _dst_ledger, 'side', 'CREDIT',
                         'amountMinor', _t.amount_minor,
                         'description', 'Virement reçu de ' ||
                           COALESCE(public.customer_safe_display_name(_user_id), 'un client'))
    ),
    _user_id,
    jsonb_build_object('operationKind', 'INTERNAL_TRANSFER',
                       'counterpartyDisplay', _t.recipient_display_snapshot),
    NULL
  );

  IF _posting.id IS NULL THEN
    RAISE EXCEPTION 'PROCESSING_ERROR';
  END IF;

  PERFORM public.capture_account_hold(_hold);

  UPDATE public.transfers
     SET status = 'COMPLETED', completed_at = now(), processing_stage = NULL,
         ledger_transaction_id = _posting.id, failure_code = NULL
   WHERE transfers.id = _t.id;
  PERFORM public.record_transfer_status(_t.id, 'PROCESSING', 'COMPLETED', 'POSTED', 'SYSTEM', NULL);

  UPDATE public.beneficiaries SET last_used_at = now() WHERE beneficiaries.id = _t.beneficiary_id;

  RETURN QUERY SELECT 'COMPLETED'::public.transfer_status, NULL::text, _posting.public_reference;
END;
$function$;

REVOKE ALL ON FUNCTION public.confirm_internal_transfer(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_internal_transfer(uuid, text) TO service_role;