-- Prevent concurrent workers from dispatching the same SMS outbox row.
-- A stale PROCESSING row is failed rather than resent: automatic retry after an
-- ambiguous provider response could deliver duplicate OTP messages.
ALTER TABLE public.notification_outbox
  DROP CONSTRAINT IF EXISTS notification_outbox_status_check;

ALTER TABLE public.notification_outbox
  ADD CONSTRAINT notification_outbox_status_check
  CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'SIMULATED', 'FAILED'));

CREATE OR REPLACE FUNCTION public.claim_pending_sms_notifications(_user_id uuid)
RETURNS TABLE(id uuid, recipient text, template_key text, payload jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Do not silently retry rows whose provider outcome became ambiguous.
  UPDATE public.notification_outbox
     SET status = 'FAILED',
         last_error_code = 'SMS_DISPATCH_TIMEOUT',
         processed_at = now()
   WHERE user_id = _user_id
     AND channel = 'SMS'
     AND status = 'PROCESSING'
     AND processed_at < now() - interval '2 minutes';

  RETURN QUERY
  WITH candidates AS (
    SELECT o.id
      FROM public.notification_outbox AS o
     WHERE o.user_id = _user_id
       AND o.channel = 'SMS'
       AND o.template_key = 'CONTACT_VERIFICATION_CODE'
       AND o.status = 'PENDING'
     ORDER BY o.created_at, o.id
     LIMIT 20
     FOR UPDATE SKIP LOCKED
  ),
  claimed AS (
    UPDATE public.notification_outbox AS o
       SET status = 'PROCESSING',
           attempts = attempts + 1,
           processed_at = now()
      FROM candidates AS c
     WHERE o.id = c.id
       AND o.status = 'PENDING'
    RETURNING o.id, o.recipient, o.template_key, o.payload
  )
  SELECT claimed.id, claimed.recipient, claimed.template_key, claimed.payload
    FROM claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_pending_sms_notifications(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_sms_notifications(uuid)
  TO service_role;
