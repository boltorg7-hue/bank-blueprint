REVOKE EXECUTE ON FUNCTION public.admin_record_customer_invitation(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.review_identity_application(uuid, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.decide_identity_application(uuid, boolean, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.activate_approved_customer(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_record_customer_invitation(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.review_identity_application(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.decide_identity_application(uuid, boolean, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.activate_approved_customer(uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.service_record_customer_invitation(_actor_user_id uuid, _customer_id uuid, _email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.has_permission(_actor_user_id,'customers.invite') THEN RAISE EXCEPTION 'forbidden'; END IF;
 IF _customer_id IS NULL OR _email IS NULL OR position('@' in _email)<2 THEN RAISE EXCEPTION 'invalid invitation'; END IF;
 INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context)
 VALUES(_actor_user_id,'customer.invited','customer',_customer_id::text,'customers.invite','ALLOWED',jsonb_build_object('email',lower(trim(_email))));
END; $$;
REVOKE ALL ON FUNCTION public.service_record_customer_invitation(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.service_record_customer_invitation(uuid,uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.service_review_identity_application(_actor_user_id uuid,_customer_id uuid,_recommendation text,_note text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _v public.identity_verifications%ROWTYPE; _rid uuid; _count integer;
BEGIN
 IF NOT public.has_permission(_actor_user_id,'kyc.review') THEN RAISE EXCEPTION 'forbidden'; END IF;
 IF _recommendation NOT IN('APPROVE','REJECT','REQUEST_INFO') OR char_length(trim(coalesce(_note,''))) NOT BETWEEN 8 AND 500 THEN RAISE EXCEPTION 'invalid review'; END IF;
 SELECT * INTO _v FROM public.identity_verifications WHERE user_id=_customer_id FOR UPDATE;
 IF _v.id IS NULL THEN RAISE EXCEPTION 'verification not found'; END IF;
 IF _v.status NOT IN('SUBMITTED','UNDER_REVIEW') THEN RAISE EXCEPTION 'application not reviewable'; END IF;
 IF EXISTS(SELECT 1 FROM public.onboarding_approval_requests WHERE verification_id=_v.id AND status='PENDING_SECOND_REVIEW') THEN RAISE EXCEPTION 'approval already pending'; END IF;
 IF _recommendation='REQUEST_INFO' THEN
  UPDATE public.identity_verifications SET status='ADDITIONAL_INFORMATION_REQUIRED',requested_information=trim(_note),decision_reason=NULL WHERE id=_v.id;
  UPDATE public.profiles SET lifecycle_state='ADDITIONAL_DOCUMENT_REQUIRED' WHERE id=_customer_id;
  UPDATE public.verification_documents SET status='ACTION_REQUIRED' WHERE verification_id=_v.id AND status='UNDER_REVIEW';
  INSERT INTO public.verification_status_history(verification_id,user_id,previous_status,new_status,changed_by,note) VALUES(_v.id,_customer_id,_v.status,'ADDITIONAL_INFORMATION_REQUIRED',_actor_user_id,trim(_note));
  INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context) VALUES(_actor_user_id,'kyc.additional_information_requested','identity_verification',_v.id::text,'kyc.review','ALLOWED',jsonb_build_object('customer_id',_customer_id,'note',trim(_note)));
  RETURN NULL;
 END IF;
 SELECT count(*) INTO _count FROM public.verification_documents WHERE verification_id=_v.id;
 IF _recommendation='APPROVE' AND _count<2 THEN RAISE EXCEPTION 'required documents missing'; END IF;
 INSERT INTO public.onboarding_approval_requests(verification_id,customer_id,recommendation,reviewer_user_id,reviewer_note) VALUES(_v.id,_customer_id,_recommendation,_actor_user_id,trim(_note)) RETURNING id INTO _rid;
 UPDATE public.identity_verifications SET status='UNDER_REVIEW',requested_information=NULL,decision_reason=NULL WHERE id=_v.id;
 UPDATE public.profiles SET lifecycle_state='IDENTITY_UNDER_REVIEW' WHERE id=_customer_id;
 INSERT INTO public.verification_status_history(verification_id,user_id,previous_status,new_status,changed_by,note) VALUES(_v.id,_customer_id,_v.status,'UNDER_REVIEW',_actor_user_id,trim(_note));
 INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context) VALUES(_actor_user_id,'kyc.review_recommended','identity_verification',_v.id::text,'kyc.review','ALLOWED',jsonb_build_object('customer_id',_customer_id,'recommendation',_recommendation,'request_id',_rid));
 RETURN _rid;
END; $$;
REVOKE ALL ON FUNCTION public.service_review_identity_application(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.service_review_identity_application(uuid,uuid,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.service_decide_identity_application(_actor_user_id uuid,_request_id uuid,_confirm boolean,_note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _r public.onboarding_approval_requests%ROWTYPE; _v public.identity_verifications%ROWTYPE; _aid uuid; _fs public.identity_verification_status; _ls public.customer_lifecycle_state;
BEGIN
 IF NOT public.has_permission(_actor_user_id,'kyc.approve') THEN RAISE EXCEPTION 'forbidden'; END IF;
 IF _confirm IS NULL OR char_length(trim(coalesce(_note,''))) NOT BETWEEN 8 AND 500 THEN RAISE EXCEPTION 'invalid decision'; END IF;
 SELECT * INTO _r FROM public.onboarding_approval_requests WHERE id=_request_id FOR UPDATE;
 IF _r.id IS NULL THEN RAISE EXCEPTION 'request not found'; END IF;
 IF _r.status<>'PENDING_SECOND_REVIEW' THEN RAISE EXCEPTION 'already decided'; END IF;
 IF _r.reviewer_user_id=_actor_user_id THEN RAISE EXCEPTION 'four-eyes approval required'; END IF;
 SELECT * INTO _v FROM public.identity_verifications WHERE id=_r.verification_id FOR UPDATE;
 IF _v.status<>'UNDER_REVIEW' THEN RAISE EXCEPTION 'application state changed'; END IF;
 IF NOT _confirm THEN
  UPDATE public.onboarding_approval_requests SET status='REJECTED',checker_user_id=_actor_user_id,checker_note=trim(_note),decided_at=now() WHERE id=_r.id;
  UPDATE public.identity_verifications SET status='SUBMITTED',decision_reason=trim(_note) WHERE id=_v.id;
  UPDATE public.profiles SET lifecycle_state='IDENTITY_SUBMITTED' WHERE id=_r.customer_id;
  _fs:='SUBMITTED'; _ls:='IDENTITY_SUBMITTED';
 ELSIF _r.recommendation='APPROVE' THEN
  UPDATE public.identity_verifications SET status='VERIFIED',decided_at=now(),decision_reason=trim(_note),requested_information=NULL WHERE id=_v.id;
  UPDATE public.verification_documents SET status='ACCEPTED',reviewed_at=now(),rejection_reason=NULL WHERE verification_id=_v.id AND status IN('UPLOADED','UNDER_REVIEW');
  UPDATE public.profiles SET lifecycle_state='BANKING_REVIEW' WHERE id=_r.customer_id;
  _aid:=public.open_limited_primary_account(_r.customer_id);
  UPDATE public.onboarding_approval_requests SET status='APPROVED',checker_user_id=_actor_user_id,checker_note=trim(_note),decided_at=now(),account_id=_aid WHERE id=_r.id;
  _fs:='VERIFIED'; _ls:='BANKING_REVIEW';
 ELSE
  UPDATE public.identity_verifications SET status='REJECTED',decided_at=now(),decision_reason=trim(_note) WHERE id=_v.id;
  UPDATE public.verification_documents SET status='REJECTED',reviewed_at=now(),rejection_reason=trim(_note) WHERE verification_id=_v.id AND status IN('UPLOADED','UNDER_REVIEW');
  UPDATE public.profiles SET lifecycle_state='IDENTITY_REQUIRED' WHERE id=_r.customer_id;
  UPDATE public.onboarding_approval_requests SET status='APPROVED',checker_user_id=_actor_user_id,checker_note=trim(_note),decided_at=now() WHERE id=_r.id;
  _fs:='REJECTED'; _ls:='IDENTITY_REQUIRED';
 END IF;
 INSERT INTO public.verification_status_history(verification_id,user_id,previous_status,new_status,changed_by,note) VALUES(_v.id,_r.customer_id,_v.status,_fs,_actor_user_id,trim(_note));
 INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context) VALUES(_actor_user_id,CASE WHEN _confirm THEN 'kyc.second_review_confirmed' ELSE 'kyc.second_review_returned' END,'identity_verification',_v.id::text,'kyc.approve','ALLOWED',jsonb_build_object('customer_id',_r.customer_id,'recommendation',_r.recommendation,'lifecycle',_ls,'account_id',_aid));
 RETURN jsonb_build_object('status',_fs,'lifecycle',_ls,'account_id',_aid);
END; $$;
REVOKE ALL ON FUNCTION public.service_decide_identity_application(uuid,uuid,boolean,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.service_decide_identity_application(uuid,uuid,boolean,text) TO service_role;

CREATE OR REPLACE FUNCTION public.service_activate_approved_customer(_actor_user_id uuid,_customer_id uuid,_reason text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
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
 INSERT INTO public.account_status_history(account_id,user_id,previous_status,new_status,reason_category,internal_note,changed_by) VALUES(_a.id,_customer_id,'PENDING','ACTIVE','BANKING_APPROVED',trim(_reason),_actor_user_id);
 INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context) VALUES(_actor_user_id,'customer.account_activated','bank_account',_a.public_reference,'accounts.manage','ALLOWED',jsonb_build_object('customer_id',_customer_id,'reason',trim(_reason)));
 RETURN _a.public_reference;
END; $$;
REVOKE ALL ON FUNCTION public.service_activate_approved_customer(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.service_activate_approved_customer(uuid,uuid,text) TO service_role;