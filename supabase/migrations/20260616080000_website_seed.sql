-- ============================================================================
-- VetCare — Seed de ejemplo del Website Studio para la clínica demo (a1)
-- Permite que /site/<slug> funcione de inmediato.
-- ============================================================================

insert into public.website_settings
  (clinic_id, is_published, template_id, slug, identity, sections_config, contact, seo)
values
  ('00000000-0000-0000-0000-0000000000a1', true, 'modern_clean', 'vetcare-san-jose',
   '{"name":"VetCare San José","tagline":"El cuidado que tus mascotas merecen","description":"Clínica veterinaria en San José. Consultas, cirugías, vacunación y mucho más para tus peludos.","logo_url":null,"primary_color":"#0ea5e9","secondary_color":"#0f172a","accent_color":"#f59e0b","font_family":"Inter"}'::jsonb,
   '{"hero":{"enabled":true,"order":1},"about":{"enabled":true,"order":2},"services":{"enabled":true,"order":3},"team":{"enabled":true,"order":4},"testimonials":{"enabled":false,"order":5},"gallery":{"enabled":false,"order":6},"blog_news":{"enabled":false,"order":7},"contact_booking":{"enabled":true,"order":8}}'::jsonb,
   '{"phone":"+506 2222 3344","whatsapp":"+506 8811 2233","email":"contacto@vetcare.com","address":"San José, Costa Rica","schedule":"Lun-Sáb 08:00-19:00","maps_embed_url":"","social":{"facebook":"vetcarecr","instagram":"@vetcarecr","tiktok":"","youtube":""}}'::jsonb,
   '{"meta_title":"VetCare San José | Clínica Veterinaria","meta_description":"Clínica veterinaria en San José. Consultas, cirugías y vacunación.","og_image":null,"keywords":["veterinaria","san jose","mascotas"]}'::jsonb)
on conflict (clinic_id) do nothing;

insert into public.website_services (clinic_id, title, description, icon, image_url, price, badge, sort_order, is_active)
select '00000000-0000-0000-0000-0000000000a1', v.title, v.description, v.icon, null, v.price, v.badge, v.ord, true
from (values
  ('Consulta General','Revisión completa de tu mascota.','🩺',15000,'Popular',1),
  ('Vacunación','Esquema completo de vacunas.','💉',12000,'',2),
  ('Cirugía','Procedimientos quirúrgicos con equipo especializado.','🏥',85000,'',3),
  ('Grooming','Baño y estética canina y felina.','✂️',25000,'Nuevo',4)
) as v(title, description, icon, price, badge, ord)
where not exists (select 1 from public.website_services ws where ws.clinic_id = '00000000-0000-0000-0000-0000000000a1' and ws.title = v.title);

insert into public.website_slides (clinic_id, title, subtitle, image_url, cta_text, cta_link, sort_order)
select '00000000-0000-0000-0000-0000000000a1', v.title, v.subtitle, v.image, v.cta, '#contacto', v.ord
from (values
  ('Bienvenidos a VetCare San José','Cuidamos a tu mascota como parte de la familia.','https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1200','Agenda tu cita',1),
  ('Especialistas en cirugía','Equipo médico de alta experiencia.','https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=1200','Conoce más',2)
) as v(title, subtitle, image, cta, ord)
where not exists (select 1 from public.website_slides wl where wl.clinic_id = '00000000-0000-0000-0000-0000000000a1' and wl.title = v.title);
