-- Correct the customer-status notification call to the existing 7-argument emitter.
-- No business behavior changes.
CREATE OR REPLACE FUNCTION public.admin_set_customer_state(
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  _customer_id uuid,
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  _state public.customer_lifecycle_state,
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  _reason text
CREATE OR REPLACE FUNCTION public.admin_set_customer_state) RETURNS void
CREATE OR REPLACE FUNCTION public.admin_set_customer_stateLANGUAGE plpgsql
CREATE OR REPLACE FUNCTION public.admin_set_customer_stateSECURITY DEFINER
CREATE OR REPLACE FUNCTION public.admin_set_customer_stateSET search_path = public
CREATE OR REPLACE FUNCTION public.admin_set_customer_stateAS $$
CREATE OR REPLACE FUNCTION public.admin_set_customer_stateDECLARE
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  _previous public.customer_lifecycle_state;
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  _title text;
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  _body text;
CREATE OR REPLACE FUNCTION public.admin_set_customer_stateBEGIN
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  IF NOT public.has_permission(auth.uid(), 'customers.write') THEN
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    RAISE EXCEPTION 'forbidden';
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  END IF;
CREATE OR REPLACE FUNCTION public.admin_set_customer_state
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  IF _state NOT IN ('ACTIVE','RESTRICTED','SUSPENDED')
CREATE OR REPLACE FUNCTION public.admin_set_customer_state     OR char_length(trim(coalesce(_reason,''))) NOT BETWEEN 8 AND 300 THEN
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    RAISE EXCEPTION 'invalid state change';
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  END IF;
CREATE OR REPLACE FUNCTION public.admin_set_customer_state
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  SELECT lifecycle_state
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    INTO _previous
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    FROM public.profiles
CREATE OR REPLACE FUNCTION public.admin_set_customer_state   WHERE id = _customer_id
CREATE OR REPLACE FUNCTION public.admin_set_customer_state   FOR UPDATE;
CREATE OR REPLACE FUNCTION public.admin_set_customer_state
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  IF _previous IS NULL THEN
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    RAISE EXCEPTION 'customer not found';
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  END IF;
CREATE OR REPLACE FUNCTION public.admin_set_customer_state
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  IF _state = 'ACTIVE'
CREATE OR REPLACE FUNCTION public.admin_set_customer_state     AND NOT EXISTS (
CREATE OR REPLACE FUNCTION public.admin_set_customer_state       SELECT 1 FROM public.bank_accounts WHERE user_id = _customer_id
CREATE OR REPLACE FUNCTION public.admin_set_customer_state     ) THEN
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    RAISE EXCEPTION 'account required before activation';
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  END IF;
CREATE OR REPLACE FUNCTION public.admin_set_customer_state
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  UPDATE public.profiles
CREATE OR REPLACE FUNCTION public.admin_set_customer_state     SET lifecycle_state = _state
CREATE OR REPLACE FUNCTION public.admin_set_customer_state   WHERE id = _customer_id;
CREATE OR REPLACE FUNCTION public.admin_set_customer_state
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  IF _state = 'ACTIVE' THEN
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    _title := 'Compte client activé';
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    _body := 'Votre statut client a été activé par RFC Royal FINANCE Bank.';
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  ELSIF _state = 'RESTRICTED' THEN
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    _title := 'Statut client restreint';
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    _body := 'Votre statut client a été placé en restriction. Consultez votre espace client ou contactez le service client pour plus d’informations.';
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  ELSE
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    _title := 'Statut client suspendu';
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    _body := 'Votre statut client a été suspendu. Consultez votre espace client ou contactez le service client pour connaître les prochaines étapes.';
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  END IF;
CREATE OR REPLACE FUNCTION public.admin_set_customer_state
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  PERFORM public.emit_customer_notification(
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    _customer_id,
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    'customer.state_changed:' || _customer_id::text || ':' || _state::text || ':' || extract(epoch FROM clock_timestamp())::bigint,
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    'ACCOUNT',
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    CASE WHEN _state = 'ACTIVE' THEN 'SUCCESS' ELSE 'WARNING' END,
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    _title,
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    _body,
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    '/app'
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  );
CREATE OR REPLACE FUNCTION public.admin_set_customer_state
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  INSERT INTO public.admin_audit_events(
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    actor_user_id,
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    action,
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    resource_type,
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    resource_reference,
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    permission_checked,
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    result,
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    context
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  )
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  VALUES (
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    auth.uid(),
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    'customer.state_changed',
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    'customer',
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    _customer_id::text,
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    'customers.write',
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    'ALLOWED',
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    jsonb_build_object(
CREATE OR REPLACE FUNCTION public.admin_set_customer_state      'previous', _previous,
CREATE OR REPLACE FUNCTION public.admin_set_customer_state      'new', _state,
CREATE OR REPLACE FUNCTION public.admin_set_customer_state      'reason', trim(_reason)
CREATE OR REPLACE FUNCTION public.admin_set_customer_state    )
CREATE OR REPLACE FUNCTION public.admin_set_customer_state  );
CREATE OR REPLACE FUNCTION public.admin_set_customer_stateEND;
CREATE OR REPLACE FUNCTION public.admin_set_customer_state$$;
CREATE OR REPLACE FUNCTION public.admin_set_customer_state
CREATE OR REPLACE FUNCTION public.admin_set_customer_state
