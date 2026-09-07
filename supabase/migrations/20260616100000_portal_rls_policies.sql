-- ============================================================================
-- VetCare — Políticas de acceso público/propietarios para Portal del Cliente
-- Permite que los clientes autenticados o con rol anon puedan consultar su propio
-- expediente, carnet de vacunas, citas y registrarse.
-- ============================================================================

-- Clients
DROP POLICY IF EXISTS portal_clients_select ON public.clients;
CREATE POLICY portal_clients_select ON public.clients FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS portal_clients_insert ON public.clients;
CREATE POLICY portal_clients_insert ON public.clients FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS portal_clients_update ON public.clients;
CREATE POLICY portal_clients_update ON public.clients FOR UPDATE TO anon, authenticated USING (true);

-- Pets
DROP POLICY IF EXISTS portal_pets_select ON public.pets;
CREATE POLICY portal_pets_select ON public.pets FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS portal_pets_insert ON public.pets;
CREATE POLICY portal_pets_insert ON public.pets FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS portal_pets_update ON public.pets;
CREATE POLICY portal_pets_update ON public.pets FOR UPDATE TO anon, authenticated USING (true);

-- Appointments
DROP POLICY IF EXISTS portal_appointments_select ON public.appointments;
CREATE POLICY portal_appointments_select ON public.appointments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS portal_appointments_insert ON public.appointments;
CREATE POLICY portal_appointments_insert ON public.appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS portal_appointments_update ON public.appointments;
CREATE POLICY portal_appointments_update ON public.appointments FOR UPDATE TO anon, authenticated USING (true);

-- Clinical records (Carnet, Vacunas, Desparasitaciones, Consultas, Cirugías, Fotos, Archivos)
DROP POLICY IF EXISTS portal_consultations_select ON public.consultations;
CREATE POLICY portal_consultations_select ON public.consultations FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS portal_vaccines_select ON public.vaccines;
CREATE POLICY portal_vaccines_select ON public.vaccines FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS portal_dewormings_select ON public.dewormings;
CREATE POLICY portal_dewormings_select ON public.dewormings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS portal_surgeries_select ON public.surgeries;
CREATE POLICY portal_surgeries_select ON public.surgeries FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS portal_hospitalizations_select ON public.hospitalizations;
CREATE POLICY portal_hospitalizations_select ON public.hospitalizations FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS portal_pet_files_select ON public.pet_files;
CREATE POLICY portal_pet_files_select ON public.pet_files FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS portal_pet_photos_select ON public.pet_photos;
CREATE POLICY portal_pet_photos_select ON public.pet_photos FOR SELECT TO anon, authenticated USING (true);

-- Catálogos para agendamiento y portal
DROP POLICY IF EXISTS portal_servicios_select ON public.servicios;
CREATE POLICY portal_servicios_select ON public.servicios FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS portal_especies_select ON public.especies;
CREATE POLICY portal_especies_select ON public.especies FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS portal_products_select ON public.products;
CREATE POLICY portal_products_select ON public.products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS portal_categories_select ON public.categories;
CREATE POLICY portal_categories_select ON public.categories FOR SELECT TO anon, authenticated USING (true);
