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
  UPDATE public.verification_documents SET status='ACCEPTED',rejection_reason=NULL WHERE verification_id=_v.id AND status IN('UPLOADED','UNDER_REVIEW');
  UPDATE public.profiles SET lifecycle_state='BANKING_REVIEW' WHERE id=_r.customer_id;
  _aid:=public.open_limited_primary_account(_r.customer_id);
  UPDATE public.onboarding_approval_requests SET status='APPROVED',checker_user_id=_actor_user_id,checker_note=trim(_note),decided_at=now(),account_id=_aid WHERE id=_r.id;
  _fs:='VERIFIED'; _ls:='BANKING_REVIEW';
 ELSE
  UPDATE public.identity_verifications SET status='REJECTED',decided_at=now(),decision_reason=trim(_note) WHERE id=_v.id;
  UPDATE public.verification_documents SET status='REJECTED',rejection_reason=trim(_note) WHERE verification_id=_v.id AND status IN('UPLOADED','UNDER_REVIEW');
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