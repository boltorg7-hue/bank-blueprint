CREATE OR REPLACE FUNCTION public.post_ledger_transaction(_transaction_type ledger_transaction_type, _currency text, _description text, _source_type text, _source_reference text, _idempotency_key text, _entries jsonb, _created_by uuid DEFAULT NULL::uuid, _metadata jsonb DEFAULT '{}'::jsonb, _reversal_of uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, public_reference text, already_posted boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _existing public.ledger_transactions;
  _txn_id uuid;
  _reference text;
  _entry jsonb;
  _line smallint := 0;
  _debits bigint := 0;
  _credits bigint := 0;
  _account public.ledger_accounts;
  _amount bigint;
  _side public.ledger_side;
  _bank_id uuid;
BEGIN
  IF _idempotency_key IS NULL OR length(trim(_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid idempotency key';
  END IF;
  IF _currency IS NULL OR length(_currency) <> 3 THEN
    RAISE EXCEPTION 'invalid currency';
  END IF;
  IF jsonb_typeof(_entries) <> 'array' OR jsonb_array_length(_entries) < 2 THEN
    RAISE EXCEPTION 'a journal requires at least two entries';
  END IF;

  -- Idempotency (§35 – §38): resolve to the existing financial result.
  SELECT * INTO _existing FROM public.ledger_transactions t WHERE t.idempotency_key = _idempotency_key;
  IF _existing.id IS NOT NULL THEN
    RETURN QUERY SELECT _existing.id, _existing.public_reference, true;
    RETURN;
  END IF;

  _reference := public.next_ledger_transaction_reference();

  INSERT INTO public.ledger_transactions
    (public_reference, transaction_type, status, currency, description,
     source_type, source_reference, idempotency_key, effective_at, metadata, created_by, reversal_of)
  VALUES
    (_reference, _transaction_type, 'DRAFT', _currency, _description,
     _source_type, _source_reference, _idempotency_key, now(), COALESCE(_metadata, '{}'::jsonb), _created_by, _reversal_of)
  RETURNING ledger_transactions.id INTO _txn_id;

  FOR _entry IN SELECT * FROM jsonb_array_elements(_entries) LOOP
    _line := _line + 1;

    IF (_entry->>'side') NOT IN ('DEBIT','CREDIT') THEN
      RAISE EXCEPTION 'invalid entry side';
    END IF;
    _side := (_entry->>'side')::public.ledger_side;

    _amount := (_entry->>'amountMinor')::bigint;
    IF _amount IS NULL OR _amount <= 0 THEN
      RAISE EXCEPTION 'entry amount must be positive';
    END IF;

    SELECT * INTO _account FROM public.ledger_accounts la
     WHERE la.id = (_entry->>'ledgerAccountId')::uuid FOR UPDATE;
    IF _account.id IS NULL THEN
      RAISE EXCEPTION 'unknown ledger account';
    END IF;
    IF _account.status <> 'ACTIVE' THEN
      RAISE EXCEPTION 'ledger account is not active';
    END IF;
    IF _account.currency <> _currency THEN
      RAISE EXCEPTION 'currency mismatch between journal and ledger account';
    END IF;

    INSERT INTO public.ledger_entries
      (ledger_transaction_id, ledger_account_id, entry_side, amount_minor, currency, line_number, description)
    VALUES (_txn_id, _account.id, _side, _amount, _currency, _line, _entry->>'description');

    IF _side = 'DEBIT' THEN _debits := _debits + _amount; ELSE _credits := _credits + _amount; END IF;
  END LOOP;

  IF _debits <> _credits THEN
    RAISE EXCEPTION 'unbalanced journal: debits % <> credits %', _debits, _credits;
  END IF;

  UPDATE public.ledger_transactions
     SET status = 'POSTED', posted_at = now()
   WHERE ledger_transactions.id = _txn_id;

  -- Projection update inside the same database transaction (§44).
  FOR _bank_id IN
    SELECT DISTINCT la.bank_account_id
      FROM public.ledger_entries e
      JOIN public.ledger_accounts la ON la.id = e.ledger_account_id
     WHERE e.ledger_transaction_id = _txn_id AND la.bank_account_id IS NOT NULL
  LOOP
    PERFORM public.recalculate_account_balance(_bank_id);
  END LOOP;

  RETURN QUERY SELECT _txn_id, _reference, false;
END;
$function$;

REVOKE ALL ON FUNCTION public.post_ledger_transaction(ledger_transaction_type, text, text, text, text, text, jsonb, uuid, jsonb, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.post_ledger_transaction(ledger_transaction_type, text, text, text, text, text, jsonb, uuid, jsonb, uuid) TO service_role;