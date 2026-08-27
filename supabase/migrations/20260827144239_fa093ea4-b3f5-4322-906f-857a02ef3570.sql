REVOKE ALL ON FUNCTION public.next_account_public_reference() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.provision_primary_account(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.provision_primary_account(uuid) TO authenticated, service_role;