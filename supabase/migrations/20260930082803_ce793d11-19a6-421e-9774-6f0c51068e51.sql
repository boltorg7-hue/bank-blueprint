CREATE TABLE public.onboarding_approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES public.identity_verifications(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recommendation text NOT NULL CHECK (recommendation IN ('APPROVE','REJECT')),
  status text NOT NULL DEFAULT 'PENDING_SECOND_REVIEW' CHECK (status IN ('PENDING_SECOND_REVIEW','APPROVED','REJECTED','CANCELLED')),
  reviewer_user_id uuid NOT NULL,
  reviewer_note text NOT NULL,
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  checker_user_id uuid,
  checker_note text,
  decided_at timestamptz,
  account_id uuid REFERENCES public.bank_accounts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.onboarding_approval_requests TO authenticated;
GRANT ALL ON public.onboarding_approval_requests TO service_role;
ALTER TABLE public.onboarding_approval_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authorized staff read onboarding approvals"
ON public.onboarding_approval_requests FOR SELECT TO authenticated
USING (public.has_permission(auth.uid(), 'kyc.review') OR public.has_permission(auth.uid(), 'kyc.approve'));
CREATE TRIGGER onboarding_approval_requests_set_updated_at
BEFORE UPDATE ON public.onboarding_approval_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE UNIQUE INDEX onboarding_one_pending_approval
ON public.onboarding_approval_requests(verification_id)
WHERE status = 'PENDING_SECOND_REVIEW';
CREATE INDEX onboarding_approvals_status_created_idx
ON public.onboarding_approval_requests(status, created_at DESC);

INSERT INTO public.role_permissions(role, permission) VALUES
  ('administrator', 'customers.invite'),
  ('super_admin', 'customers.invite'),
  ('supervisor', 'kyc.approve'),
  ('super_admin', 'kyc.approve')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.admin_record_customer_invitation(
  _customer_id uuid,
  _email text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_permission(auth.uid(), 'customers.invite') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _customer_id IS NULL OR _email IS NULL OR position('@' in _email) < 2 THEN RAISE EXCEPTION 'invalid invitation'; END IF;
  INSERT INTO public.admin_audit_events(actor_user_id, action, resource_type, resource_reference, permission_checked, result, context)
  VALUES (auth.uid(), 'customer.invited', 'customer', _customer_id::text, 'customers.invite', 'ALLOWED', jsonb_build_object('email', lower(trim(_email))));
END; $$;
REVOKE ALL ON FUNCTION public.admin_record_customer_invitation(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_record_customer_invitation(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_identity_application(
  _customer_id uuid,
  _recommendation text,
  _note text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _verification public.identity_verifications%ROWTYPE;
  _request_id uuid;
  _document_count integer;
BEGIN
  IF NOT public.has_permission(auth.uid(), 'kyc.review') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _recommendation NOT IN ('APPROVE','REJECT','REQUEST_INFO') OR char_length(trim(coalesce(_note,''))) NOT BETWEEN 8 AND 500 THEN RAISE EXCEPTION 'invalid review'; END IF;
  SELECT * INTO _verification FROM public.identity_verifications WHERE user_id = _customer_id FOR UPDATE;
  IF _verification.id IS NULL THEN RAISE EXCEPTION 'verification not found'; END IF;
  IF _verification.status NOT IN ('SUBMITTED','UNDER_REVIEW') THEN RAISE EXCEPTION 'application not reviewable'; END IF;
  IF EXISTS (SELECT 1 FROM public.onboarding_approval_requests WHERE verification_id = _verification.id AND status = 'PENDING_SECOND_REVIEW') THEN RAISE EXCEPTION 'approval already pending'; END IF;

  IF _recommendation = 'REQUEST_INFO' THEN
    UPDATE public.identity_verifications SET status = 'ADDITIONAL_INFORMATION_REQUIRED', requested_information = trim(_note), decision_reason = NULL WHERE id = _verification.id;
    UPDATE public.profiles SET lifecycle_state = 'ADDITIONAL_DOCUMENT_REQUIRED' WHERE id = _customer_id;
    UPDATE public.verification_documents SET status = 'ACTION_REQUIRED' WHERE verification_id = _verification.id AND status = 'UNDER_REVIEW';
    INSERT INTO public.verification_status_history(verification_id,user_id,previous_status,new_status,changed_by,note)
    VALUES (_verification.id,_customer_id,_verification.status,'ADDITIONAL_INFORMATION_REQUIRED',auth.uid(),trim(_note));
    INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context)
    VALUES(auth.uid(),'kyc.additional_information_requested','identity_verification',_verification.id::text,'kyc.review','ALLOWED',jsonb_build_object('customer_id',_customer_id,'note',trim(_note)));
    RETURN NULL;
  END IF;

  SELECT count(*) INTO _document_count FROM public.verification_documents WHERE verification_id = _verification.id;
  IF _recommendation = 'APPROVE' AND _document_count < 2 THEN RAISE EXCEPTION 'required documents missing'; END IF;
  INSERT INTO public.onboarding_approval_requests(verification_id,customer_id,recommendation,reviewer_user_id,reviewer_note)
  VALUES(_verification.id,_customer_id,_recommendation,auth.uid(),trim(_note)) RETURNING id INTO _request_id;
  UPDATE public.identity_verifications SET status = 'UNDER_REVIEW', requested_information = NULL, decision_reason = NULL WHERE id = _verification.id;
  UPDATE public.profiles SET lifecycle_state = 'IDENTITY_UNDER_REVIEW' WHERE id = _customer_id;
  INSERT INTO public.verification_status_history(verification_id,user_id,previous_status,new_status,changed_by,note)
  VALUES(_verification.id,_customer_id,_verification.status,'UNDER_REVIEW',auth.uid(),trim(_note));
  INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context)
  VALUES(auth.uid(),'kyc.review_recommended','identity_verification',_verification.id::text,'kyc.review','ALLOWED',jsonb_build_object('customer_id',_customer_id,'recommendation',_recommendation,'request_id',_request_id));
  RETURN _request_id;
END; $$;
REVOKE ALL ON FUNCTION public.review_identity_application(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_identity_application(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.open_limited_primary_account(_user_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _account_id uuid; _reference text; _number text;
BEGIN
  SELECT id INTO _account_id FROM public.bank_accounts WHERE user_id = _user_id ORDER BY is_primary DESC, created_at LIMIT 1;
  IF _account_id IS NOT NULL THEN RETURN _account_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND lifecycle_state = 'BANKING_REVIEW') THEN RAISE EXCEPTION 'customer not ready'; END IF;
  _reference := public.next_account_public_reference();
  _number := '30' || lpad((floor(random() * 100000000)::bigint)::text, 8, '0');
  INSERT INTO public.bank_accounts(user_id,public_reference,account_type,display_name,currency,currency_minor_unit,status,is_primary,account_number,bank_code,branch_code,bic)
  VALUES(_user_id,_reference,'CURRENT','Compte personnel','USD',2,'PENDING',true,_number,'099','0001','RBTTTTPXXX') RETURNING id INTO _account_id;
  INSERT INTO public.account_balances(account_id,currency) VALUES(_account_id,'USD');
  INSERT INTO public.account_status_history(account_id,user_id,previous_status,new_status,reason_category)
  VALUES(_account_id,_user_id,NULL,'PENDING','KYC_APPROVED_BANKING_REVIEW');
  RETURN _account_id;
END; $$;
REVOKE ALL ON FUNCTION public.open_limited_primary_account(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.open_limited_primary_account(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.decide_identity_application(
  _request_id uuid,
  _confirm boolean,
  _note text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _request public.onboarding_approval_requests%ROWTYPE;
  _verification public.identity_verifications%ROWTYPE;
  _account_id uuid;
  _final_status public.identity_verification_status;
  _lifecycle public.customer_lifecycle_state;
BEGIN
  IF NOT public.has_permission(auth.uid(), 'kyc.approve') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _confirm IS NULL OR char_length(trim(coalesce(_note,''))) NOT BETWEEN 8 AND 500 THEN RAISE EXCEPTION 'invalid decision'; END IF;
  SELECT * INTO _request FROM public.onboarding_approval_requests WHERE id = _request_id FOR UPDATE;
  IF _request.id IS NULL THEN RAISE EXCEPTION 'request not found'; END IF;
  IF _request.status <> 'PENDING_SECOND_REVIEW' THEN RAISE EXCEPTION 'already decided'; END IF;
  IF _request.reviewer_user_id = auth.uid() THEN RAISE EXCEPTION 'four-eyes approval required'; END IF;
  SELECT * INTO _verification FROM public.identity_verifications WHERE id = _request.verification_id FOR UPDATE;
  IF _verification.status <> 'UNDER_REVIEW' THEN RAISE EXCEPTION 'application state changed'; END IF;

  IF NOT _confirm THEN
    UPDATE public.onboarding_approval_requests SET status='REJECTED',checker_user_id=auth.uid(),checker_note=trim(_note),decided_at=now() WHERE id=_request.id;
    UPDATE public.identity_verifications SET status='SUBMITTED',decision_reason=trim(_note) WHERE id=_verification.id;
    UPDATE public.profiles SET lifecycle_state='IDENTITY_SUBMITTED' WHERE id=_request.customer_id;
    _final_status := 'SUBMITTED'; _lifecycle := 'IDENTITY_SUBMITTED';
  ELSIF _request.recommendation = 'APPROVE' THEN
    UPDATE public.identity_verifications SET status='VERIFIED',decided_at=now(),decision_reason=trim(_note),requested_information=NULL WHERE id=_verification.id;
    UPDATE public.verification_documents SET status='ACCEPTED',reviewed_at=now(),rejection_reason=NULL WHERE verification_id=_verification.id AND status IN ('UPLOADED','UNDER_REVIEW');
    UPDATE public.profiles SET lifecycle_state='BANKING_REVIEW' WHERE id=_request.customer_id;
    _account_id := public.open_limited_primary_account(_request.customer_id);
    UPDATE public.onboarding_approval_requests SET status='APPROVED',checker_user_id=auth.uid(),checker_note=trim(_note),decided_at=now(),account_id=_account_id WHERE id=_request.id;
    _final_status := 'VERIFIED'; _lifecycle := 'BANKING_REVIEW';
  ELSE
    UPDATE public.identity_verifications SET status='REJECTED',decided_at=now(),decision_reason=trim(_note) WHERE id=_verification.id;
    UPDATE public.verification_documents SET status='REJECTED',reviewed_at=now(),rejection_reason=trim(_note) WHERE verification_id=_verification.id AND status IN ('UPLOADED','UNDER_REVIEW');
    UPDATE public.profiles SET lifecycle_state='IDENTITY_REQUIRED' WHERE id=_request.customer_id;
    UPDATE public.onboarding_approval_requests SET status='APPROVED',checker_user_id=auth.uid(),checker_note=trim(_note),decided_at=now() WHERE id=_request.id;
    _final_status := 'REJECTED'; _lifecycle := 'IDENTITY_REQUIRED';
  END IF;

  INSERT INTO public.verification_status_history(verification_id,user_id,previous_status,new_status,changed_by,note)
  VALUES(_verification.id,_request.customer_id,_verification.status,_final_status,auth.uid(),trim(_note));
  INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context)
  VALUES(auth.uid(),CASE WHEN _confirm THEN 'kyc.second_review_confirmed' ELSE 'kyc.second_review_returned' END,'identity_verification',_verification.id::text,'kyc.approve','ALLOWED',jsonb_build_object('customer_id',_request.customer_id,'recommendation',_request.recommendation,'lifecycle',_lifecycle,'account_id',_account_id));
  RETURN jsonb_build_object('status',_final_status,'lifecycle',_lifecycle,'account_id',_account_id);
END; $$;
REVOKE ALL ON FUNCTION public.decide_identity_application(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decide_identity_application(uuid, boolean, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.activate_approved_customer(
  _customer_id uuid,
  _reason text
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _account public.bank_accounts%ROWTYPE;
BEGIN
  IF NOT public.has_permission(auth.uid(), 'accounts.manage') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF char_length(trim(coalesce(_reason,''))) NOT BETWEEN 8 AND 300 THEN RAISE EXCEPTION 'invalid reason'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.identity_verifications WHERE user_id=_customer_id AND status='VERIFIED') THEN RAISE EXCEPTION 'identity not verified'; END IF;
  SELECT * INTO _account FROM public.bank_accounts WHERE user_id=_customer_id AND is_primary=true FOR UPDATE;
  IF _account.id IS NULL OR _account.status <> 'PENDING' THEN RAISE EXCEPTION 'pending account not found'; END IF;
  UPDATE public.bank_accounts SET status='ACTIVE',opened_at=now() WHERE id=_account.id;
  UPDATE public.profiles SET lifecycle_state='ACTIVE' WHERE id=_customer_id AND lifecycle_state='BANKING_REVIEW';
  IF NOT FOUND THEN RAISE EXCEPTION 'customer not in banking review'; END IF;
  INSERT INTO public.account_status_history(account_id,user_id,previous_status,new_status,reason_category,internal_note,changed_by)
  VALUES(_account.id,_customer_id,'PENDING','ACTIVE','BANKING_APPROVED',trim(_reason),auth.uid());
  INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context)
  VALUES(auth.uid(),'customer.account_activated','bank_account',_account.public_reference,'accounts.manage','ALLOWED',jsonb_build_object('customer_id',_customer_id,'reason',trim(_reason)));
  RETURN _account.public_reference;
END; $$;
REVOKE ALL ON FUNCTION public.activate_approved_customer(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_approved_customer(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_customer_state(
  _customer_id uuid,
  _state public.customer_lifecycle_state,
  _reason text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _previous public.customer_lifecycle_state;
BEGIN
  IF NOT public.has_permission(auth.uid(), 'customers.write') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _state NOT IN ('ACTIVE','RESTRICTED','SUSPENDED') OR char_length(trim(coalesce(_reason,''))) NOT BETWEEN 8 AND 300 THEN RAISE EXCEPTION 'invalid state change'; END IF;
  SELECT lifecycle_state INTO _previous FROM public.profiles WHERE id = _customer_id FOR UPDATE;
  IF _previous IS NULL THEN RAISE EXCEPTION 'customer not found'; END IF;
  IF _state='ACTIVE' AND (_previous NOT IN ('RESTRICTED','SUSPENDED') OR NOT EXISTS (SELECT 1 FROM public.bank_accounts WHERE user_id=_customer_id AND status='ACTIVE')) THEN RAISE EXCEPTION 'dedicated activation required'; END IF;
  UPDATE public.profiles SET lifecycle_state = _state WHERE id = _customer_id;
  INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context)
  VALUES(auth.uid(),'customer.state_changed','customer',_customer_id::text,'customers.write','ALLOWED',jsonb_build_object('previous',_previous,'new',_state,'reason',trim(_reason)));
END; $$;
REVOKE ALL ON FUNCTION public.admin_set_customer_state(uuid, public.customer_lifecycle_state, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_customer_state(uuid, public.customer_lifecycle_state, text) TO authenticated;