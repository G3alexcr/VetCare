-- ============================================================================
-- VetCare — Migración multi-tenant (Fase 2): Finanzas y Automatización
-- Tablas para facturación (invoices, invoice_items, payments, quotes,
-- quote_items) y automatización (reminders, message_templates, conversations,
-- messages). Todas tienen clinic_id → RLS por clínica (mismo patrón que el
-- resto de tablas de negocio). Nada de datos hardcodeado en el app.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Finanzas: facturas y sus ítems
-- ---------------------------------------------------------------------------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  number text,
  date date,
  due_date date,
  client_id uuid,
  client_name text,
  pet_name text,
  vet_name text,
  subtotal numeric,
  discount numeric,
  tax numeric,
  total numeric,
  paid numeric,
  balance numeric,
  status text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  description text,
  quantity numeric,
  unit_price numeric,
  discount numeric,
  kind text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete cascade,
  method text,
  amount numeric,
  reference text,
  date date,
  created_by text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Finanzas: cotizaciones y sus ítems
-- ---------------------------------------------------------------------------
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  number text,
  date date,
  valid_until date,
  client_name text,
  pet_name text,
  subtotal numeric,
  discount numeric,
  tax numeric,
  total numeric,
  status text,
  created_at timestamptz not null default now()
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  description text,
  quantity numeric,
  unit_price numeric,
  discount numeric,
  kind text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Automatización: recordatorios, plantillas, conversaciones y mensajes
-- ---------------------------------------------------------------------------
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  type text,
  pet_name text,
  client_name text,
  phone text,
  scheduled_for text,
  channel text,
  status text,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text,
  category text,
  channel text,
  body text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  client_name text,
  pet_name text,
  phone text,
  channel text,
  last_message text,
  last_message_at text,
  unread int not null default 0,
  status text,
  assignee text,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  direction text,
  body text,
  sent_at text,
  status text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS para todas las tablas nuevas (solo la clínica del usuario)
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['invoices','invoice_items','payments','quotes','quote_items','reminders','message_templates','conversations','messages'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy tenant_select_%1$s on public.%1$I for select using (clinic_id = any(public.get_user_clinic_ids()) or public.is_super_admin())', t);
    execute format('create policy tenant_all_%1$s on public.%1$I for all using (clinic_id = any(public.get_user_clinic_ids()) or public.is_super_admin()) with check (clinic_id = any(public.get_user_clinic_ids()) or public.is_super_admin())', t);
  end loop;
end $$;

-- ============================================================================
-- SEED — Datos de muestra para la clínica demo a1 (nada hardcodeado en la app)
-- ============================================================================

-- Facturas (totales calculados con calcTotals, IVA 13%)
insert into public.invoices (id, clinic_id, number, date, due_date, client_id, client_name, pet_name, vet_name, subtotal, discount, tax, total, paid, balance, status, notes) values
  ('00000000-0000-0000-0000-00000000fac1', '00000000-0000-0000-0000-0000000000a1', 'F-000101', current_date, current_date, null, 'María Rodríguez', 'Luna', 'Dr. Luis Pérez', 27000, 0, 3510, 30510, 30510, 0, 'Pagada', 'Consulta general + vacuna rabia.'),
  ('00000000-0000-0000-0000-00000000fac4', '00000000-0000-0000-0000-0000000000a1', 'F-000102', current_date, current_date + 15, null, 'Carlos Vera', 'Rocky', 'Dra. Ana Martínez', 94000, 4700, 11609, 100909, 40000, 60909, 'Parcialmente pagada', 'Cirugía de esterilización con abono parcial.');

insert into public.invoice_items (id, invoice_id, clinic_id, description, quantity, unit_price, discount, kind) values
  ('00000000-0000-0000-0000-00000000fac2', '00000000-0000-0000-0000-00000000fac1', '00000000-0000-0000-0000-0000000000a1', 'Consulta general', 1, 15000, 0, 'Consulta'),
  ('00000000-0000-0000-0000-00000000fac3', '00000000-0000-0000-0000-00000000fac1', '00000000-0000-0000-0000-0000000000a1', 'Vacuna Rabia', 1, 12000, 0, 'Medicamento'),
  ('00000000-0000-0000-0000-00000000fac5', '00000000-0000-0000-0000-00000000fac4', '00000000-0000-0000-0000-0000000000a1', 'Cirugía esterilización', 1, 85000, 0, 'Cirugía'),
  ('00000000-0000-0000-0000-00000000fac6', '00000000-0000-0000-0000-00000000fac4', '00000000-0000-0000-0000-0000000000a1', 'Antibiótico Amoxicilina', 2, 4500, 0, 'Medicamento');

-- Un pago asociado a la primera factura
insert into public.payments (id, clinic_id, invoice_id, method, amount, reference, date, created_by) values
  ('00000000-0000-0000-0000-00000000fac7', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000fac1', 'Efectivo', 30510, null, current_date, 'Caja');

-- Cotización
insert into public.quotes (id, clinic_id, number, date, valid_until, client_name, pet_name, subtotal, discount, tax, total, status) values
  ('00000000-0000-0000-0000-00000000fac8', '00000000-0000-0000-0000-0000000000a1', 'P-000201', current_date, current_date + 15, 'Sofía Ramírez', 'Nala', 55000, 0, 7150, 62150, 'Enviada');

insert into public.quote_items (id, quote_id, clinic_id, description, quantity, unit_price, discount, kind) values
  ('00000000-0000-0000-0000-00000000fac9', '00000000-0000-0000-0000-00000000fac8', '00000000-0000-0000-0000-0000000000a1', 'Limpieza dental profunda', 1, 55000, 0, 'Servicio');

-- Recordatorios (scheduled_for en ISO 8601, como espera la app)
insert into public.reminders (id, clinic_id, type, pet_name, client_name, phone, scheduled_for, channel, status, message) values
  ('00000000-0000-0000-0000-00000000fab1', '00000000-0000-0000-0000-0000000000a1', 'Vacuna', 'Rocky', 'María Rodríguez', '+593 99 111 2233', to_char(timezone('utc', now()) + interval '1 day', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'WhatsApp', 'Programado', 'Recordatorio de vacuna Parvovirus'),
  ('00000000-0000-0000-0000-00000000fab2', '00000000-0000-0000-0000-0000000000a1', 'Cita', 'Luna', 'Carlos Andrade', '+593 98 555 4433', to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'WhatsApp', 'Enviado', 'Recordatorio de cita para hoy 15:00');

-- Plantillas de mensaje
insert into public.message_templates (id, clinic_id, name, category, channel, body, active) values
  ('00000000-0000-0000-0000-00000000fab3', '00000000-0000-0000-0000-0000000000a1', 'Bienvenida nuevo cliente', 'Bienvenida', 'WhatsApp', '¡Hola {cliente}! 🐾 Bienvenido a VetCare. Gracias por confiar en nosotros para el cuidado de {mascota}.', true),
  ('00000000-0000-0000-0000-00000000fab4', '00000000-0000-0000-0000-0000000000a1', 'Recordatorio de vacuna', 'Recordatorio', 'WhatsApp', 'Hola {cliente}, te recordamos que {mascota} tiene programada su vacuna de {vacuna} el {fecha}. Responde SI para confirmar.', true);

-- Conversaciones
insert into public.conversations (id, clinic_id, client_name, pet_name, phone, channel, last_message, last_message_at, unread, status, assignee) values
  ('00000000-0000-0000-0000-00000000fab5', '00000000-0000-0000-0000-0000000000a1', 'María Rodríguez', 'Rocky', '+593 99 111 2233', 'WhatsApp', 'Perfecto, confirmo la cita 🙌', to_char(timezone('utc', now()) - interval '1 hour', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 0, 'Abierta', 'Recepción'),
  ('00000000-0000-0000-0000-00000000fab6', '00000000-0000-0000-0000-0000000000a1', 'Carlos Andrade', 'Luna', '+593 98 555 4433', 'WhatsApp', '¿Puedo reprogramar para el viernes?', to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 2, 'En espera', 'Recepción');

-- Mensajes del hilo de la primera conversación
insert into public.messages (id, clinic_id, conversation_id, direction, body, sent_at, status) values
  ('00000000-0000-0000-0000-00000000fab7', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000fab5', 'out', 'Hola María, ¿confirmas la cita de Rocky mañana 10:00?', to_char(timezone('utc', now()) - interval '1 hour', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'Leído'),
  ('00000000-0000-0000-0000-00000000fab8', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000fab5', 'in', 'Perfecto, confirmo la cita 🙌', to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'Entregado');
