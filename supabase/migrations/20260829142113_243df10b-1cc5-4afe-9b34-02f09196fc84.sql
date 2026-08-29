-- ============================================================
-- PROMPT 09 — Statements, customer documents, audit trail
-- ============================================================

CREATE TYPE public.document_lifecycle_status AS ENUM ('GENERATING','READY','FAILED','SUPERSEDED');
CREATE TYPE public.customer_document_type AS ENUM (
  'ACCOUNT_STATEMENT','TRANSFER_RECEIPT','TRANSACTION_RECEIPT','BANK_LETTER','ACCOUNT_CERTIFICATE'
);
CREATE TYPE public.statement_period_kind AS ENUM ('MONTHLY','CUSTOM');

CREATE SEQUENCE IF NOT EXISTS public.statement_reference_seq START 4821;
CREATE SEQUENCE IF NOT EXISTS public.customer_document_reference_seq START 18492;

CREATE OR REPLACE FUNCTION public.next_statement_public_reference()
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT 'STM-' || to_char(now(),'YYYY') || '-' ||
         lpad(nextval('public.statement_reference_seq')::text, 8, '0');
$$;
REVOKE ALL ON FUNCTION public.next_statement_public_reference() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.next_customer_document_reference()
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT 'DOC-' || to_char(now(),'YYYY') || '-' ||
         lpad(nextval('public.customer_document_reference_seq')::text, 8, '0');
$$;
REVOKE ALL ON FUNCTION public.next_customer_document_reference() FROM PUBLIC, anon, authenticated;

-- ---------- CUSTOMER DOCUMENTS ----------
CREATE TABLE public.customer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_reference text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.bank_accounts(id),
  document_type public.customer_document_type NOT NULL,
  title text NOT NULL,
  status public.document_lifecycle_status NOT NULL DEFAULT 'GENERATING',
  source_type text NOT NULL,
  source_reference text,
  storage_path text,
  file_name text,
  mime_type text NOT NULL DEFAULT 'application/pdf',
  size_bytes bigint,
  checksum text,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  template_version smallint NOT NULL DEFAULT 1,
  version integer NOT NULL DEFAULT 1,
  supersedes_id uuid REFERENCES public.customer_documents(id),
  failure_code text,
  generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_documents_user_idx ON public.customer_documents (user_id, created_at DESC);
CREATE UNIQUE INDEX customer_documents_source_idx
  ON public.customer_documents (user_id, document_type, source_reference, version)
  WHERE source_reference IS NOT NULL;

GRANT SELECT ON public.customer_documents TO authenticated;
GRANT ALL ON public.customer_documents TO service_role;
ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers read their own documents"
  ON public.customer_documents FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER customer_documents_updated_at
  BEFORE UPDATE ON public.customer_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- ACCOUNT STATEMENTS ----------
CREATE TABLE public.account_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_reference text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.bank_accounts(id),
  period_kind public.statement_period_kind NOT NULL DEFAULT 'CUSTOM',
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  currency text NOT NULL,
  minor_unit smallint NOT NULL DEFAULT 2,
  opening_balance_minor bigint NOT NULL DEFAULT 0,
  closing_balance_minor bigint NOT NULL DEFAULT 0,
  total_credit_minor bigint NOT NULL DEFAULT 0,
  total_debit_minor bigint NOT NULL DEFAULT 0,
  transaction_count integer NOT NULL DEFAULT 0,
  status public.document_lifecycle_status NOT NULL DEFAULT 'GENERATING',
  version integer NOT NULL DEFAULT 1,
  supersedes_id uuid REFERENCES public.account_statements(id),
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  template_version smallint NOT NULL DEFAULT 1,
  document_id uuid REFERENCES public.customer_documents(id),
  failure_code text,
  generated_at timestamptz,
  generated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX account_statements_user_idx ON public.account_statements (user_id, period_start DESC);
CREATE UNIQUE INDEX account_statements_period_idx
  ON public.account_statements (account_id, period_start, period_end, version);

GRANT SELECT ON public.account_statements TO authenticated;
GRANT ALL ON public.account_statements TO service_role;
ALTER TABLE public.account_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers read their own statements"
  ON public.account_statements FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER account_statements_updated_at
  BEFORE UPDATE ON public.account_statements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- DOCUMENT AUDIT EVENTS ----------
CREATE TABLE public.document_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.customer_documents(id) ON DELETE CASCADE,
  statement_id uuid REFERENCES public.account_statements(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX document_audit_events_user_idx ON public.document_audit_events (user_id, created_at DESC);

GRANT SELECT ON public.document_audit_events TO authenticated;
GRANT ALL ON public.document_audit_events TO service_role;
ALTER TABLE public.document_audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers read their own document events"
  ON public.document_audit_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ---------- AUTHORITATIVE BALANCE AT A POINT IN TIME ----------
CREATE OR REPLACE FUNCTION public.account_posted_balance_at(_account_id uuid, _at timestamptz)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(CASE WHEN e.entry_side = 'CREDIT' THEN e.amount_minor ELSE -e.amount_minor END), 0)::bigint
  FROM public.ledger_entries e
  JOIN public.ledger_transactions t ON t.id = e.ledger_transaction_id
  JOIN public.ledger_accounts la ON la.id = e.ledger_account_id
  WHERE la.bank_account_id = _account_id
    AND t.status = 'POSTED'
    AND t.effective_at < _at;
$$;
REVOKE ALL ON FUNCTION public.account_posted_balance_at(uuid, timestamptz) FROM PUBLIC, anon, authenticated;

-- ---------- STATEMENT ISSUANCE ----------
CREATE OR REPLACE FUNCTION public.issue_account_statement(
  _user_id uuid,
  _account_reference text,
  _period_start timestamptz,
  _period_end timestamptz,
  _period_kind public.statement_period_kind
)
RETURNS TABLE (reference text, reused boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _acc public.bank_accounts;
  _existing public.account_statements;
  _opening bigint;
  _closing bigint;
  _credits bigint := 0;
  _debits bigint := 0;
  _count integer := 0;
  _lines jsonb;
  _holder text;
  _snapshot jsonb;
  _reference text;
BEGIN
  SELECT * INTO _acc FROM public.bank_accounts
   WHERE public_reference = _account_reference AND user_id = _user_id;
  IF _acc.id IS NULL THEN RAISE EXCEPTION 'ACCOUNT_UNAVAILABLE'; END IF;
  IF _period_start >= _period_end THEN RAISE EXCEPTION 'INVALID_PERIOD'; END IF;
  IF _period_end > now() THEN RAISE EXCEPTION 'PERIOD_IN_FUTURE'; END IF;
  IF _period_end - _period_start > interval '400 days' THEN RAISE EXCEPTION 'PERIOD_TOO_LONG'; END IF;
  IF _acc.opened_at IS NOT NULL AND _period_end <= _acc.opened_at THEN
    RAISE EXCEPTION 'PERIOD_BEFORE_ACCOUNT_OPENING';
  END IF;

  -- Already issued for the exact same period: reuse it (§46, §47).
  SELECT * INTO _existing FROM public.account_statements
   WHERE account_id = _acc.id AND period_start = _period_start
     AND period_end = _period_end AND status = 'READY'
   ORDER BY version DESC LIMIT 1;
  IF _existing.id IS NOT NULL THEN
    RETURN QUERY SELECT _existing.public_reference, true;
    RETURN;
  END IF;

  -- Recover an interrupted or failed generation instead of duplicating (§156).
  SELECT * INTO _existing FROM public.account_statements
   WHERE account_id = _acc.id AND period_start = _period_start
     AND period_end = _period_end AND status IN ('GENERATING','FAILED')
   ORDER BY created_at DESC LIMIT 1;

  _opening := public.account_posted_balance_at(_acc.id, _period_start);
  _closing := public.account_posted_balance_at(_acc.id, _period_end);

  WITH statement_lines AS (
    SELECT
      t.public_reference AS line_reference,
      t.effective_at AS occurred_at,
      COALESCE(e.description, t.description) AS description,
      CASE WHEN e.entry_side = 'CREDIT' THEN 'CREDIT' ELSE 'DEBIT' END AS direction,
      e.amount_minor AS amount_minor,
      SUM(CASE WHEN e.entry_side = 'CREDIT' THEN e.amount_minor ELSE -e.amount_minor END)
        OVER (ORDER BY t.effective_at, e.id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative
    FROM public.ledger_entries e
    JOIN public.ledger_transactions t ON t.id = e.ledger_transaction_id
    JOIN public.ledger_accounts la ON la.id = e.ledger_account_id
    WHERE la.bank_account_id = _acc.id
      AND t.status = 'POSTED'
      AND t.effective_at >= _period_start
      AND t.effective_at < _period_end
  )
  SELECT
    jsonb_agg(jsonb_build_object(
      'reference', line_reference,
      'occurredAt', occurred_at,
      'description', description,
      'direction', direction,
      'amountMinor', amount_minor,
      'balanceMinor', _opening + cumulative
    ) ORDER BY occurred_at, line_reference),
    COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount_minor ELSE 0 END), 0)::bigint,
    COALESCE(SUM(CASE WHEN direction = 'DEBIT' THEN amount_minor ELSE 0 END), 0)::bigint,
    COUNT(*)::integer
  INTO _lines, _credits, _debits, _count
  FROM statement_lines;

  -- Reconciliation gate (§11, §12, §25).
  IF _opening + _credits - _debits <> _closing THEN
    RAISE EXCEPTION 'STATEMENT_RECONCILIATION_FAILED';
  END IF;

  SELECT NULLIF(trim(concat_ws(' ', p.first_name, p.middle_name, p.last_name)), '')
    INTO _holder FROM public.profiles p WHERE p.id = _user_id;
  _holder := COALESCE(_holder, 'Titulaire du compte');

  _snapshot := jsonb_build_object(
    'holderName', _holder,
    'accountReference', _acc.public_reference,
    'accountNumber', _acc.account_number,
    'accountMaskedNumber', right(_acc.account_number, 4),
    'accountType', _acc.account_type::text,
    'accountDisplayName', _acc.display_name,
    'iban', _acc.iban,
    'bic', _acc.bic,
    'currency', _acc.currency,
    'minorUnit', _acc.currency_minor_unit,
    'periodStart', _period_start,
    'periodEnd', _period_end,
    'openingBalanceMinor', _opening,
    'closingBalanceMinor', _closing,
    'totalCreditMinor', _credits,
    'totalDebitMinor', _debits,
    'transactionCount', _count,
    'lines', COALESCE(_lines, '[]'::jsonb)
  );

  IF _existing.id IS NOT NULL THEN
    UPDATE public.account_statements SET
      period_kind = _period_kind,
      currency = _acc.currency,
      minor_unit = _acc.currency_minor_unit,
      opening_balance_minor = _opening,
      closing_balance_minor = _closing,
      total_credit_minor = _credits,
      total_debit_minor = _debits,
      transaction_count = _count,
      status = 'GENERATING',
      failure_code = NULL,
      snapshot = _snapshot
    WHERE id = _existing.id;
    _reference := _existing.public_reference;
  ELSE
    _reference := public.next_statement_public_reference();
    INSERT INTO public.account_statements (
      public_reference, user_id, account_id, period_kind, period_start, period_end,
      currency, minor_unit, opening_balance_minor, closing_balance_minor,
      total_credit_minor, total_debit_minor, transaction_count, status, snapshot, generated_by
    ) VALUES (
      _reference, _user_id, _acc.id, _period_kind, _period_start, _period_end,
      _acc.currency, _acc.currency_minor_unit, _opening, _closing,
      _credits, _debits, _count, 'GENERATING', _snapshot, _user_id
    );
  END IF;

  INSERT INTO public.document_audit_events (user_id, statement_id, event_type, context)
  SELECT _user_id, s.id, 'statement_requested',
         jsonb_build_object('reference', _reference, 'periodStart', _period_start, 'periodEnd', _period_end)
  FROM public.account_statements s WHERE s.public_reference = _reference;

  RETURN QUERY SELECT _reference, false;
END;
$$;
REVOKE ALL ON FUNCTION public.issue_account_statement(uuid, text, timestamptz, timestamptz, public.statement_period_kind)
  FROM PUBLIC, anon, authenticated;

-- ---------- STATEMENT FINALISATION ----------
CREATE OR REPLACE FUNCTION public.finalize_account_statement(
  _user_id uuid,
  _statement_reference text,
  _storage_path text,
  _file_name text,
  _mime_type text,
  _size_bytes bigint,
  _checksum text
)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _stmt public.account_statements;
  _doc_reference text;
  _doc_id uuid;
BEGIN
  SELECT * INTO _stmt FROM public.account_statements
   WHERE public_reference = _statement_reference AND user_id = _user_id;
  IF _stmt.id IS NULL THEN RAISE EXCEPTION 'STATEMENT_UNAVAILABLE'; END IF;

  IF _stmt.document_id IS NOT NULL THEN
    UPDATE public.customer_documents SET
      storage_path = _storage_path, file_name = _file_name, mime_type = _mime_type,
      size_bytes = _size_bytes, checksum = _checksum, status = 'READY',
      generated_at = now(), failure_code = NULL
    WHERE id = _stmt.document_id
    RETURNING public_reference INTO _doc_reference;
    _doc_id := _stmt.document_id;
  ELSE
    _doc_reference := public.next_customer_document_reference();
    INSERT INTO public.customer_documents (
      public_reference, user_id, account_id, document_type, title, status,
      source_type, source_reference, storage_path, file_name, mime_type,
      size_bytes, checksum, snapshot, generated_at
    ) VALUES (
      _doc_reference, _user_id, _stmt.account_id, 'ACCOUNT_STATEMENT',
      'Relevé de compte ' || to_char(_stmt.period_start, 'DD/MM/YYYY') || ' – ' ||
        to_char(_stmt.period_end - interval '1 day', 'DD/MM/YYYY'),
      'READY', 'STATEMENT', _stmt.public_reference, _storage_path, _file_name,
      _mime_type, _size_bytes, _checksum, _stmt.snapshot, now()
    ) RETURNING id INTO _doc_id;
  END IF;

  UPDATE public.account_statements SET
    status = 'READY', document_id = _doc_id, generated_at = now(), failure_code = NULL
  WHERE id = _stmt.id;

  INSERT INTO public.document_audit_events (user_id, statement_id, document_id, event_type, context)
  VALUES (_user_id, _stmt.id, _doc_id, 'statement_generated',
          jsonb_build_object('reference', _stmt.public_reference, 'documentReference', _doc_reference));

  RETURN _doc_reference;
END;
$$;
REVOKE ALL ON FUNCTION public.finalize_account_statement(uuid, text, text, text, text, bigint, text)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.fail_account_statement(
  _user_id uuid, _statement_reference text, _failure_code text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _stmt public.account_statements;
BEGIN
  SELECT * INTO _stmt FROM public.account_statements
   WHERE public_reference = _statement_reference AND user_id = _user_id;
  IF _stmt.id IS NULL THEN RETURN; END IF;

  UPDATE public.account_statements
     SET status = 'FAILED', failure_code = left(COALESCE(_failure_code,'GENERATION_FAILED'), 60)
   WHERE id = _stmt.id;

  INSERT INTO public.document_audit_events (user_id, statement_id, event_type, context)
  VALUES (_user_id, _stmt.id, 'statement_generation_failed',
          jsonb_build_object('reference', _stmt.public_reference, 'failureCode', _failure_code));
END;
$$;
REVOKE ALL ON FUNCTION public.fail_account_statement(uuid, text, text) FROM PUBLIC, anon, authenticated;

-- ---------- RECEIPTS ----------
-- Prepares the immutable snapshot of an eligible receipt (§74 – §84).
CREATE OR REPLACE FUNCTION public.prepare_customer_receipt(
  _user_id uuid,
  _document_type public.customer_document_type,
  _source_reference text
)
RETURNS TABLE (reference text, reused boolean, title text, snapshot jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _existing public.customer_documents;
  _doc_reference text;
  _title text;
  _snapshot jsonb;
  _account_id uuid;
  _trf public.transfers;
  _ben public.beneficiaries;
  _src public.bank_accounts;
  _txn public.ledger_transactions;
BEGIN
  IF _document_type NOT IN ('TRANSFER_RECEIPT','TRANSACTION_RECEIPT') THEN
    RAISE EXCEPTION 'RECEIPT_NOT_SUPPORTED';
  END IF;

  SELECT * INTO _existing FROM public.customer_documents
   WHERE user_id = _user_id AND document_type = _document_type
     AND source_reference = _source_reference AND status = 'READY'
   ORDER BY version DESC LIMIT 1;
  IF _existing.id IS NOT NULL THEN
    RETURN QUERY SELECT _existing.public_reference, true, _existing.title, _existing.snapshot;
    RETURN;
  END IF;

  IF _document_type = 'TRANSFER_RECEIPT' THEN
    SELECT * INTO _trf FROM public.transfers
     WHERE public_reference = _source_reference AND sender_user_id = _user_id;
    IF _trf.id IS NULL THEN RAISE EXCEPTION 'TRANSFER_UNAVAILABLE'; END IF;
    -- Final receipts only for authoritative completion (§78 – §81, §173).
    IF _trf.status <> 'COMPLETED' OR _trf.progress_percent <> 100 THEN
      RAISE EXCEPTION 'RECEIPT_NOT_AVAILABLE';
    END IF;

    SELECT * INTO _src FROM public.bank_accounts WHERE id = _trf.source_account_id;
    IF _trf.beneficiary_id IS NOT NULL THEN
      SELECT * INTO _ben FROM public.beneficiaries WHERE id = _trf.beneficiary_id;
    END IF;
    _account_id := _trf.source_account_id;
    _title := 'Reçu de virement ' || _trf.public_reference;
    _snapshot := jsonb_build_object(
      'kind', _trf.transfer_kind::text,
      'transferReference', _trf.public_reference,
      'status', _trf.status::text,
      'amountMinor', _trf.amount_minor,
      'currency', _trf.currency,
      'minorUnit', COALESCE(_src.currency_minor_unit, 2),
      'customerReference', _trf.customer_reference,
      'recipientDisplay', _trf.recipient_display_snapshot,
      'destinationMasked', _trf.destination_masked_snapshot,
      'sourceMasked', _trf.source_masked_snapshot,
      'sourceAccountReference', _src.public_reference,
      'destinationBankName', _ben.external_bank_name,
      'destinationCountry', _ben.external_country,
      'completedAt', COALESCE(_trf.completed_at, _trf.finalized_at, _trf.updated_at),
      'transactionReference', (
        SELECT lt.public_reference FROM public.ledger_transactions lt
         WHERE lt.id = _trf.ledger_transaction_id
      )
    );
  ELSE
    SELECT * INTO _txn FROM public.ledger_transactions
     WHERE public_reference = _source_reference AND status = 'POSTED';
    IF _txn.id IS NULL THEN RAISE EXCEPTION 'TRANSACTION_UNAVAILABLE'; END IF;

    SELECT ba.id INTO _account_id
      FROM public.ledger_entries e
      JOIN public.ledger_accounts la ON la.id = e.ledger_account_id
      JOIN public.bank_accounts ba ON ba.id = la.bank_account_id
     WHERE e.ledger_transaction_id = _txn.id AND ba.user_id = _user_id
     LIMIT 1;
    IF _account_id IS NULL THEN RAISE EXCEPTION 'TRANSACTION_UNAVAILABLE'; END IF;

    SELECT * INTO _src FROM public.bank_accounts WHERE id = _account_id;
    _title := 'Reçu d''opération ' || _txn.public_reference;

    SELECT jsonb_build_object(
      'transactionReference', _txn.public_reference,
      'transactionType', _txn.transaction_type::text,
      'status', 'COMPLETED',
      'occurredAt', _txn.effective_at,
      'completedAt', _txn.posted_at,
      'description', COALESCE(e.description, _txn.description),
      'direction', CASE WHEN e.entry_side = 'CREDIT' THEN 'INCOMING' ELSE 'OUTGOING' END,
      'amountMinor', e.amount_minor,
      'currency', e.currency,
      'minorUnit', _src.currency_minor_unit,
      'accountReference', _src.public_reference,
      'accountMaskedNumber', right(_src.account_number, 4),
      'counterpartyDisplay', _txn.metadata->>'counterpartyDisplay'
    ) INTO _snapshot
    FROM public.ledger_entries e
    JOIN public.ledger_accounts la ON la.id = e.ledger_account_id
    WHERE e.ledger_transaction_id = _txn.id AND la.bank_account_id = _account_id
    ORDER BY e.line_number
    LIMIT 1;
  END IF;

  _doc_reference := public.next_customer_document_reference();
  INSERT INTO public.customer_documents (
    public_reference, user_id, account_id, document_type, title, status,
    source_type, source_reference, snapshot
  ) VALUES (
    _doc_reference, _user_id, _account_id, _document_type, _title, 'GENERATING',
    CASE WHEN _document_type = 'TRANSFER_RECEIPT' THEN 'TRANSFER' ELSE 'TRANSACTION' END,
    _source_reference, _snapshot
  );

  RETURN QUERY SELECT _doc_reference, false, _title, _snapshot;
END;
$$;
REVOKE ALL ON FUNCTION public.prepare_customer_receipt(uuid, public.customer_document_type, text)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.finalize_customer_document(
  _user_id uuid,
  _document_reference text,
  _storage_path text,
  _file_name text,
  _mime_type text,
  _size_bytes bigint,
  _checksum text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _doc public.customer_documents;
BEGIN
  SELECT * INTO _doc FROM public.customer_documents
   WHERE public_reference = _document_reference AND user_id = _user_id;
  IF _doc.id IS NULL THEN RAISE EXCEPTION 'DOCUMENT_UNAVAILABLE'; END IF;

  UPDATE public.customer_documents SET
    storage_path = _storage_path, file_name = _file_name, mime_type = _mime_type,
    size_bytes = _size_bytes, checksum = _checksum, status = 'READY',
    generated_at = now(), failure_code = NULL
  WHERE id = _doc.id;

  INSERT INTO public.document_audit_events (user_id, document_id, event_type, context)
  VALUES (_user_id, _doc.id, 'receipt_ready',
          jsonb_build_object('documentReference', _doc.public_reference,
                             'documentType', _doc.document_type::text));
END;
$$;
REVOKE ALL ON FUNCTION public.finalize_customer_document(uuid, text, text, text, text, bigint, text)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.fail_customer_document(
  _user_id uuid, _document_reference text, _failure_code text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _doc public.customer_documents;
BEGIN
  SELECT * INTO _doc FROM public.customer_documents
   WHERE public_reference = _document_reference AND user_id = _user_id;
  IF _doc.id IS NULL THEN RETURN; END IF;

  UPDATE public.customer_documents
     SET status = 'FAILED', failure_code = left(COALESCE(_failure_code,'GENERATION_FAILED'), 60)
   WHERE id = _doc.id;
END;
$$;
REVOKE ALL ON FUNCTION public.fail_customer_document(uuid, text, text) FROM PUBLIC, anon, authenticated;

-- ---------- AUDIT HELPER ----------
CREATE OR REPLACE FUNCTION public.record_document_event(
  _user_id uuid, _document_reference text, _event_type text, _context jsonb
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _doc public.customer_documents;
BEGIN
  SELECT * INTO _doc FROM public.customer_documents
   WHERE public_reference = _document_reference AND user_id = _user_id;
  IF _doc.id IS NULL THEN RETURN; END IF;

  INSERT INTO public.document_audit_events (user_id, document_id, event_type, context)
  VALUES (_user_id, _doc.id, left(COALESCE(_event_type,'document_event'), 60),
          COALESCE(_context, '{}'::jsonb));
END;
$$;
REVOKE ALL ON FUNCTION public.record_document_event(uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated;