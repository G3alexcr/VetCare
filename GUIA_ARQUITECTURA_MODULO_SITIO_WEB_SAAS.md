# 🌐 Guía Maestra de Arquitectura: Módulo "Website Studio" para Plataformas SaaS Multi-Tenant

> **Objetivo del Documento:** Explicar paso a paso cómo diseñar, construir y desplegar un módulo generador de sitios web públicos autogestionables (**Website Studio / CMS Headless**) dentro de cualquier plataforma SaaS B2B, permitiendo a cada cliente (*tenant*) contar con su propio sitio web institucional sin tocar una sola línea de código.

---

## 🧭 1. El Principio Fundamental de Diseño: *Content ≠ Template*

El error más común al crear constructores de páginas web para SaaS es mezclar el contenido con el diseño visual (ej. guardar HTML crudo o bloques rígidos de maquetación). 

En una arquitectura SaaS profesional, se aplica el principio de **Desacoplamiento Total**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│              FUENTE ÚNICA DE VERDAD (Base de Datos JSONB / SQL)         │
│  • Nombre del Negocio        • Servicios / Precios   • Galería / Fotos   │
│  • Colores de Marca & Logo   • Horarios y Contacto   • SEO & Redes      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌──────────────────────────────────┐   ┌──────────────────────────────────┐
│     PLANTILLA "MODERNA / DARK"   │   │   PLANTILLA "CLÁSICA / FORMAL"   │
│  Renderiza la data con tarjetas  │   │  Renderiza la MISMA data con     │
│  flotantes, degradados y neón.   │   │  tipografía Serif y cajas sobrias│
└──────────────────────────────────┘   └──────────────────────────────────┘
```

> 💡 **Regla de Oro:** Si el cliente cambia de plantilla visual, **nunca debe perder su información ni tener que volver a escribir sus textos**. La plantilla es solo una "capa de pintura reactiva" sobre los datos del negocio.

---

## 🗄️ 2. Modelo de Datos Multi-Tenant (PostgreSQL / Supabase)

Cada negocio (*tenant*) tiene una fila en la tabla de configuración y registros hijos vinculados mediante `tenant_id`.

```sql
-- 1. Tabla Principal de Configuración del Sitio Web
CREATE TABLE public.website_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Estado y Plantilla
    is_published BOOLEAN DEFAULT false,
    template_id VARCHAR(50) DEFAULT 'modern_clean', -- Identificador de la plantilla activa
    subdomain VARCHAR(100) UNIQUE,                  -- ej: clinica-san-martin
    custom_domain VARCHAR(255) UNIQUE,              -- ej: www.veterinariasanmartin.com
    
    -- Identidad de Marca (JSONB)
    identity JSONB DEFAULT '{
        "name": "Mi Negocio",
        "tagline": "El mejor servicio a tu alcance",
        "description": "Descripción general de la empresa...",
        "logo_url": null,
        "logo_dark_url": null,
        "favicon_url": null,
        "primary_color": "#10b981",
        "secondary_color": "#064e3b",
        "accent_color": "#f59e0b",
        "font_family": "Inter"
    }'::jsonb,
    
    -- Configuración de Secciones Activas (JSONB)
    sections_config JSONB DEFAULT '{
        "hero": {"enabled": true, "order": 1},
        "about": {"enabled": true, "order": 2},
        "services": {"enabled": true, "order": 3},
        "catalog_or_categories": {"enabled": true, "order": 4},
        "team": {"enabled": true, "order": 5},
        "testimonials": {"enabled": true, "order": 6},
        "gallery": {"enabled": true, "order": 7},
        "blog_news": {"enabled": true, "order": 8},
        "contact_booking": {"enabled": true, "order": 9}
    }'::jsonb,
    
    -- Datos de Contacto y Redes (JSONB)
    contact JSONB DEFAULT '{
        "phone": "+506 8888-8888",
        "whatsapp": "+506 8888-8888",
        "email": "contacto@negocio.com",
        "address": "San José, Costa Rica",
        "schedule": "Lunes a Viernes 8:00 AM - 6:00 PM",
        "maps_embed_url": "",
        "social": {
            "facebook": "",
            "instagram": "",
            "tiktok": "",
            "youtube": ""
        }
    }'::jsonb,
    
    -- Metadatos SEO (JSONB)
    seo JSONB DEFAULT '{
        "meta_title": "Nombre del Negocio | Sitio Oficial",
        "meta_description": "Servicios profesionales garantizados.",
        "og_image": null,
        "keywords": ["servicio", "costa rica", "profesional"]
    }'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_tenant_website UNIQUE (tenant_id)
);

-- 2. Tablas Dinámicas Hijas (Módulos de Contenido Específico)

-- Servicios / Productos / Planes
CREATE TABLE public.website_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    image_url TEXT,
    price NUMERIC(12,2),
    badge VARCHAR(50), -- "Popular", "Nuevo", "Recomendado"
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Banners / Hero Slides
CREATE TABLE public.website_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    cta_text VARCHAR(50) DEFAULT 'Ver Más',
    cta_link VARCHAR(255) DEFAULT '#contacto',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Noticias / Novedades / Artículos
CREATE TABLE public.website_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    cover_image TEXT,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_published BOOLEAN DEFAULT true
);

-- Prospectos / Citas / Mensajes recibidos desde la Web
CREATE TABLE public.website_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    service_interested VARCHAR(100),
    message TEXT,
    status VARCHAR(50) DEFAULT 'nuevo', -- 'nuevo', 'contactado', 'convertido'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Índices y Seguridad RLS
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_leads ENABLE ROW LEVEL SECURITY;

-- Lectura pública para cualquier visitante anónimo si el sitio está publicado
CREATE POLICY "Sitio web visible públicamente si está publicado" 
ON public.website_settings 
FOR SELECT 
TO anon, authenticated 
USING (is_published = true);

-- Edición exclusiva para el Tenant autenticado
CREATE POLICY "Tenants gestionan su propio sitio web" 
ON public.website_settings 
FOR ALL 
TO authenticated 
USING (tenant_id = auth.jwt() ->> 'tenant_id');
```

---

## 🛠️ 3. Arquitectura del Editor Visual (**Website Studio**)

El editor visual en el panel del cliente se divide en **3 columnas o áreas clave**:

```
┌─────────────────┬───────────────────────────────────────────┬──────────────────────────────────┐
│  MENÚ LATERAL   │            ÁREA DE EDICIÓN                │           LIVE PREVIEW           │
│  (Configuración)│         (Formularios reactivos)           │       (Dispositivo interactivo)  │
├─────────────────┼───────────────────────────────────────────┼──────────────────────────────────┤
│ 🎨 Plantilla    │  • Selector de Plantillas Visuales        │  [ Desktop | Tablet | Mobile ]   │
│ 🏷️ Marca & Logo │  • Paleta de Colores Primario/Acento      │  ┌────────────────────────────┐  │
│ 📑 Secciones    │  • Interruptores (On/Off) y Reordenar     │  │                            │  │
│ 🖼️ Banners/Hero │  • Subida Drag & Drop de Imágenes         │  │     VISTA PREVIA           │  │
│ 💼 Servicios    │  • Formularios de Catálogo y Precios      │  │     EN TIEMPO REAL         │  │
│ 👥 Equipo       │  • Perfiles y Fotografía de Profesionales │  │                            │  │
│ 💬 Testimonios  │  • Reseñas de Clientes Satisfechos        │  │                            │  │
│ 📞 Contacto     │  • WhatsApp, Horarios y Mapa Google Maps  │  └────────────────────────────┘  │
│ 🌐 Dominio & SEO│  • Subdominio, CNAME y Google Meta Tags   │  [ 👁️ Ver Web ] [ 🚀 Publicar ]  │
└─────────────────┴───────────────────────────────────────────┴──────────────────────────────────┘
```

### Componentes React Clave del Studio:

1. **`useWebsiteStudio.ts` (Hook Central de Estado):**
   - Maneja la sincronización en memoria con TanStack Query.
   - Proporciona las mutaciones `updateIdentity`, `updateColors`, `toggleSection`, `reorderSections`, `publishWebsite`.
   - Controla el estado **Borrador (Draft)** vs **Publicado (Published)** para que el cliente pueda previsualizar cambios sin afectar la web en vivo.

2. **Inyección Dinámica de Variables CSS (CSS Variables Theming):**
   Para que cualquier plantilla tome automáticamente los colores del cliente:

   ```typescript
   // En el Renderer del sitio web público
   const customThemeStyle = {
     '--brand-primary': website.identity.primary_color,
     '--brand-secondary': website.identity.secondary_color,
     '--brand-accent': website.identity.accent_color,
     '--brand-font': website.identity.font_family,
   } as React.CSSProperties;

   return (
     <div style={customThemeStyle} className="min-h-screen font-[var(--brand-font)]">
       {/* Componentes de la plantilla */}
     </div>
   );
   ```

---

## 🎨 4. El Patrón de Renderizado Público (*Strategy Pattern*)

Cuando un visitante accede a la web, el componente enrutador `WebsiteRenderer.tsx` inspecciona `template_id` y carga la plantilla correspondiente:

```tsx
import React from 'react';
import { ModernDarkTemplate } from './templates/ModernDarkTemplate';
import { CleanCorporateTemplate } from './templates/CleanCorporateTemplate';
import { PlayfulWarmTemplate } from './templates/PlayfulWarmTemplate';
import { HighImpactSportTemplate } from './templates/HighImpactSportTemplate';

export function WebsiteRenderer({ websiteData }: { websiteData: any }) {
  switch (websiteData.template_id) {
    case 'modern_dark':
      return <ModernDarkTemplate data={websiteData} />;
    case 'clean_corporate':
      return <CleanCorporateTemplate data={websiteData} />;
    case 'playful_warm':
      return <PlayfulWarmTemplate data={websiteData} />;
    case 'high_impact_sport':
      return <HighImpactSportTemplate data={websiteData} />;
    default:
      return <CleanCorporateTemplate data={websiteData} />;
  }
}
```

---

## 🚀 5. Resolución de Dominios y Enrutamiento Multi-Tenant

Para que cada cliente tenga su web accesible, existen **3 niveles de enrutamiento**:

| Método | Ejemplo de URL | Cómo se configura |
| :--- | :--- | :--- |
| **1. Ruta Interna / Slug** | `app.tusaas.com/site/veterinaria-guadalupe` | Ruta estándar en React Router (`/site/:slug`). |
| **2. Subdominio Wildcard** | `veterinaria-guadalupe.tusaas.com` | Registro DNS `*.tusaas.com` apuntando a tu servidor / Vercel / Cloudflare. |
| **3. Dominio Personalizado** | `www.veterinariaguadalupe.com` | El cliente crea un registro `CNAME` apuntando a `cname.tusaas.com` gestionado con **Cloudflare for SaaS (SSL for SaaS)**. |

---

## 🏢 6. Adaptación por Nichos de Negocio

A continuación se detalla cómo configurar los módulos y secciones según el tipo de SaaS:

---

### 🐶 CASO 1: SaaS para Veterinarias y Clínicas de Mascotas

#### Secciones Esenciales del Módulo:
1. **Banner de Urgencias 24/7:** Botón directo a WhatsApp y llamada rápida al médico de turno.
2. **Servicios Clínicos Especializados:** Consultas, Cirugías, Rayos X, Vacunación, Grooming / Peluquería y Hospedaje.
3. **Directorio Médico Veterinario:** Fotos de los doctores, especialidad y número de colegiatura profesional.
4. **Agendamiento de Citas en Línea:** Formulario integrado que guarda la cita directamente en el módulo de agenda del SaaS.
5. **Tienda / Farmacia Pet Shop:** Productos destacados (alimentos medicados, antipulgas, accesorios).
6. **Muro de Testimonios ("Nuestros Pacientes Felices"):** Fotos de perritos y gatitos con la reseña de sus dueños.

#### Estilos Visuales Recomendados:
- **Plantilla A (Clínica Médica de Vanguardia):** Tonos blanco pulcro, verde esmeralda y azul petróleo con estética de salud de alta tecnología.
- **Plantilla B (Amigable & Familiar):** Tonos cálidos (ámbar, coral, arena), tipografías redondeadas y tarjetas con bordes suaves.

---

### ⚽ CASO 2: SaaS para Academias de Fútbol y Clubes Deportivos

#### Secciones Esenciales del Módulo:
1. **Hero Video / Carrusel Dinámico:** Videos o fotos de alta energía de entrenamientos y celebraciones de goles.
2. **Categorías Formativas por Edades:** Fichas interactivas (Sub-7, Sub-9, Sub-11, Sub-15, Femenino, Porteros).
3. **Fixture y Calendario de Partidos:** Próximos encuentros, rival, cancha, hora y tabla de posiciones del torneo.
4. **Proceso de Matrícula y Pruebas de Jugadores (*Tryouts*):** Formulario de captación de nuevos talentos con registro de edad y posición.
5. **Cuerpo Técnico y Metodología:** Entrenadores con licencias federativas (UEFA/CONCACAF), preparadores físicos y psicólogo deportivo.
6. **Canchas e Instalaciones:** Galería con mapa de ubicación de las sedes de entrenamiento.
7. **Palmarés / Vitrina de Trofeos:** Campeonatos y logros históricos obtenidos por la academia.

#### Estilos Visuales Recomendados:
- **Plantilla A (Élite & Competitiva):** Fondo oscuro (*Dark Sport*), acentos en verde neón, amarillo eléctrico o rojo fuego con tipografías sans-serif condensadas y en negrita.
- **Plantilla B (Club Tradicional / Formativo):** Azul marino, dorado y blanco con estética de escudo heráldico y valores deportivos.

---

### 🦷 CASO 3: SaaS para Clínicas Odontológicas / Médicas

#### Secciones Esenciales:
1. **Tratamientos Dentales:** Ortodoncia, Implantes, Diseño de Sonrisa, Endodoncia y Blanqueamiento con precios o facilidades de pago.
2. **Galería de Casos Clínicos (Antes y Después):** Slider interactivo comparador de sonrisas.
3. **Tecnología e Instalaciones:** Equipos de escaneo 3D, radiología digital y esterilización.
4. **Convenios y Seguros Aceptados:** Logos de aseguradoras médicas aliadas.

---

### 🏋️‍♂️ CASO 4: SaaS para Gimnasios, Crossfit y Centros Fitness

#### Secciones Esenciales:
1. **Tarifas y Planes de Membresía:** Tabla comparativa mensual/trimestral/anual con botón de compra.
2. **Horario de Clases Grupales Semanal:** Matriz interactiva de Spinning, Yoga, Pilates, Funcional y Boxeo.
3. **Perfiles de Entrenadores Personales:** Especialidades, certificaciones y botón para reservar sesión privada.
4. **Pase de Día Gratis (*Free Trial*):** Formulario de captación de leads para solicitar una clase de prueba gratuita.

---

## 📋 7. Checklist de Implementación en un Nuevo Proyecto

Sigue estos 6 pasos para clonar e implementar este módulo en cualquier SaaS:

- [ ] **Paso 1: Migración SQL:** Ejecutar el script DDL con `website_settings`, `website_services`, `website_slides` y `website_leads` en Supabase / PostgreSQL.
- [ ] **Paso 2: Hook Central:** Crear `useWebsiteStudio.ts` con la gestión de estado y persistencia reactiva.
- [ ] **Paso 3: Componente Editor (`WebsiteStudio.tsx`):** Montar la interfaz administrativa de 3 columnas (Menú de secciones, formulario y Live Preview).
- [ ] **Paso 4: Biblioteca de Plantillas:** Diseñar 2 o 3 plantillas base en React + Tailwind CSS utilizando el Strategy Pattern.
- [ ] **Paso 5: Ruta Pública (`/site/:slug` o Subdominios):** Configurar el renderizador que consulta la base de datos y monta la web pública.
- [ ] **Paso 6: Conexión de Formularios a la Base de Datos:** Asegurar que los formularios de contacto o citas del sitio público inserten prospectos directamente en la tabla de leads/citas del SaaS.
