DROP POLICY IF EXISTS "transfer limits readable by customers" ON public.transfer_limits;
CREATE POLICY "transfer limits readable by account holders and staff"
ON public.transfer_limits FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bank_accounts AS a
    WHERE a.user_id = (SELECT auth.uid()) AND a.currency = transfer_limits.currency
  )
  OR (SELECT public.is_staff(auth.uid()))
);