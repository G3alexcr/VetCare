-- ============================================================================
-- VetCare — Migración multi-tenant (Fase 1)
-- Esquema + Row Level Security + datos iniciales (Ningún dato hardcodeado en el app).
-- Aplicar con: supabase db push   (o pegar en el SQL Editor de Supabase)
-- ============================================================================
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers de tenant (seguras: usan el JWT del usuario autenticado)
-- ---------------------------------------------------------------------------
create or replace function public.get_user_clinic_ids()
returns uuid[]
language plpgsql stable security definer set search_path = public
as $$
begin
  return coalesce((select array_agg(clinic_id) from public.clinic_members where user_id = auth.uid()), '{}'::uuid[]);
end;
$$;

create or replace function public.is_super_admin()
returns boolean
language plpgsql stable security definer set search_path = public
as $$
begin
  return exists (select 1 from public.clinic_members where user_id = auth.uid() and role = 'Super Administrador');
end;
$$;

create or replace function public.tenant_clinics()
returns uuid[]
language plpgsql stable security definer set search_path = public
as $$
begin
  if public.is_super_admin() then
    return (select coalesce(array_agg(id), '{}'::uuid[]) from public.clinics);
  end if;
  return public.get_user_clinic_ids();
end;
$$;

-- ---------------------------------------------------------------------------
-- Planes (globales)
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  monthly_price numeric not null default 0,
  annual_price numeric not null default 0,
  max_users int not null default 3,
  max_storage_gb int not null default 5,
  max_pets int not null default 500,
  max_branches int not null default 1,
  ai_enabled boolean not null default false,
  whatsapp_enabled boolean not null default false,
  pos_enabled boolean not null default false,
  tienda_online_enabled boolean not null default false,
  max_products int not null default 50,
  max_veterinarios int not null default 2,
  created_at timestamptz not null default now()
);
alter table public.plans enable row level security;
create policy "plans_read" on public.plans for select using (true);
create policy "plans_admin_write" on public.plans for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- Clínicas (la organización)
-- ---------------------------------------------------------------------------
create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text default '',
  tax_id text default '',
  email text default '',
  phone text default '',
  whatsapp text default '',
  address text default '',
  city text default '',
  country text default 'Costa Rica',
  logo_url text default '',
  timezone text default 'America/Costa_Rica',
  currency text default 'CRC',
  brand_color text default '#009d9e',
  plan_id uuid references public.plans(id),
  subscription_status text not null default 'Prueba',
  opening_hours text default '',
  specialties text[] default '{}',
  socials jsonb default '{}',
  created_at timestamptz not null default now()
);
alter table public.clinics enable row level security;
create policy "tenant_clinics_read" on public.clinics for select using (id = any(public.tenant_clinics()));
create policy "tenant_clinics_write" on public.clinics for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- Miembros (usuario de Supabase Auth ↔ clínica ↔ rol)
-- ---------------------------------------------------------------------------
create table if not exists public.clinic_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  role text not null default 'Veterinario',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.clinic_members enable row level security;
create policy "members_read" on public.clinic_members for select using (user_id = auth.uid() or public.is_super_admin());
create policy "members_write" on public.clinic_members for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- Tablas de negocio (todas con clinic_id → RLS por clínica)
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  nombre text not null,
  descripcion text default '',
  color text default 'bg-slate-100 text-slate-700',
  estado text default 'Activo',
  created_at timestamptz not null default now()
);
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  category_id uuid references public.categories(id),
  code text default '', barcode text default '', name text not null,
  price numeric not null default 0, cost numeric not null default 0,
  stock numeric not null default 0, min_stock numeric not null default 0,
  unit text default 'unidad', image text default '', estado text default 'Activo',
  online boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null, email text default '', phone text default '',
  created_at timestamptz not null default now()
);
create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null, species text default '', breed text default '', sex text default '',
  birth_date date, weight numeric default 0, photo text default '',
  created_at timestamptz not null default now()
);
create table if not exists public.veterinarios (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  nombre text not null, email text default '', password text default '', telefono text default '',
  whatsapp text default '', especialidad text default '', comision numeric default 20,
  estado text default 'Activo', foto text default '', horario jsonb default '[]',
  pausas jsonb default '[]', notas text default '',
  created_at timestamptz not null default now()
);
create table if not exists public.servicios (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  nombre text not null, precio numeric not null default 0, duracion_min int not null default 30,
  estado text not null default 'Activo', grava_impuestos boolean not null default true,
  descripcion text default '',
  created_at timestamptz not null default now()
);
create table if not exists public.especies (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  nombre text not null, descripcion text default '', estado text not null default 'Activo',
  razas text[] default '{}',
  created_at timestamptz not null default now()
);
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  number text not null, date date not null default current_date,
  subtotal numeric not null default 0, discount numeric not null default 0,
  tax numeric not null default 0, total numeric not null default 0,
  payment_method text default 'Efectivo', received numeric, change numeric,
  client_name text default 'Cliente de mostrador', status text default 'Completada',
  created_at timestamptz not null default now()
);
create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id), name text not null,
  quantity numeric not null default 1, unit_price numeric not null default 0, discount numeric default 0
);
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  number text not null, client_name text not null, total numeric default 0,
  status text default 'Pendiente', notes text default '', source text default 'presencial',
  created_at timestamptz not null default now()
);
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id), name text not null,
  quantity numeric not null default 1, unit_price numeric not null default 0
);
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  product_id uuid references public.products(id), type text default 'Entrada',
  quantity numeric not null default 0, reason text default '', reference text default '',
  created_at timestamptz not null default now()
);
create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  opened_by text default 'Caja', opening_amount numeric default 0,
  closing_amount numeric, closed_at timestamptz, notes text,
  created_at timestamptz not null default now()
);
create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  session_id uuid references public.cash_sessions(id) on delete cascade,
  type text not null, concept text default '', amount numeric not null default 0,
  created_at timestamptz not null default now()
);

-- RLS para todas las tablas de negocio (solo la clínica del usuario)
do $$
declare t text;
begin
  foreach t in array array['categories','products','clients','pets','veterinarios','servicios','especies','sales','orders','inventory_movements','cash_sessions','cash_movements'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy tenant_select_%1$s on public.%1$I for select using (clinic_id = any(public.get_user_clinic_ids()) or public.is_super_admin())', t);
    execute format('create policy tenant_all_%1$s on public.%1$I for all using (clinic_id = any(public.get_user_clinic_ids()) or public.is_super_admin()) with check (clinic_id = any(public.get_user_clinic_ids()) or public.is_super_admin())', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- SEED — Datos iniciales (todo vive en la BD, nada hardcodeado en el app)
-- ---------------------------------------------------------------------------
insert into public.plans (id, name, monthly_price, annual_price, max_users, max_storage_gb, max_pets, max_branches, ai_enabled, whatsapp_enabled, pos_enabled, tienda_online_enabled, max_products, max_veterinarios)
values
  ('00000000-0000-0000-0000-000000000001', 'Starter', 29, 290, 3, 5, 500, 1, false, false, false, false, 50, 2),
  ('00000000-0000-0000-0000-000000000002', 'Pro', 79, 790, 10, 50, 5000, 3, true, true, true, true, 500, 10),
  ('00000000-0000-0000-0000-000000000003', 'Enterprise', 199, 1990, 999, 500, 999999, 20, true, true, true, true, 99999, 999);

insert into public.clinics (id, name, legal_name, tax_id, email, phone, whatsapp, address, city, country, timezone, currency, plan_id, subscription_status, opening_hours, brand_color)
values
  ('00000000-0000-0000-0000-0000000000a1', 'VetCare San José', 'VetCare S.A.', '310112345678', 'contacto@vetcare.com', '+506 2222 3344', '+506 8811 2233', 'San José, Costa Rica', 'San José', 'Costa Rica', 'America/Costa_Rica', 'CRC', '00000000-0000-0000-0000-000000000002', 'Activa', 'Lun-Sáb 08:00-19:00', '#0ea5e9'),
  ('00000000-0000-0000-0000-0000000000a2', 'PetVet Heredia', 'PetVet S.A.', '310987654321', 'hola@petvet.cr', '+506 2260 7766', '+506 8822 3344', 'Heredia, Costa Rica', 'Heredia', 'Costa Rica', 'America/Costa_Rica', 'CRC', '00000000-0000-0000-0000-000000000001', 'Prueba', 'Lun-Vie 09:00-18:00', '#16a34a'),
  ('00000000-0000-0000-0000-0000000000a3', 'Animal Care Bogotá', 'Animal Care SAS', '900123456-7', 'info@animalcare.co', '+57 1 555 1122', '+57 300 555 1122', 'Calle 100 #15-20', 'Bogotá', 'Colombia', 'America/Bogota', 'COP', '00000000-0000-0000-0000-000000000003', 'Activa', '24/7', '#f59e0b');

-- Categorías para la clínica demo (cl1 = VetCare San José / '00000000-0000-0000-0000-0000000000a1')
insert into public.categories (id, clinic_id, nombre, descripcion, color) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Medicamento', 'Farmacología y medicamentos.', 'bg-sky-100 text-sky-700'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000a1', 'Vacuna', 'Biológicos y vacunas.', 'bg-amber-100 text-amber-700'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000a1', 'Alimento', 'Alimentos y snacks.', 'bg-emerald-100 text-emerald-700'),
  ('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-0000000000a1', 'Accesorio', 'Collares, correas, juguetes.', 'bg-rose-100 text-rose-700');

insert into public.products (id, clinic_id, category_id, code, barcode, name, price, cost, stock, min_stock, unit, image, online) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'P0001', '7861234500011', 'Amoxicilina 500mg', 4500, 3200, 45, 20, 'tabletas', 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400', true),
  ('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c2', 'P0002', '7861234500028', 'Vacuna Rabia Canina', 12000, 6500, 8, 15, 'dosis', 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=400', true),
  ('00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c3', 'P0003', '7861234500042', 'Royal Canin Adult 15kg', 58000, 42000, 12, 5, 'saco', 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400', true),
  ('00000000-0000-0000-0000-00000000f004', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c4', 'P0004', '7861234500059', 'Collar antipulgas', 7500, 3500, 30, 8, 'unidad', 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=400', true);

insert into public.clients (id, clinic_id, name, email, phone) values
  ('00000000-0000-0000-0000-00000000f101', '00000000-0000-0000-0000-0000000000a1', 'María Rodríguez', 'maria@gmail.com', '+506 8811 3344'),
  ('00000000-0000-0000-0000-00000000f102', '00000000-0000-0000-0000-0000000000a1', 'Juan Pérez', 'juan@hotmail.com', '+506 8822 4455'),
  ('00000000-0000-0000-0000-00000000f103', '00000000-0000-0000-0000-0000000000a1', 'Carla Gómez', 'carla@yahoo.com', '+506 8833 5566');

insert into public.pets (id, clinic_id, client_id, name, species, breed, sex, birth_date, weight, photo) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000f101', 'Rocky', 'Canino', 'Labrador Retriever', 'Macho', '2022-05-10', 28, 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000f102', 'Luna', 'Felino', 'Siamés', 'Hembra', '2023-01-01', 4, 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400');

-- Especies + razas para la clínica demo
insert into public.especies (id, clinic_id, nombre, descripcion, razas) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', 'Canino', 'Perros.', array['Labrador Retriever','Golden Retriever','Pastor Alemán','Poodle']),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', 'Felino', 'Gatos.', array['Siamés','Persa','Maine Coon']),
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000a1', 'Ave', 'Aves.', array['Periquito','Canario']);

-- Veterinarios y servicios para la clínica demo
insert into public.veterinarios (id, clinic_id, nombre, email, telefono, especialidad, comision, estado) values
  ('00000000-0000-0000-0000-00000000f201', '00000000-0000-0000-0000-0000000000a1', 'Dra. Ana Martínez', 'ana@vetcare.com', '+506 8811 2233', 'Medicina General', 20, 'Activo'),
  ('00000000-0000-0000-0000-00000000f202', '00000000-0000-0000-0000-0000000000a1', 'Dr. Luis Pérez', 'luis@vetcare.com', '+506 8822 3344', 'Cirugía', 25, 'Activo');

insert into public.servicios (id, clinic_id, nombre, precio, duracion_min, estado) values
  ('00000000-0000-0000-0000-00000000f301', '00000000-0000-0000-0000-0000000000a1', 'Consulta', 30, 30, 'Activo'),
  ('00000000-0000-0000-0000-00000000f302', '00000000-0000-0000-0000-0000000000a1', 'Vacuna', 500, 15, 'Activo'),
  ('00000000-0000-0000-0000-00000000f303', '00000000-0000-0000-0000-0000000000a1', 'Castración', 1000, 30, 'Activo'),
  ('00000000-0000-0000-0000-00000000f304', '00000000-0000-0000-0000-0000000000a1', 'Hotel', 35, 1440, 'Activo'),
  ('00000000-0000-0000-0000-00000000f305', '00000000-0000-0000-0000-0000000000a1', 'Grooming canino', 25, 60, 'Activo');

-- ---------------------------------------------------------------------------
-- Los usuarios de la plataforma se crean con Supabase Auth (email/contraseña).
-- Luego se vinculan a sus clínicas en public.clinic_members (ej. para el demo):
--   insert into public.clinic_members (user_id, clinic_id, role)
--   values ('<uid-de-auth>', '00000000-0000-0000-0000-0000000000a1', 'Super Administrador');
-- ---------------------------------------------------------------------------
