import { useSyncExternalStore } from "react";
import { useTenantSlice } from "./tenant";
import { getCurrentClinicId } from "./saas-store";
import { registerHydrator } from "./db-hooks";
import { db } from "./supabase";

// ============================================================
// TIPOS — Single Source of Truth (CONTENT ≠ TEMPLATE)
// ============================================================

export type VetTemplateId = 
  | "govet"
  | "welfare-elite"
  | "smartvet-center"
  | "medica-zoo"
  | "vetcat-warm"
  | "petclinic-pro"
  | "modern-petcare"
  | "veterinary-medical"
  | "bento-vet"
  | "boutique-spa";

export type WebsiteStatus = "draft" | "published";

export interface WebsiteIdentity {
  name: string;
  tagline: string;
  description: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  mision: string;
  vision: string;
  historia: string;
  founded_year: string;
  certifications: string[];
  cover_image_url: string | null;
  hero_title?: string;
  hero_subtitle?: string;
  hero_badge?: string;
  hero_image_url?: string;
  hero_type?: "single" | "slider";
  cta_primary_text?: string;
  cta_primary_link?: string;
  cta_secondary_text?: string;
  cta_secondary_link?: string;
  about_image_url?: string;
  google_rating?: string;
  promo_text?: string;
  health_plans_config?: WebsiteHealthPlansConfig;
}

export interface WebsiteHealthPlan {
  id: string;
  name: string;
  target: string;
  price: string;
  period: string;
  badge: string;
  recommended: boolean;
  features: string[];
}

export interface WebsiteHealthPlansConfig {
  title?: string;
  subtitle?: string;
  plans?: WebsiteHealthPlan[];
}

export interface WebsiteContact {
  phone: string;
  phone2: string;
  whatsapp: string;
  email: string;
  address: string;
  schedule: string;
  emergency_24h: boolean;
  maps_embed_url: string;
  google_maps_url?: string;
  waze_url?: string;
  whatsapp_message?: string;
  contact_badge?: string;
  contact_title?: string;
  contact_subtitle?: string;
  location_badge?: string;
  location_title?: string;
  perk_1?: string;
  perk_2?: string;
  perk_3?: string;
  social: {
    facebook: string;
    instagram: string;
    tiktok: string;
    youtube: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface WebsiteSeo {
  meta_title: string;
  meta_description: string;
  og_image: string | null;
  keywords: string[];
  canonical_url: string;
}

export interface WebsiteFaq {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface WebsiteMetric {
  id: string;
  value: string;
  label: string;
  icon: string;
}

export type WebsiteSections = Record<string, { enabled: boolean; order: number }>;

export interface WebsiteSettings {
  id: string;
  clinicId: string;
  is_published: boolean;
  template_id: VetTemplateId;
  slug: string;
  identity: WebsiteIdentity;
  contact: WebsiteContact;
  seo: WebsiteSeo;
  sections_config: WebsiteSections;
  faqs: WebsiteFaq[];
  metrics: WebsiteMetric[];
}

export interface WebsiteService {
  id: string;
  clinicId: string;
  title: string;
  description: string;
  icon: string;
  image_url: string | null;
  price: number | null;
  price_from: boolean;
  badge: string;
  duration: string;
  sort_order: number;
  is_active: boolean;
}

export interface WebsiteSlide {
  id: string;
  clinicId: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
  sort_order: number;
}

export interface WebsiteGroupItem {
  id: string;
  name: string;
  role: string;
  photo: string;
  description: string;
  specialties?: string[];
}

export interface WebsiteTestimonial {
  id: string;
  author: string;
  pet_name?: string;
  role: string;
  content: string;
  rating: number;
  photo_url: string | null;
}

export interface WebsiteGalleryItem {
  id: string;
  title: string;
  image_url: string;
}

export interface WebsitePost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  cover_image: string | null;
  published_at: string;
}

// ============================================================
// CATÁLOGO DE PLANTILLAS
// ============================================================

export interface WebsitePackage {
  id: string;
  name: string;
  species: string;
  price: string;
  period?: string;
  badge?: string;
  popular?: boolean;
  features: string[];
}

export const DEFAULT_PACKAGES: WebsitePackage[] = [
  {
    id: "pkg-1",
    name: "Plan Preventivo Canino",
    species: "Perros adultos",
    price: "$45",
    features: [
      "Chequeo clínico completo 12 puntos",
      "Vacunación séxtuple anual",
      "Desparasitación interna y externa",
      "Corte de uñas e higiene auditiva",
      "Certificado médico digital"
    ],
  },
  {
    id: "pkg-2",
    name: "Plan Cachorros & Gatitos",
    species: "Mascotas menores a 1 año",
    price: "$65",
    popular: true,
    badge: "RECOMENDADO",
    features: [
      "3 consultas de desarrollo pediátrico",
      "Protocolo inicial completo de vacunas",
      "Desparasitación seriada bimensual",
      "Implantación de Microchip oficial",
      "Guía nutricional y conductual",
      "10% dto en primera esterilización"
    ],
  },
  {
    id: "pkg-3",
    name: "Plan Felino Integral",
    species: "Gatos adultos y senior",
    price: "$55",
    features: [
      "Consulta Cat-Friendly sin estrés",
      "Vacuna Triple Felina + Rabia",
      "Pipeta antiparasitaria premium",
      "Perfil renal y glucosa preventivo",
      "Evaluación dental y asesoría de peso"
    ],
  },
];

export const VET_TEMPLATES = [
  {
    id: "govet" as VetTemplateId,
    name: "Govet Especialidades",
    tag: "ESPECIALIDADES & ALTA GAMA",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    description: "Psicología del color para dueños de mascotas (verde esmeralda, menta clínico, acentos miel cálido y blanco puro). Header de confianza 24/7 y Hero con Slider interactivo de Especialidades Médicas.",
    features: [
      "Logo vectorial exclusivo Govet con cruz y monograma",
      "Slider interactivo de especialidades médicas (editable)",
      "Selector rápido de especialidades por tarjetas miniatura",
      "Topbar de urgencias 24h y llamada directa a WhatsApp",
      "Soporte completo para fotos desde PC en Base64 o URL"
    ],
    previewColors: { header: "#ffffff", hero: "#f0fdf4", card: "#ffffff", accent: "#059669" },
    defaultColors: { primary: "#047857", secondary: "#0d9488", accent: "#d97706" },
  },
  {
    id: "welfare-elite" as VetTemplateId,
    name: "Welfare Elite Care",
    tag: "EDITORIAL & LUJO",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    description: "Estética hospitalaria premium en tonos crema, arena y terracota. Hero con Google Reviews 5.0, barra de métricas cápsula y tarjetas de planes de salud.",
    features: [
      "Hero editorial con rating 5.0 y fotos cálidas",
      "Franja de métricas en cápsulas elevadas",
      "Tablas de paquetes y planes de salud",
      "Bloque sobre nosotros con marco elíptico",
      "Galería social cuadrada y footer navy"
    ],
    previewColors: { header: "#ffffff", hero: "#faf7f2", card: "#ffffff", accent: "#b45309" },
    defaultColors: { primary: "#0f766e", secondary: "#b45309", accent: "#d97706" },
  },
  {
    id: "smartvet-center" as VetTemplateId,
    name: "SmartVet Center",
    tag: "MODERNA & CITAS EXPRESS",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
    description: "Diseño moderno y dinámico en tonos lila pastel y blanco. Motor de citas instantáneo en el Hero, micro-promociones con glassmorphism y marcas aliadas.",
    features: [
      "Motor interactivo de citas en el Hero",
      "Insignia retro 'The Best Vet Clinic'",
      "Tarjetas flotantes de promociones (-20%)",
      "Píldoras fotográficas de servicios",
      "Carrusel de marcas de nutrición (Royal Canin, Purina)"
    ],
    previewColors: { header: "#ffffff", hero: "#f5f3ff", card: "#ffffff", accent: "#7c3aed" },
    defaultColors: { primary: "#7c3aed", secondary: "#18181b", accent: "#f59e0b" },
  },
  {
    id: "medica-zoo" as VetTemplateId,
    name: "Medica Zoo Clínico",
    tag: "CLÍNICA & FLUJO ORGÁNICO",
    badgeColor: "bg-teal-100 text-teal-900 border-teal-300",
    description: "Estética médica limpia y empática en blanco nieve y cyan médico. Ruta visual de huellas S-Curve conectando servicios, tarjetas de garantías y banner 24/7.",
    features: [
      "Camino continuo de huellas que guía la lectura",
      "Cápsulas fotográficas ovaladas con servicios",
      "Garantías y certificaciones clínicas en relieve",
      "Banner de urgencias 24h de alto impacto",
      "Topbar médico con horarios y dirección"
    ],
    previewColors: { header: "#ffffff", hero: "#f0fdfa", card: "#ffffff", accent: "#0d9488" },
    defaultColors: { primary: "#0d9488", secondary: "#1e3a8a", accent: "#0284c7" },
  },
  {
    id: "vetcat-warm" as VetTemplateId,
    name: "Vet Cat & Calidez",
    tag: "ACUARELA & FAMILIAR",
    badgeColor: "bg-sky-100 text-sky-900 border-sky-300",
    description: "Ambiente cálido, tierno y accesible con suaves fondos de acuarela celeste y amarillo pastel. Fichas de doctores especialistas, precios transparentes y FAQs.",
    features: [
      "Fondos con suaves halos acuarelados",
      "Grid de servicios con avatares circulares de mascotas",
      "Carrusel de doctores veterinarios especialistas",
      "Bloque destacado de tarifas transparentes",
      "Preguntas frecuentes en acordeón limpio"
    ],
    previewColors: { header: "#ffffff", hero: "#f0f9ff", card: "#ffffff", accent: "#0284c7" },
    defaultColors: { primary: "#0284c7", secondary: "#f59e0b", accent: "#06b6d4" },
  },
  {
    id: "petclinic-pro" as VetTemplateId,
    name: "PetClinic Pro",
    tag: "MÉDICA & QUIRÚRGICA",
    badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
    description: "Presentación corporativa de alta tecnología médica en azul cobalto y verde esmeralda. Banner de descuento en 1ª visita y botón de guardia telefónica 24 horas.",
    features: [
      "Insignia de 10% Descuento en 1ª consulta",
      "Botón telefónico de guardia 24 horas",
      "Iconografía clínica especializada con tiempos",
      "Tour de áreas hospitalarias y tecnología",
      "Formulario médico directo de contacto"
    ],
    previewColors: { header: "#ffffff", hero: "#eff6ff", card: "#ffffff", accent: "#2563eb" },
    defaultColors: { primary: "#2563eb", secondary: "#059669", accent: "#ef4444" },
  },
  // Retrocompatibilidad
  {
    id: "modern-petcare" as VetTemplateId,
    name: "PetCare Moderna (Clásica)",
    tag: "FAMILIAR",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    description: "Diseño amigable con colores menta y coral, tarjetas flotantes y botón de WhatsApp.",
    features: ["Hero asimétrico con mascota", "WhatsApp flotante", "Servicios con hover 3D"],
    previewColors: { header: "#ffffff", hero: "#ecfdf5", card: "#ffffff", accent: "#10b981" },
    defaultColors: { primary: "#10b981", secondary: "#0f172a", accent: "#f97316" },
  },
  {
    id: "boutique-spa" as VetTemplateId,
    name: "Pet Spa & Boutique (Clásica)",
    tag: "PREMIUM",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    description: "Estética boutique con tipografía serif y tonos arena suaves.",
    features: ["Tipografía Serif", "Galería de mascotas", "Precios con duración"],
    previewColors: { header: "#ffffff", hero: "#fef3c7", card: "#ffffff", accent: "#c9a84c" },
    defaultColors: { primary: "#c9a84c", secondary: "#3d2b1f", accent: "#f59e0b" },
  },
] as const;

// ============================================================
// DEFAULTS
// ============================================================

export const DEFAULT_SECTIONS: WebsiteSections = {
  hero: { enabled: true, order: 1 },
  about: { enabled: true, order: 2 },
  metrics: { enabled: true, order: 3 },
  services: { enabled: true, order: 4 },
  health_plans: { enabled: true, order: 5 },
  team: { enabled: true, order: 6 },
  testimonials: { enabled: true, order: 7 },
  gallery: { enabled: false, order: 8 },
  blog_news: { enabled: false, order: 9 },
  faqs: { enabled: true, order: 10 },
  contact_booking: { enabled: true, order: 11 },
};

export const DEFAULT_HEALTH_PLANS: WebsiteHealthPlan[] = [
  {
    id: "plan-1",
    name: "Plan Cachorros & Gatitos",
    target: "Menores a 1 año de edad",
    price: "$45",
    period: "/mes o pago único anual",
    badge: "DESARROLLO",
    recommended: false,
    features: [
      "3 consultas de desarrollo pediátrico",
      "Esquema inicial completo de vacunas",
      "Desparasitación seriada bimensual",
      "Implantación de Microchip ISO oficial",
      "Asesoría nutricional de crecimiento",
      "10% dto en primera esterilización",
    ],
  },
  {
    id: "plan-2",
    name: "Plan Preventivo Integral",
    target: "Perros y gatos adultos (1 - 7 años)",
    price: "$65",
    period: "/mes o pago único anual",
    badge: "MÁS ELEGIDO",
    recommended: true,
    features: [
      "Consultas veterinarias ilimitadas",
      "Vacunación séxtuple / triple anual",
      "Antirrábica oficial certificada",
      "Profilaxis dental anual con ultrasonido",
      "Perfil sanguíneo y bioquímica anual",
      "Desparasitación interna y externa anual",
      "15% de descuento en quirófano y cirugías",
    ],
  },
  {
    id: "plan-3",
    name: "Plan Senior & Especialidad",
    target: "Mascotas mayores de 7 años",
    price: "$85",
    period: "/mes o pago único anual",
    badge: "ALTA ESPECIALIDAD",
    recommended: false,
    features: [
      "Monitoreo geriátrico semestral",
      "Ecografía abdominal de alta resolución",
      "Electrocardiograma y control cardíaco",
      "Perfil renal y hepático ampliado",
      "Terapia para articulaciones y movilidad",
      "Línea directa para emergencias 24/7",
    ],
  },
];

export const DEFAULT_FAQS: WebsiteFaq[] = [
  { id: "faq1", question: "¿Atienden emergencias fuera de horario?", answer: "Sí, contamos con servicio de urgencias. Comunícate a nuestro WhatsApp o llama directamente.", sort_order: 1 },
  { id: "faq2", question: "¿Qué vacunas necesita mi mascota anualmente?", answer: "Cada mascota requiere un plan personalizado. Agenda una consulta y nuestro médico te orientará.", sort_order: 2 },
  { id: "faq3", question: "¿Ofrecen servicio de estética canina y felina?", answer: "Sí, ofrecemos baño, corte y estética profesional. Agenda tu cita con anticipación.", sort_order: 3 },
  { id: "faq4", question: "¿Cómo puedo agendar una cita?", answer: "Puedes agendar vía WhatsApp, llamada o el formulario de este sitio. Respondemos en menos de 1 hora.", sort_order: 4 },
];

export const DEFAULT_METRICS: WebsiteMetric[] = [
  { id: "m1", value: "1,200+", label: "Mascotas atendidas", icon: "🐾" },
  { id: "m2", value: "8+", label: "Años de experiencia", icon: "⭐" },
  { id: "m3", value: "4", label: "Veterinarios especializados", icon: "👨‍⚕️" },
  { id: "m4", value: "98%", label: "Clientes satisfechos", icon: "💚" },
];

export const DEFAULT_SERVICES: Omit<WebsiteService, "id" | "clinicId">[] = [
  { title: "Consulta Médica General", description: "Revisión completa, diagnóstico y plan de tratamiento personalizado.", icon: "🩺", image_url: null, price: null, price_from: false, badge: "", duration: "30 min", sort_order: 1, is_active: true },
  { title: "Vacunación y Desparasitación", description: "Plan anual de vacunas según edad y estilo de vida de tu mascota.", icon: "💉", image_url: null, price: null, price_from: false, badge: "ESENCIAL", duration: "15 min", sort_order: 2, is_active: true },
  { title: "Cirugía y Procedimientos", description: "Cirugías de tejidos blandos, ortopedia y procedimientos menores.", icon: "🔬", image_url: null, price: null, price_from: true, badge: "", duration: "Variable", sort_order: 3, is_active: true },
  { title: "Estética y Grooming", description: "Baño medicado, corte de pelo, limpieza de oídos y corte de uñas.", icon: "✂️", image_url: null, price: null, price_from: true, badge: "MÁS POPULAR", duration: "1-2 horas", sort_order: 4, is_active: true },
  { title: "Odontología Veterinaria", description: "Limpieza dental profesional, extracciones y tratamiento de caries.", icon: "🦷", image_url: null, price: null, price_from: false, badge: "", duration: "45 min", sort_order: 5, is_active: true },
  { title: "Hospitalización 24h", description: "Cuidado intensivo y monitoreo constante para mascotas que lo requieren.", icon: "🏥", image_url: null, price: null, price_from: false, badge: "URGENCIAS", duration: "24/7", sort_order: 6, is_active: true },
];

export function slugify(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

// ============================================================
// STORE
// ============================================================

type State = {
  settings: WebsiteSettings | null;
  services: WebsiteService[];
  slides: WebsiteSlide[];
  team: WebsiteGroupItem[];
  testimonials: WebsiteTestimonial[];
  gallery: WebsiteGalleryItem[];
  posts: WebsitePost[];
};

let state: State = { settings: null, services: [], slides: [], team: [], testimonials: [], gallery: [], posts: [] };
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const emit = () => listeners.forEach((l) => l());
const set = (u: (s: State) => State) => { state = u(state); emit(); };

export const useWebsiteSettings = () => useSyncExternalStore(subscribe, () => state.settings, () => state.settings);
export const useWebsiteServices = () => useSyncExternalStore(subscribe, () => state.services, () => state.services);
export const useWebsiteSlides = () => useSyncExternalStore(subscribe, () => state.slides, () => state.slides);
export const useWebsiteTeam = () => useSyncExternalStore(subscribe, () => state.team, () => state.team);
export const useWebsiteTestimonials = () => useSyncExternalStore(subscribe, () => state.testimonials, () => state.testimonials);
export const useWebsiteGallery = () => useSyncExternalStore(subscribe, () => state.gallery, () => state.gallery);
export const useWebsitePosts = () => useSyncExternalStore(subscribe, () => state.posts, () => state.posts);
export const useWebsiteServiceCount = () => useTenantSlice(subscribe, () => state.services);

function mapSettings(r: Record<string, unknown>): WebsiteSettings {
  const id = (r.identity as Partial<WebsiteIdentity>) ?? {};
  const ct = (r.contact as Partial<WebsiteContact>) ?? {};
  return {
    id: String(r.id),
    clinicId: String(r.clinic_id),
    is_published: Boolean(r.is_published),
    template_id: (String(r.template_id ?? "modern-petcare")) as VetTemplateId,
    slug: String(r.slug ?? ""),
    identity: {
      name: id.name ?? "", tagline: id.tagline ?? "", description: id.description ?? "",
      logo_url: id.logo_url ?? null, primary_color: id.primary_color ?? "#10b981",
      secondary_color: id.secondary_color ?? "#0f172a", accent_color: id.accent_color ?? "#f97316",
      font_family: id.font_family ?? "Inter", mision: id.mision ?? "", vision: id.vision ?? "",
      historia: id.historia ?? "", founded_year: id.founded_year ?? "",
      certifications: id.certifications ?? [], cover_image_url: id.cover_image_url ?? null,
      health_plans_config: id.health_plans_config,
    },
    contact: {
      phone: ct.phone ?? "", phone2: ct.phone2 ?? "", whatsapp: ct.whatsapp ?? "",
      email: ct.email ?? "", address: ct.address ?? "", schedule: ct.schedule ?? "",
      emergency_24h: ct.emergency_24h ?? false, maps_embed_url: ct.maps_embed_url ?? "",
      google_maps_url: ct.google_maps_url ?? "",
      waze_url: ct.waze_url ?? "",
      whatsapp_message: ct.whatsapp_message ?? "",
      contact_badge: ct.contact_badge ?? "",
      contact_title: ct.contact_title ?? "",
      contact_subtitle: ct.contact_subtitle ?? "",
      location_badge: ct.location_badge ?? "",
      location_title: ct.location_title ?? "",
      perk_1: ct.perk_1 ?? "",
      perk_2: ct.perk_2 ?? "",
      perk_3: ct.perk_3 ?? "",
      social: { facebook: "", instagram: "", tiktok: "", youtube: "", twitter: "", linkedin: "", ...(ct.social ?? {}) },
    },
    seo: (r.seo as WebsiteSeo) ?? { meta_title: "", meta_description: "", og_image: null, keywords: [], canonical_url: "" },
    sections_config: { ...DEFAULT_SECTIONS, ...((r.sections_config as WebsiteSections) ?? {}) },
    faqs: (r.faqs as WebsiteFaq[]) ?? DEFAULT_FAQS,
    metrics: (r.metrics as WebsiteMetric[]) ?? DEFAULT_METRICS,
  };
}

function mapService(r: Record<string, unknown>): WebsiteService {
  return {
    id: String(r.id), clinicId: String(r.clinic_id), title: String(r.title ?? ""),
    description: String(r.description ?? ""), icon: String(r.icon ?? "🐾"),
    image_url: r.image_url as string | null, price: r.price as number | null,
    price_from: Boolean(r.price_from), badge: String(r.badge ?? ""),
    duration: String(r.duration ?? ""), sort_order: Number(r.sort_order ?? 0),
    is_active: Boolean(r.is_active),
  };
}

function mapSlide(r: Record<string, unknown>): WebsiteSlide {
  return { id: String(r.id), clinicId: String(r.clinic_id), title: String(r.title ?? ""), subtitle: String(r.subtitle ?? ""), image_url: String(r.image_url ?? ""), cta_text: String(r.cta_text ?? "Ver Más"), cta_link: String(r.cta_link ?? "#contacto"), sort_order: Number(r.sort_order ?? 0) };
}

export async function hydrateWebsite(clinicId: string): Promise<void> {
  const [s, sv, sl, te, tm, ga, po] = await Promise.all([
    db.from("website_settings").select("*").eq("clinic_id", clinicId).maybeSingle(),
    db.from("website_services").select("*").eq("clinic_id", clinicId).order("sort_order", { ascending: true }),
    db.from("website_slides").select("*").eq("clinic_id", clinicId).order("sort_order", { ascending: true }),
    db.from("veterinarios").select("*").eq("clinic_id", clinicId).order("nombre", { ascending: true }),
    db.from("website_testimonials").select("*").eq("clinic_id", clinicId).eq("is_active", true).order("sort_order", { ascending: true }),
    db.from("website_gallery").select("*").eq("clinic_id", clinicId).eq("is_active", true).order("sort_order", { ascending: true }),
    db.from("website_posts").select("*").eq("clinic_id", clinicId).eq("is_published", true).order("published_at", { ascending: false }),
  ]);
  set(() => ({
    settings: s.data ? mapSettings(s.data) : null,
    services: (sv.data ?? []).map(mapService),
    slides: (sl.data ?? []).map(mapSlide),
    team: (te.data ?? []).map((r: Record<string, unknown>) => ({ id: String(r.id), name: String(r.nombre ?? ""), role: String(r.especialidad ?? ""), photo: String(r.foto ?? ""), description: String(r.notas ?? ""), specialties: [] })),
    testimonials: (tm.data ?? []).map((r: Record<string, unknown>) => ({ id: String(r.id), author: String(r.author ?? ""), pet_name: String(r.pet_name ?? ""), role: String(r.role ?? ""), content: String(r.content ?? ""), rating: Number(r.rating ?? 5), photo_url: r.photo_url as string | null })),
    gallery: (ga.data ?? []).map((r: Record<string, unknown>) => ({ id: String(r.id), title: String(r.title ?? ""), image_url: String(r.image_url ?? "") })),
    posts: (po.data ?? []).map((r: Record<string, unknown>) => ({ id: String(r.id), title: String(r.title ?? ""), slug: String(r.slug ?? ""), summary: String(r.summary ?? ""), content: String(r.content ?? ""), cover_image: r.cover_image as string | null, published_at: String(r.published_at ?? "") })),
  }));
}

export async function ensureWebsite(clinicId: string, slug: string): Promise<void> {
  const { data: existing } = await db.from("website_settings").select("id").eq("clinic_id", clinicId).maybeSingle();
  if (existing?.id) return;
  const { error } = await db.from("website_settings").insert({ clinic_id: clinicId, slug });
  if (error) console.error(error);
  else await hydrateWebsite(clinicId);
}

export function saveWebsiteSettings(patch: {
  is_published?: boolean; template_id?: VetTemplateId; slug?: string;
  identity?: Partial<WebsiteIdentity>; contact?: Partial<WebsiteContact>;
  seo?: Partial<WebsiteSeo>; sections_config?: WebsiteSections;
  faqs?: WebsiteFaq[]; metrics?: WebsiteMetric[];
}) {
  set((s) => {
    if (!s.settings) return s;
    const base = s.settings;
    return {
      ...s,
      settings: {
        ...base,
        is_published: patch.is_published ?? base.is_published,
        template_id: patch.template_id ?? base.template_id,
        slug: patch.slug ?? base.slug,
        identity: { ...base.identity, ...(patch.identity ?? {}) },
        contact: patch.contact ? { ...base.contact, ...patch.contact, social: { ...base.contact.social, ...(patch.contact.social ?? {}) } } : base.contact,
        seo: patch.seo ? { ...base.seo, ...patch.seo } : base.seo,
        sections_config: patch.sections_config ?? base.sections_config,
        faqs: patch.faqs ?? base.faqs,
        metrics: patch.metrics ?? base.metrics,
      },
    };
  });
  const row: Record<string, unknown> = {};
  if (patch.template_id !== undefined) row.template_id = patch.template_id;
  if (patch.is_published !== undefined) row.is_published = patch.is_published;
  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.identity) row.identity = { ...(state.settings?.identity ?? {}), ...patch.identity };
  if (patch.contact) row.contact = { ...(state.settings?.contact ?? {}), ...patch.contact, social: { ...(state.settings?.contact?.social ?? {}), ...(patch.contact.social ?? {}) } };
  if (patch.seo) row.seo = { ...(state.settings?.seo ?? {}), ...patch.seo };
  if (patch.sections_config) row.sections_config = patch.sections_config;
  if (patch.faqs) row.faqs = patch.faqs;
  if (patch.metrics) row.metrics = patch.metrics;
  if (!state.settings?.id) return;
  void db.from("website_settings").update(row).eq("id", state.settings.id).then(() => {}).catch((e) => console.error(e));
}

export function addWebsiteService(svc: Omit<WebsiteService, "id" | "clinicId">) {
  const item: WebsiteService = { ...svc, id: crypto.randomUUID(), clinicId: getCurrentClinicId() };
  set((s) => ({ ...s, services: [...s.services, item] }));
  void db.from("website_services").insert({ id: item.id, clinic_id: item.clinicId, title: item.title, description: item.description, icon: item.icon, image_url: item.image_url, price: item.price, price_from: item.price_from, badge: item.badge, duration: item.duration, sort_order: item.sort_order, is_active: item.is_active }).then(() => {}).catch((e) => console.error(e));
}

export function updateWebsiteService(id: string, patch: Partial<WebsiteService>) {
  set((s) => ({ ...s, services: s.services.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.icon !== undefined) row.icon = patch.icon;
  if (patch.image_url !== undefined) row.image_url = patch.image_url;
  if (patch.price !== undefined) row.price = patch.price;
  if (patch.price_from !== undefined) row.price_from = patch.price_from;
  if (patch.badge !== undefined) row.badge = patch.badge;
  if (patch.duration !== undefined) row.duration = patch.duration;
  if (patch.sort_order !== undefined) row.sort_order = patch.sort_order;
  if (patch.is_active !== undefined) row.is_active = patch.is_active;
  void db.from("website_services").update(row).eq("id", id).then(() => {}).catch((e) => console.error(e));
}

export function deleteWebsiteService(id: string) {
  set((s) => ({ ...s, services: s.services.filter((x) => x.id !== id) }));
  void db.from("website_services").delete().eq("id", id).then(() => {}).catch((e) => console.error(e));
}

export async function addWebsiteSlide(slide: Omit<WebsiteSlide, "id" | "clinicId">): Promise<WebsiteSlide> {
  const clinicId = getCurrentClinicId() || "00000000-0000-0000-0000-0000000000a1";
  const item: WebsiteSlide = { ...slide, id: crypto.randomUUID(), clinicId };
  set((s) => ({ ...s, slides: [...s.slides, item] }));
  const { error } = await db.from("website_slides").insert({
    id: item.id,
    clinic_id: item.clinicId,
    title: item.title,
    subtitle: item.subtitle,
    image_url: item.image_url,
    cta_text: item.cta_text,
    cta_link: item.cta_link,
    sort_order: item.sort_order,
  });
  if (error) {
    console.error("Error inserting website slide:", error);
  }
  return item;
}

export async function updateWebsiteSlide(id: string, patch: Partial<WebsiteSlide>): Promise<void> {
  set((s) => ({ ...s, slides: s.slides.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.subtitle !== undefined) row.subtitle = patch.subtitle;
  if (patch.image_url !== undefined) row.image_url = patch.image_url;
  if (patch.cta_text !== undefined) row.cta_text = patch.cta_text;
  if (patch.cta_link !== undefined) row.cta_link = patch.cta_link;
  if (patch.sort_order !== undefined) row.sort_order = patch.sort_order;
  const { error } = await db.from("website_slides").update(row).eq("id", id);
  if (error) {
    console.error("Error updating website slide:", error);
  }
}

export async function deleteWebsiteSlide(id: string): Promise<void> {
  set((s) => ({ ...s, slides: s.slides.filter((x) => x.id !== id) }));
  const { error } = await db.from("website_slides").delete().eq("id", id);
  if (error) {
    console.error("Error deleting website slide:", error);
  }
}

export async function fetchPublicSite(slug: string) {
  const cleanSlug = slug.toLowerCase().trim();
  const cleanNoDash = cleanSlug.replace(/-/g, "");

  let { data: s } = await db.from("website_settings").select("*").eq("slug", cleanSlug).eq("is_published", true).maybeSingle();
  if (!s && cleanNoDash !== cleanSlug) {
    const { data: s2 } = await db.from("website_settings").select("*").eq("slug", cleanNoDash).eq("is_published", true).maybeSingle();
    s = s2;
  }
  if (!s) {
    const { data: clinicMatch } = await db
      .from("clinics")
      .select("id")
      .or(`subdomain.eq.${cleanSlug},subdomain.eq.${cleanNoDash}`)
      .maybeSingle();
    if (clinicMatch) {
      const { data: s3 } = await db.from("website_settings").select("*").eq("clinic_id", clinicMatch.id).maybeSingle();
      s = s3;
    }
  }
  if (!s) return null;
  const [sv, sl, cl, te, tm, ga, po] = await Promise.all([
    db.from("website_services").select("*").eq("clinic_id", s.clinic_id).eq("is_active", true).order("sort_order", { ascending: true }),
    db.from("website_slides").select("*").eq("clinic_id", s.clinic_id).order("sort_order", { ascending: true }),
    db.from("clinics").select("name, logo_url").eq("id", s.clinic_id).maybeSingle(),
    db.from("veterinarios").select("*").eq("clinic_id", s.clinic_id).order("nombre", { ascending: true }),
    db.from("website_testimonials").select("*").eq("clinic_id", s.clinic_id).eq("is_active", true).order("sort_order", { ascending: true }),
    db.from("website_gallery").select("*").eq("clinic_id", s.clinic_id).eq("is_active", true).order("sort_order", { ascending: true }),
    db.from("website_posts").select("*").eq("clinic_id", s.clinic_id).eq("is_published", true).order("published_at", { ascending: false }),
  ]);
  const settings = mapSettings(s);
  const services = (sv.data ?? []).map(mapService);
  const slides = (sl.data ?? []).map(mapSlide);
  const fallbackClinicName = settings.identity.name?.trim() || (cleanSlug === "pawspattient" ? "Paws Pattient" : "Clínica Veterinaria");
  const clinic = cl.data && cl.data.name
    ? { name: String(cl.data.name), logo_url: String(cl.data.logo_url || settings.identity.logo_url || "") }
    : { name: fallbackClinicName, logo_url: settings.identity.logo_url || "" };
  if (!settings.identity.name) {
    settings.identity.name = clinic.name;
  }
  const team = (te.data ?? []).map((r: Record<string, unknown>) => ({ id: String(r.id), name: String(r.nombre ?? ""), role: String(r.especialidad ?? ""), photo: String(r.foto ?? ""), description: String(r.notas ?? ""), specialties: [] as string[] }));
  const testimonials = (tm.data ?? []).map((r: Record<string, unknown>) => ({ id: String(r.id), author: String(r.author ?? ""), pet_name: String(r.pet_name ?? ""), role: String(r.role ?? ""), content: String(r.content ?? ""), rating: Number(r.rating ?? 5), photo_url: r.photo_url as string | null }));
  const gallery = (ga.data ?? []).map((r: Record<string, unknown>) => ({ id: String(r.id), title: String(r.title ?? ""), image_url: String(r.image_url ?? "") }));
  const posts = (po.data ?? []).map((r: Record<string, unknown>) => ({ id: String(r.id), title: String(r.title ?? ""), slug: String(r.slug ?? ""), summary: String(r.summary ?? ""), content: String(r.content ?? ""), cover_image: r.cover_image as string | null, published_at: String(r.published_at ?? "") }));
  const finalServices = services.length > 0 ? services : DEFAULT_SERVICES.map((d, i) => ({ ...d, id: `demo-${i}`, clinicId: String(s.clinic_id) }));
  return { settings, services: finalServices, slides, clinic, team, testimonials, gallery, posts };
}

export function slugFromHost(hostname: string): string | null {
  if (!hostname || hostname === "localhost" || hostname.endsWith(".vercel.app") || hostname.endsWith(".netlify.app")) {
    return null;
  }
  const parts = hostname.split(".");
  if (parts.length < 3) return null;
  return parts[0];
}

registerHydrator(hydrateWebsite);
