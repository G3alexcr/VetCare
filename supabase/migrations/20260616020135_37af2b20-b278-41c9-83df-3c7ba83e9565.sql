
DROP TABLE IF EXISTS public.vaccines CASCADE;

CREATE TABLE public.vaccines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  laboratory TEXT,
  batch_number TEXT,
  application_date DATE NOT NULL,
  next_due_date DATE,
  veterinarian TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaccines TO authenticated;
GRANT ALL ON public.vaccines TO service_role;

ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage vaccines" ON public.vaccines FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE INDEX vaccines_pet_id_idx ON public.vaccines(pet_id);
CREATE INDEX vaccines_next_due_idx ON public.vaccines(next_due_date);

CREATE TRIGGER vaccines_set_updated_at BEFORE UPDATE ON public.vaccines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
