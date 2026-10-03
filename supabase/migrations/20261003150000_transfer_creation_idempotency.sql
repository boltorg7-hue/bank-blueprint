-- 5.9.9.9 — persistent idempotency for customer transfer creation
--
-- The existing create_customer_transfer() routine remains authoritative for
-- validation, routing and transfer creation. This wrapper persists the client
-- intent key before calling it, so a lost response can be retried safely.
-- The mapping is transactional: a failed creation rolls it back.

CREATE TABLE public.transfer_creation_idempotency (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  source_account_reference text NOT NULL,
  beneficiary_reference text NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  customer_reference text,
  transfer_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, idempotency_key)
);

CREATE INDEX transfer_creation_idempotency_created_idx
  ON public.transfer_creation_idempotency (created_at DESC);

ALTER TABLE public.transfer_creation_idempotency ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.transfer_creation_idempotency FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.transfer_creation_idempotency TO service_role;

CREATE OR REPLACE FUNCTION public.create_customer_transfer_idempotent(
  _user_id uuid,
  _source_account_reference text,
  _beneficiary_reference text,
  _amount_minor bigint,
  _customer_reference text DEFAULT NULL,
  _idempotency_key text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _existing public.transfer_creation_idempotency;
  _key text := trim(COALESCE(_idempotency_key, ''));
  _reference text;
BEGIN
  IF _key = '' OR char_length(_key) < 16 OR char_length(_key) > 100 THEN
    RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY';
  END IF;

  IF _amount_minor IS NULL OR _amount_minor <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

  -- The unique key serializes concurrent requests for the same customer intent.
  INSERT INTO public.transfer_creation_idempotency (
    user_id,
    idempotency_key,
    source_account_reference,
    beneficiary_reference,
    amount_minor,
    customer_reference
  )
  VALUES (
    _user_id,
    _key,
    _source_account_reference,
    _beneficiary_reference,
    _amount_minor,
    NULLIF(trim(COALESCE(_customer_reference, '')), '')
  )
  ON CONFLICT (user_id, idempotency_key) DO NOTHING;

  SELECT *
    INTO _existing
    FROM public.transfer_creation_idempotency
   WHERE user_id = _user_id
     AND idempotency_key = _key
   FOR UPDATE;

  IF _existing.source_account_reference <> _source_account_reference
     OR _existing.beneficiary_reference <> _beneficiary_reference
     OR _existing.amount_minor <> _amount_minor
     OR COALESCE(_existing.customer_reference, '') <>
        COALESCE(NULLIF(trim(COALESCE(_customer_reference, '')), ''), '') THEN
    RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSED';
  END IF;

  IF _existing.transfer_reference IS NOT NULL THEN
    RETURN _existing.transfer_reference;
  END IF;

  -- Keep the existing business routine authoritative. If it fails, this
  -- transaction rolls back the idempotency row and a later retry may proceed.
  _reference := public.create_customer_transfer(
    _user_id,
    _source_account_reference,
    _beneficiary_reference,
    _amount_minor,
    _customer_reference
  );

  UPDATE public.transfer_creation_idempotency
     SET transfer_reference = _reference
   WHERE user_id = _user_id
     AND idempotency_key = _key;

  RETURN _reference;
END;
$$;

REVOKE ALL ON FUNCTION public.create_customer_transfer_idempotent(
  uuid, text, text, bigint, text, text
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_customer_transfer_idempotent(
  uuid, text, text, bigint, text, text
) TO service_role;
