-- ============================================================================
-- VetCare — Migración multi-tenant (Fase 1b): datos clínicos
-- Tablas para expediente clínico (agenda, consultas, vacunas, desparasitaciones,
-- cirugías, hospitalización, archivos y fotos). Todas con clinic_id → RLS.
-- ============================================================================

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  date date not null default current_date,
  time text default '09:00',
  client_id uuid references public.clients(id) on delete set null,
  pet_id uuid references public.pets(id) on delete set null,
  vet_id text default '',
  reason text default '',
  status text not null default 'Pendiente',
  created_at timestamptz not null default now()
);

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  date date not null default current_date,
  vet_id text default '',
  pet_id uuid references public.pets(id) on delete set null,
  reason text default '',
  weight numeric default 0,
  temperature numeric default 0,
  diagnosis text default '',
  treatment text default '',
  medications text default '',
  notes text default '',
  appointment_id uuid references public.appointments(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.vaccines (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete set null,
  vaccine_name text default '',
  laboratory text default '',
  batch_number text default '',
  application_date date,
  next_due_date date,
  veterinarian text default '',
  notes text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.dewormings (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete set null,
  product_name text default '',
  active_ingredient text default '',
  deworming_type text default 'Interna',
  application_date date,
  next_application_date date,
  weight numeric default 0,
  dose text default '',
  veterinarian text default '',
  notes text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.surgeries (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete set null,
  surgery_date date,
  procedure_type text default '',
  veterinarian text default '',
  assistant text default '',
  preoperative_diagnosis text default '',
  procedure_performed text default '',
  anesthesia_type text default '',
  medications text default '',
  duration_minutes int default 0,
  status text default 'Programada',
  observations text default '',
  postoperative_recommendations text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.surgery_followups (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  surgery_id uuid references public.surgeries(id) on delete cascade,
  followup_date date,
  veterinarian text default '',
  progress_notes text default '',
  observations text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.hospitalizations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete set null,
  admission_date date,
  admission_time text default '',
  veterinarian text default '',
  reason text default '',
  initial_diagnosis text default '',
  treatment_plan text default '',
  patient_status text default '',
  room_number text default '',
  observations text default '',
  discharge_date date,
  discharge_summary text default '',
  owner_instructions text default '',
  discharge_medications text default '',
  followup_date date,
  status text default 'Hospitalizado',
  created_at timestamptz not null default now()
);

create table if not exists public.hospitalization_progress (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  hospitalization_id uuid references public.hospitalizations(id) on delete cascade,
  progress_date date,
  progress_time text default '',
  veterinarian text default '',
  temperature text default '',
  weight text default '',
  medications_administered text default '',
  observations text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.pet_files (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete set null,
  file_name text default '',
  file_category text default 'Otros',
  file_url text default '',
  file_size numeric default 0,
  file_type text default '',
  document_date date,
  veterinarian text default '',
  description text default '',
  uploaded_by text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.pet_photos (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete set null,
  title text default '',
  category text default 'General',
  photo_url text default '',
  photo_date date,
  veterinarian text default '',
  clinical_notes text default '',
  uploaded_by text default '',
  created_at timestamptz not null default now()
);

-- Atributos extra de cliente que ya usa la app (nombre completo, identificación,
-- whatsapp, dirección, fecha de registro y notas). Se agregan a la tabla clients.
alter table public.clients add column if not exists full_name text default '';
alter table public.clients add column if not exists identification text default '';
alter table public.clients add column if not exists whatsapp text default '';
alter table public.clients add column if not exists address text default '';
alter table public.clients add column if not exists registered_at date;
alter table public.clients add column if not exists notes text default '';

-- Atributos extra de mascota que ya usa la app (color, microchip, esterilización,
-- alergias y notas). Se agregan a la tabla pets existente.
alter table public.pets add column if not exists color text default '';
alter table public.pets add column if not exists microchip text default '';
alter table public.pets add column if not exists sterilized boolean not null default false;
alter table public.pets add column if not exists allergies text default '';
alter table public.pets add column if not exists notes text default '';

-- RLS para las tablas clínicas (solo la clínica del usuario)
do $$
declare t text;
begin
  foreach t in array array['appointments','consultations','vaccines','dewormings','surgeries','surgery_followups','hospitalizations','hospitalization_progress','pet_files','pet_photos'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy tenant_select_%1$s on public.%1$I for select using (clinic_id = any(public.get_user_clinic_ids()) or public.is_super_admin())', t);
    execute format('create policy tenant_all_%1$s on public.%1$I for all using (clinic_id = any(public.get_user_clinic_ids()) or public.is_super_admin()) with check (clinic_id = any(public.get_user_clinic_ids()) or public.is_super_admin())', t);
  end loop;
end $$;
