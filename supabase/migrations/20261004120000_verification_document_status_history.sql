-- Production-grade document status history.
-- This migration records the exact database timestamp of every real
-- verification_documents.status transition without changing the existing
-- admin_customer_page read model.

CREATE TABLE public.verification_document_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL
    REFERENCES public.verification_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_status public.verification_document_status,
  new_status public.verification_document_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_source TEXT NOT NULL DEFAULT 'SYSTEM'
    CHECK (change_source IN ('CUSTOMER', 'ADMIN', 'SYSTEM')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX verification_document_status_history_document_created_idx
  ON public.verification_document_status_history (document_id, created_at DESC);

CREATE INDEX verification_document_status_history_user_created_idx
  ON public.verification_document_status_history (user_id, created_at DESC);

ALTER TABLE public.verification_document_status_history ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.verification_document_status_history TO authenticated;
GRANT ALL ON public.verification_document_status_history TO service_role;

CREATE POLICY "document status history select own or staff"
ON public.verification_document_status_history
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_staff(auth.uid())
);

CREATE OR REPLACE FUNCTION public.capture_verification_document_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changed_by UUID;
  v_change_source TEXT;
BEGIN
  v_changed_by := auth.uid();

  IF public.is_staff(v_changed_by) THEN
    v_change_source := 'ADMIN';
  ELSE
    v_change_source := 'CUSTOMER';
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.verification_document_status_history (
      document_id,
      user_id,
      previous_status,
      new_status,
      changed_by,
      change_source
    )
    VALUES (
      NEW.id,
      NEW.user_id,
      NULL,
      NEW.status,
      v_changed_by,
      v_change_source
    );

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.verification_document_status_history (
      document_id,
      user_id,
      previous_status,
      new_status,
      changed_by,
      change_source
    )
    VALUES (
      NEW.id,
      NEW.user_id,
      OLD.status,
      NEW.status,
      v_changed_by,
      v_change_source
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER verification_documents_status_history_capture
AFTER INSERT OR UPDATE OF status ON public.verification_documents
FOR EACH ROW
EXECUTE FUNCTION public.capture_verification_document_status_history();
