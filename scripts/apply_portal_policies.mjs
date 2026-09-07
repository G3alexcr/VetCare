import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const token = env.SUPABASE_ACCESS_TOKEN;
const projectId = env.SUPABASE_PROJECT_ID;

async function executeSql(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  const data = await res.json();
  return data;
}

async function run() {
  console.log("Applying Portal policies...");

  const sql = `
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

    -- Clinical records (Carnet, Vacunas, Desparasitaciones, Consultas, etc.)
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
  `;

  const result = await executeSql(sql);
  console.log("SQL Result:", result);

  // Now test with anonDb
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
  const anonDb = createClient(url, key);

  console.log("\n--- Testing with ANON key ---");
  const { data: cData, error: cErr } = await anonDb.from('clients').select('id, name, email');
  console.log("Anon clients query:", cData?.length, "rows, error:", cErr);

  const { data: pData, error: pErr } = await anonDb.from('pets').select('id, name, client_id');
  console.log("Anon pets query:", pData?.length, "rows, error:", pErr);
  if (pData) {
    console.log("Pets returned to anon:", pData);
  }
}

run();
