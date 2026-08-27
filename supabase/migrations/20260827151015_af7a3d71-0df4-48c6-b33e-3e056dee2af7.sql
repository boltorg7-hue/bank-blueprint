-- 1. provision_primary_account is a privileged provisioning routine: only trusted
--    server code (service_role) may call it. The caller identity check is kept for
--    any session-bound call.
REVOKE EXECUTE ON FUNCTION public.provision_primary_account(uuid) FROM anon, authenticated, PUBLIC;

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

  -- Session-bound callers may only provision their own account. Trusted server
  -- code (service_role, no auth.uid()) provisions on behalf of a verified user.
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
    _user_id, _reference, 'CURRENT', 'Compte personnel', 'TTD',
    2, 'ACTIVE', true, _number,
    '099', '0001', 'RBTTTTPXXX', now()
  )
  RETURNING id INTO _account_id;

  INSERT INTO public.account_balances (account_id, currency)
  VALUES (_account_id, 'TTD');

  INSERT INTO public.account_status_history (
    account_id, user_id, previous_status, new_status, reason_category
  ) VALUES (_account_id, _user_id, NULL, 'ACTIVE', 'ACCOUNT_OPENED');

  RETURN _account_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.provision_primary_account(uuid) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_primary_account(uuid) TO service_role;

-- 2. Explicit UPDATE policy for identity documents, scoped to the owner folder.
CREATE POLICY "identity docs update own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'identity-documents'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'identity-documents'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);