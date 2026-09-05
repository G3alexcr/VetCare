
-- Pets
CREATE TABLE public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID,
  name TEXT NOT NULL,
  species TEXT,
  breed TEXT,
  sex TEXT,
  color TEXT,
  birth_date DATE,
  weight NUMERIC(6,2),
  microchip TEXT,
  sterilized BOOLEAN DEFAULT false,
  allergies TEXT,
  notes TEXT,
  photo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets TO authenticated;
GRANT ALL ON public.pets TO service_role;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage pets" ON public.pets FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Vaccines
CREATE TABLE public.vaccines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  applied_at DATE NOT NULL,
  next_due DATE,
  batch TEXT,
  vet_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaccines TO authenticated;
GRANT ALL ON public.vaccines TO service_role;
ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage vaccines" ON public.vaccines FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Dewormings
CREATE TABLE public.dewormings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  product TEXT NOT NULL,
  type TEXT,
  applied_at DATE NOT NULL,
  next_due DATE,
  vet_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dewormings TO authenticated;
GRANT ALL ON public.dewormings TO service_role;
ALTER TABLE public.dewormings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage dewormings" ON public.dewormings FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Surgeries
CREATE TABLE public.surgeries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  performed_at DATE NOT NULL,
  vet_name TEXT,
  anesthesia TEXT,
  outcome TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.surgeries TO authenticated;
GRANT ALL ON public.surgeries TO service_role;
ALTER TABLE public.surgeries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage surgeries" ON public.surgeries FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Hospitalizations
CREATE TABLE public.hospitalizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  admitted_at TIMESTAMPTZ NOT NULL,
  discharged_at TIMESTAMPTZ,
  status TEXT,
  vet_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hospitalizations TO authenticated;
GRANT ALL ON public.hospitalizations TO service_role;
ALTER TABLE public.hospitalizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage hospitalizations" ON public.hospitalizations FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Pet files
CREATE TABLE public.pet_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_files TO authenticated;
GRANT ALL ON public.pet_files TO service_role;
ALTER TABLE public.pet_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage pet_files" ON public.pet_files FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Pet photos
CREATE TABLE public.pet_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  description TEXT,
  taken_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_photos TO authenticated;
GRANT ALL ON public.pet_photos TO service_role;
ALTER TABLE public.pet_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage pet_photos" ON public.pet_photos FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER pets_set_updated_at BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER vaccines_set_updated_at BEFORE UPDATE ON public.vaccines FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER dewormings_set_updated_at BEFORE UPDATE ON public.dewormings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER surgeries_set_updated_at BEFORE UPDATE ON public.surgeries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER hospitalizations_set_updated_at BEFORE UPDATE ON public.hospitalizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER pet_files_set_updated_at BEFORE UPDATE ON public.pet_files FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER pet_photos_set_updated_at BEFORE UPDATE ON public.pet_photos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
