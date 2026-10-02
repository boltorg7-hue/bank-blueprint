-- STEP 10 — Notify the customer when the bank account is activated.

CREATE OR REPLACE FUNCTION public.service_activate_approved_customer(
  _actor_user_id uuid,_customer_id uuid,_reason text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _a public.bank_accounts%ROWTYPE;
BEGIN
 IF NOT public.has_permission(_actor_user_id,'accounts.manage') THEN RAISE EXCEPTION 'forbidden'; END IF;
 IF char_length(trim(coalesce(_reason,''))) NOT BETWEEN 8 AND 300 THEN RAISE EXCEPTION 'invalid reason'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.identity_verifications WHERE user_id=_customer_id AND status='VERIFIED') THEN RAISE EXCEPTION 'identity not verified'; END IF;
 SELECT * INTO _a FROM public.bank_accounts WHERE user_id=_customer_id AND is_primary=true FOR UPDATE;
 IF _a.id IS NULL OR _a.status<>'PENDING' THEN RAISE EXCEPTION 'pending account not found'; END IF;

 UPDATE public.bank_accounts SET status='ACTIVE',opened_at=now() WHERE id=_a.id;
 UPDATE public.profiles SET lifecycle_state='ACTIVE' WHERE id=_customer_id AND lifecycle_state='BANKING_REVIEW';
 IF NOT FOUND THEN RAISE EXCEPTION 'customer not in banking review'; END IF;

 INSERT INTO public.account_status_history(account_id,user_id,previous_status,new_status,reason_category,internal_note,changed_by)
 VALUES(_a.id,_customer_id,'PENDING','ACTIVE','BANKING_APPROVED',trim(_reason),_actor_user_id);

 INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context)
 VALUES(_actor_user_id,'customer.account_activated','bank_account',_a.public_reference,'accounts.manage','ALLOWED',
        jsonb_build_object('customer_id',_customer_id,'reason',trim(_reason)));

 PERFORM public.emit_customer_notification(
   _customer_id,
   'account.activated:'||_a.id,
   'ACCOUNT',
   'SUCCESS',
   'Compte bancaire activé',
   'Votre compte bancaire a été activé. Vous pouvez maintenant accéder à votre espace bancaire.',
   '/app/accounts'
 );

 RETURN _a.public_reference;
END; $$;

REVOKE ALL ON FUNCTION public.service_activate_approved_customer(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.service_activate_approved_customer(uuid,uuid,text) TO service_role;
