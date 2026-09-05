-- ============================================================================
-- VetCare — Módulo "Website Studio" (CMS multi-tenant por clínica)
-- Cada clínica (tenant) tiene su propio sitio web público autogestionable.
-- Se usa clinic_id como tenant (coherente con el resto de VETCARE).
-- ============================================================================

-- 1) Configuración del sitio de la clínica (1 fila por clínica)
create table if not exists public.website_settings (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null unique references public.clinics(id) on delete cascade,
  is_published boolean not null default false,
  template_id varchar(50) not null default 'modern_clean',
  slug varchar(120) not null unique,
  identity jsonb not null default '{
    "name": "",
    "tagline": "",
    "description": "",
    "logo_url": null,
    "primary_color": "#0ea5e9",
    "secondary_color": "#0f172a",
    "accent_color": "#f59e0b",
    "font_family": "Inter"
  }'::jsonb,
  sections_config jsonb not null default '{
    "hero": {"enabled": true, "order": 1},
    "about": {"enabled": true, "order": 2},
    "services": {"enabled": true, "order": 3},
    "team": {"enabled": false, "order": 4},
    "testimonials": {"enabled": false, "order": 5},
    "gallery": {"enabled": false, "order": 6},
    "blog_news": {"enabled": false, "order": 7},
    "contact_booking": {"enabled": true, "order": 8}
  }'::jsonb,
  contact jsonb not null default '{
    "phone": "",
    "whatsapp": "",
    "email": "",
    "address": "",
    "schedule": "Lunes a Viernes 8:00 AM - 6:00 PM",
    "maps_embed_url": "",
    "social": {"facebook": "", "instagram": "", "tiktok": "", "youtube": ""}
  }'::jsonb,
  seo jsonb not null default '{
    "meta_title": "",
    "meta_description": "",
    "og_image": null,
    "keywords": []
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Servicios / productos destacados de la clínica
create table if not exists public.website_services (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  title varchar(150) not null,
  description text,
  icon varchar(50) default '🐾',
  image_url text,
  price numeric(12,2),
  badge varchar(50),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3) Banners / slides del hero
create table if not exists public.website_slides (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  title varchar(200) not null,
  subtitle text,
  image_url text not null,
  cta_text varchar(50) default 'Ver Más',
  cta_link varchar(255) default '#contacto',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 4) Prospectos / citas que llegan desde el sitio público
create table if not exists public.website_leads (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name varchar(150) not null,
  email varchar(150),
  phone varchar(50),
  service_interested varchar(100),
  message text,
  status varchar(50) not null default 'nuevo',
  created_at timestamptz not null default now()
);

alter table public.website_settings enable row level security;
alter table public.website_services enable row level security;
alter table public.website_slides enable row level security;
alter table public.website_leads enable row level security;

-- Lectura PÚBLICA (anon) SOLO si el sitio está publicado
create policy "website_settings_public_read" on public.website_settings
  for select to anon, authenticated using (is_published = true);

create policy "website_services_public_read" on public.website_services
  for select to anon, authenticated
  using (exists (select 1 from public.website_settings ws where ws.clinic_id = website_services.clinic_id and ws.is_published = true));

create policy "website_slides_public_read" on public.website_slides
  for select to anon, authenticated
  using (exists (select 1 from public.website_settings ws where ws.clinic_id = website_slides.clinic_id and ws.is_published = true));

-- El visitante anónimo siempre puede CREAR un lead (formulario de contacto/cita)
create policy "website_leads_public_insert" on public.website_leads
  for insert to anon, authenticated with check (clinic_id is not null);

-- Gestión (leer/editar) solo para la clínica del usuario o el Super Admin
do $$
declare t text;
begin
  foreach t in array array['website_settings','website_services','website_slides','website_leads'] loop
    execute format('create policy website_tenant_all_%1$s on public.%1$I for all to authenticated using (clinic_id = any(public.get_user_clinic_ids()) or public.is_super_admin()) with check (clinic_id = any(public.get_user_clinic_ids()) or public.is_super_admin())', t);
  end loop;
end $$;
