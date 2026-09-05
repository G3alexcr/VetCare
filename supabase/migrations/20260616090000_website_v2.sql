-- ============================================================================
-- VetCare — Website Studio v2: Testimonios, Galería, Blog y Equipo público
-- ============================================================================

create table if not exists public.website_testimonials (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  author varchar(150) not null,
  role varchar(100) default '',
  content text not null,
  rating int not null default 5,
  photo_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.website_gallery (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  title varchar(150) default '',
  image_url text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.website_posts (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  title varchar(255) not null,
  slug varchar(255) not null,
  summary text,
  content text not null,
  cover_image text,
  published_at timestamptz not null default now(),
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.website_testimonials enable row level security;
alter table public.website_gallery enable row level security;
alter table public.website_posts enable row level security;

-- Lectura pública cuando el sitio de la clínica está publicado
create policy "website_testimonials_public_read" on public.website_testimonials
  for select to anon, authenticated
  using (exists (select 1 from public.website_settings ws where ws.clinic_id = website_testimonials.clinic_id and ws.is_published = true));

create policy "website_gallery_public_read" on public.website_gallery
  for select to anon, authenticated
  using (exists (select 1 from public.website_settings ws where ws.clinic_id = website_gallery.clinic_id and ws.is_published = true));

create policy "website_posts_public_read" on public.website_posts
  for select to anon, authenticated
  using (exists (select 1 from public.website_settings ws where ws.clinic_id = website_posts.clinic_id and ws.is_published = true) and is_published = true);

-- Equipo: los veterinarios de la clínica se leen en público si el sitio está publicado
create policy "veterinarios_site_public_read" on public.veterinarios
  for select to anon, authenticated
  using (exists (select 1 from public.website_settings ws where ws.clinic_id = veterinarios.clinic_id and ws.is_published = true));

-- Gestión (leer/editar) para la clínica del usuario o Super Admin
do $$
declare t text;
begin
  foreach t in array array['website_testimonials','website_gallery','website_posts'] loop
    execute format('create policy website_tenant_all_%1$s on public.%1$I for all to authenticated using (clinic_id = any(public.get_user_clinic_ids()) or public.is_super_admin()) with check (clinic_id = any(public.get_user_clinic_ids()) or public.is_super_admin())', t);
  end loop;
end $$;

-- ─── Seed de ejemplo para la clínica demo (a1) ───
insert into public.website_testimonials (clinic_id, author, role, content, rating, sort_order)
select '00000000-0000-0000-0000-0000000000a1', v.author, v.role, v.content, v.rating, v.ord
from (values
  ('María Rodríguez','Dueña de Rocky','Excelente atención, mi perro salió feliz y sano. ¡100% recomendados!',5,1),
  ('Juan Pérez','Dueño de Luna','Muy profesionales y pacientes. El veterinario explicó todo con calma.',5,2),
  ('Carla Gómez','Cliente','Rápidos para una emergencia. Salvaron a mi gato. Eternamente agradecida.',5,3)
) as v(author, role, content, rating, ord)
where not exists (select 1 from public.website_testimonials t where t.clinic_id = '00000000-0000-0000-0000-0000000000a1' and t.author = v.author);

insert into public.website_gallery (clinic_id, title, image_url, sort_order)
select '00000000-0000-0000-0000-0000000000a1', v.title, v.img, v.ord
from (values
  ('Nuestros pacientes felices','https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800',1),
  ('Sala de cirugía','https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800',2),
  ('Atención personalizada','https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800',3),
  ('Grooming','https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=800',4)
) as v(title, img, ord)
where not exists (select 1 from public.website_gallery g where g.clinic_id = '00000000-0000-0000-0000-0000000000a1' and g.title = v.title);

insert into public.website_posts (clinic_id, title, slug, summary, content, cover_image, is_published)
select '00000000-0000-0000-0000-0000000000a1', v.title, v.slug, v.summary, v.content, v.img, true
from (values
  ('Consejos para cuidar a tu perro en verano','cuidar-perro-verano','Hidratación, paseos y señales de golpe de calor.','<p>Con el calor es clave mantener a tu mascota hidratada y evitar paseos en horas pico. Te contamos las señales de golpe de calor y cómo actuar.</p>','https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=800'),
  ('Vacunación: calendario esencial','vacunacion-calendario','Qué vacunas y cuándo según la etapa de tu mascota.','<p>Un calendario de vacunación adecuado previene enfermedades graves. Repasamos las vacunas clave por etapa de vida.</p>','https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800')
) as v(title, slug, summary, content, img)
where not exists (select 1 from public.website_posts p where p.clinic_id = '00000000-0000-0000-0000-0000000000a1' and p.slug = v.slug);
