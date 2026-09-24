-- Run after all migrations: `supabase test db`.
DO $$
DECLARE _table text;
BEGIN
  FOREACH _table IN ARRAY ARRAY[
    'customer_preferences','notifications','notification_outbox','support_threads',
    'support_messages','customer_security_sessions','customer_security_events','security_step_up_grants'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname=_table AND c.relrowsecurity
    ) THEN RAISE EXCEPTION 'RLS_NOT_ENABLED:%',_table; END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.ledger_transactions transaction
    LEFT JOIN public.ledger_entries entry ON entry.ledger_transaction_id=transaction.id
    WHERE transaction.status='POSTED'
    GROUP BY transaction.id
    HAVING COALESCE(sum(CASE WHEN entry.entry_side='DEBIT' THEN entry.amount_minor ELSE 0 END),0)
      <> COALESCE(sum(CASE WHEN entry.entry_side='CREDIT' THEN entry.amount_minor ELSE 0 END),0)
  ) THEN RAISE EXCEPTION 'UNBALANCED_POSTED_LEDGER_TRANSACTION'; END IF;
END $$;

DO $$
BEGIN
  IF has_function_privilege('anon','public.admin_finalize_simulated_external(text)','EXECUTE')
     OR has_function_privilege('anon','public.staff_reply_support_thread(uuid,text)','EXECUTE')
     OR has_function_privilege('anon','public.issue_security_step_up(text,text)','EXECUTE')
  THEN RAISE EXCEPTION 'ANON_CAN_EXECUTE_SENSITIVE_FUNCTION'; END IF;
END $$;

DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM public.transfers WHERE status='COMPLETED' AND progress_percent<>100)
     OR EXISTS(SELECT 1 FROM public.transfers WHERE progress_percent=100 AND status<>'COMPLETED')
  THEN RAISE EXCEPTION 'TRANSFER_TERMINAL_PROGRESS_INCONSISTENT'; END IF;
END $$;
