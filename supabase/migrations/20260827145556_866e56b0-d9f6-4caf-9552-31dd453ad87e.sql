-- The activity view now runs with the privileges of the querying customer.
ALTER VIEW public.customer_account_activity SET (security_invoker = on);

-- ---------- CUSTOMER-SCOPED READ POLICIES ----------
GRANT SELECT ON public.ledger_accounts TO authenticated;
GRANT SELECT ON public.ledger_transactions TO authenticated;
GRANT SELECT ON public.ledger_entries TO authenticated;
GRANT SELECT ON public.account_holds TO authenticated;

CREATE POLICY "ledger accounts select own bank account"
ON public.ledger_accounts FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bank_accounts ba
     WHERE ba.id = ledger_accounts.bank_account_id
       AND (ba.user_id = auth.uid() OR public.is_staff(auth.uid()))
  )
);

CREATE POLICY "ledger entries select own accounts"
ON public.ledger_entries FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
      FROM public.ledger_accounts la
      JOIN public.bank_accounts ba ON ba.id = la.bank_account_id
     WHERE la.id = ledger_entries.ledger_account_id
       AND (ba.user_id = auth.uid() OR public.is_staff(auth.uid()))
  )
);

CREATE POLICY "ledger transactions select own accounts"
ON public.ledger_transactions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
      FROM public.ledger_entries e
      JOIN public.ledger_accounts la ON la.id = e.ledger_account_id
      JOIN public.bank_accounts ba ON ba.id = la.bank_account_id
     WHERE e.ledger_transaction_id = ledger_transactions.id
       AND (ba.user_id = auth.uid() OR public.is_staff(auth.uid()))
  )
);

CREATE POLICY "holds select own accounts"
ON public.account_holds FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bank_accounts ba
     WHERE ba.id = account_holds.account_id
       AND (ba.user_id = auth.uid() OR public.is_staff(auth.uid()))
  )
);

-- ---------- PRIVILEGED FUNCTIONS: SERVER ONLY ----------
REVOKE ALL ON FUNCTION public.post_ledger_transaction(
  public.ledger_transaction_type, text, text, text, text, text, jsonb, uuid, jsonb, uuid)
  FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.reverse_ledger_transaction(uuid, text, uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.create_account_hold(uuid, bigint, text, text, text, timestamptz) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.release_account_hold(uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.capture_account_hold(uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.recalculate_account_balance(uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_bank_account_ledger_account(uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.next_ledger_transaction_reference() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.check_balance_projection_integrity() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.provision_bank_account_ledger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_posted_ledger_transaction() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_ledger_entries() FROM PUBLIC, anon, authenticated;

-- Pre-existing internal helpers: not meant to be called from the API.
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_profile_privileged_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.next_account_public_reference() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.provision_primary_account(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM anon;