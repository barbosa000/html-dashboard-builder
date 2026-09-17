CREATE TABLE public.records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  collection text NOT NULL,
  doc_key text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX records_singleton_uniq ON public.records (user_id, collection, doc_key) WHERE doc_key IS NOT NULL;
CREATE INDEX records_user_collection_idx ON public.records (user_id, collection);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.records TO authenticated;
GRANT ALL ON public.records TO service_role;

ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own records select" ON public.records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own records insert" ON public.records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own records update" ON public.records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own records delete" ON public.records FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER records_touch_updated_at
BEFORE UPDATE ON public.records
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();