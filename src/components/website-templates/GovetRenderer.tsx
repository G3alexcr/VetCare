'use client';

import React, { useState, useEffect } from 'react';
import { 
  Phone, Mail, MapPin, Clock, Star, Calendar, ArrowRight, 
  Check, ShieldCheck, Heart, Award, Instagram, Facebook, 
  ChevronRight, MessageCircle, Sparkles, AlertCircle, 
  Stethoscope, Activity, ChevronLeft, CheckCircle2, Zap, Globe
} from 'lucide-react';
import { 
  DEFAULT_HEALTH_PLANS,
  type WebsiteSettings, type WebsiteService, type WebsiteSlide, 
  type WebsiteGroupItem, type WebsiteTestimonial, type WebsiteGalleryItem, type WebsitePost 
} from '@/lib/website-store';
import { GovetLogo } from './GovetLogo';
import { AppFooter } from '@/components/AppFooter';

interface Props {
  settings: WebsiteSettings;
  services: WebsiteService[];
  slides?: WebsiteSlide[];
  clinic: { name: string; logo_url: string } | null;
  team: WebsiteGroupItem[];
  testimonials: WebsiteTestimonial[];
  gallery: WebsiteGalleryItem[];
  posts: WebsitePost[];
}

export function GovetRenderer({ settings, services, slides, clinic, team, testimonials }: Props) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [bookingData, setBookingData] = useState({
    name: '',
    phone: '',
    pet: '',
    specialty: 'Cirugía y Quirófano',
    date: '',
    time: '10:00',
  });

  const id = settings.identity;
  const ct = settings.contact;
  const clinicName = id.name?.trim() || clinic?.name?.trim() || "Paws Pattient";

  const cleanSlideTitle = (title: string) => {
    if (!title) return `Especialidades Médicas ${clinicName}`;
    return title.replace(/VetCare(\s*San\s*Jos[eé])?/gi, clinicName).replace(/Govet/gi, clinicName);
  };

  const cleanSlideSubtitle = (sub: string) => {
    if (!sub) return "";
    return sub.replace(/VetCare(\s*San\s*Jos[eé])?/gi, clinicName).replace(/Govet/gi, clinicName);
  };

  // Configuración dinámica y visibilidad de los Planes de Salud
  const showHealthPlans = settings.sections_config?.health_plans?.enabled !== false;
  const hpConfig = id.health_plans_config;
  const plansTitle = hpConfig?.title || "Planes de Salud y Paquetes Preventivos";
  const plansSubtitle = hpConfig?.subtitle || "Tranquilidad médica continua para tu mascota con coberturas diseñadas para cada edad y etapa de vida.";
  const plansList = (hpConfig?.plans && hpConfig.plans.length > 0) ? hpConfig.plans : DEFAULT_HEALTH_PLANS;

  // Especialidades preconfiguradas editables desde el CMS (o cargadas desde la PC)
  const defaultSpecialtySlides: WebsiteSlide[] = [
    {
      id: 'govet-1',
      clinicId: '',
      title: 'Cirugía Avanzada y Quirófano Monitorizado',
      subtitle: 'Quirófano estéril con anestesia inhalatoria, monitorización hemodinámica multiparamétrica y cuidados post-operatorios intensivos.',
      image_url: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1200&q=80',
      cta_text: 'Agendar Cirugía',
      cta_link: '#cita',
      sort_order: 1,
    },
    {
      id: 'govet-2',
      clinicId: '',
      title: 'Cardiología & Ultrasonido Doppler Color',
      subtitle: 'Ecografía diagnóstica de alta resolución, electrocardiograma digital y control preventivo de soplos y cardiopatías en minutos.',
      image_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1200&q=80',
      cta_text: 'Consulta Cardiológica',
      cta_link: '#cita',
      sort_order: 2,
    },
    {
      id: 'govet-3',
      clinicId: '',
      title: 'Traumatología, Ortopedia & Rehabilitación',
      subtitle: 'Resolución de fracturas complejas, displasia de cadera, artroscopia y terapia física asistida para una pronta recuperación.',
      image_url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=80',
      cta_text: 'Ver Especialistas',
      cta_link: '#cita',
      sort_order: 3,
    },
    {
      id: 'govet-4',
      clinicId: '',
      title: 'Dermatología Clínica & Control de Alergias',
      subtitle: 'Pruebas de alergia alimentaria y ambiental, citologías in situ y tratamientos biológicos sin dolor para piel y pelaje sano.',
      image_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=80',
      cta_text: 'Chequeo Dermatológico',
      cta_link: '#cita',
      sort_order: 4,
    },
    {
      id: 'govet-5',
      clinicId: '',
      title: 'Odontología Quirúrgica & Profilaxis Ultrasónica',
      subtitle: 'Limpieza dental con ultrasonido piezoeléctrico, pulido sin dolor y extracciones reconstructivas bajo sedación segura.',
      image_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1200&q=80',
      cta_text: 'Salud Bucal',
      cta_link: '#cita',
      sort_order: 5,
    },
  ];

  const defaultGovetServices = [
    {
      num: "01",
      title: "Medicina General",
      desc: "Atención médica integral enfocada en la prevención, diagnóstico temprano y seguimiento continuo de la salud de perros y gatos en cada etapa de su vida.",
      img: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80",
      badge: "Consulta",
    },
    {
      num: "02",
      title: "Medicina Preventiva",
      desc: "Esquemas completos de vacunación séxtuple y felina, desparasitación interna y externa seriada, microchip oficial y chequeos anuales.",
      img: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80",
      badge: "Esencial",
    },
    {
      num: "03",
      title: "Peluquería Canina",
      desc: "Sesiones de estética y spa profesional sin estrés, baños medicados dermatológicos, corte higiénico de raza y limpieza de oídos.",
      img: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=600&q=80",
      badge: "Bienestar",
    },
    {
      num: "04",
      title: "Odontología",
      desc: "Profilaxis dental con ultrasonido piezoeléctrico, remoción de sarro sin dolor, pulido de esmalte y tratamiento de salud bucodental.",
      img: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80",
      badge: "Higiene",
    },
    {
      num: "05",
      title: "Rayos X",
      desc: "Radiología digital de mínima exposición para tórax, abdomen y sistema óseo, con entrega de placas y diagnóstico inmediato en consulta.",
      img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
      badge: "Diagnóstico",
    },
    {
      num: "06",
      title: "Ultrasonido",
      desc: "Ecografía diagnóstica no invasiva de alta resolución para órganos internos, control de gestación y evaluación cardiovascular en tiempo real.",
      img: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=600&q=80",
      badge: "Imagen",
    },
    {
      num: "07",
      title: "Certificados de Exportación",
      desc: "Gestión y emisión de certificados zoosanitarios internacionales para viajes, verificación de microchip ISO, vacunas y pasaporte oficial.",
      img: "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&w=600&q=80",
      badge: "Viajes",
    },
    {
      num: "08",
      title: "Cirugía General",
      desc: "Procedimientos quirúrgicos de tejidos blandos y esterilizaciones con protocolos anestésicos inhalatorios y monitorización hemodinámica continua.",
      img: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=600&q=80",
      badge: "Quirófano",
    },
    {
      num: "09",
      title: "Pet Shop",
      desc: "Alimentos medicados de prescripción veterinaria, dietas de alta gama, antiparasitarios autorizados y accesorios diseñados para su bienestar.",
      img: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=600&q=80",
      badge: "Tienda",
    },
    {
      num: "10",
      title: "Hospedaje",
      desc: "Hotel canino y felino con espacios individuales aclimatados, supervisión médica veterinaria las 24 horas y administración de dietas especiales.",
      img: "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=600&q=80",
      badge: "Hotel 24h",
    },
  ];

  // Si la clínica editó servicios en el CMS los usa con prioridad; sino muestra los 10 servicios oficiales Govet
  const displayServices = (services && services.length > 0)
    ? services.map((s, idx) => ({
        num: String(idx + 1).padStart(2, '0'),
        title: s.title,
        desc: s.description,
        img: s.image_url || "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80",
        badge: s.badge || "Especialidad",
      }))
    : defaultGovetServices;

  // Si la clínica configuró diapositivas en el CMS, las usa; de lo contrario usa las 5 especialidades predeterminadas
  const activeSlides = (slides && slides.length > 0) ? slides : defaultSpecialtySlides;
  const currentSlide = activeSlides[activeSlideIndex % activeSlides.length];

  // Cambio automático de slides cada 5 segundos si no está en pausa
  useEffect(() => {
    if (isPaused || activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % activeSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused, activeSlides.length]);

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSent(true);
    setTimeout(() => {
      setAppointmentModalOpen(false);
      setFormSent(false);
    }, 2200);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. TOPBAR DE URGENCIAS Y CONFIANZA MÉDICA */}
      <div className="w-full bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-24 py-2 text-xs font-medium border-b border-emerald-800/40">
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span className="font-semibold text-emerald-200">
              Guardia 24/7 en Urgencias y Especialidades Médicas
            </span>
            <span className="hidden sm:inline text-emerald-500">•</span>
            <span className="hidden sm:inline text-slate-300 text-[11px]">
              Quirófano, ecografía doppler y laboratorio in situ
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {ct.phone && (
              <a 
                href={`tel:${ct.phone}`} 
                className="hover:text-emerald-300 flex items-center gap-1.5 font-bold transition-colors bg-emerald-800/60 px-2.5 py-0.5 rounded-full border border-emerald-700/50"
              >
                <Phone className="w-3 h-3 text-emerald-300" />
                <span>{ct.phone}</span>
              </a>
            )}
            {ct.schedule && (
              <div className="hidden md:flex items-center gap-1 text-slate-300">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>{ct.schedule}</span>
              </div>
            )}
            {ct.whatsapp && (
              <a 
                href={`https://wa.me/${ct.whatsapp.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noreferrer"
                className="hidden lg:flex items-center gap-1 text-emerald-300 hover:text-white font-semibold transition-colors"
              >
                <MessageCircle className="w-3 h-3" /> WhatsApp Directo
              </a>
            )}
          </div>

        </div>
      </div>

      {/* 2. HEADER PRINCIPAL GOVET (100% LUZ Y PROFESIONALISMO) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-24 h-20 flex items-center justify-between gap-4">
          
          {/* Logo Govet */}
          <div className="flex items-center gap-3">
            {clinic?.logo_url ? (
              <div className="flex items-center gap-2.5">
                <img src={clinic.logo_url} alt={clinicName} className="h-10 w-auto object-contain rounded-lg" />
                <span className="font-black text-xl text-slate-900 tracking-tight hidden sm:inline">
                  {clinicName}
                </span>
              </div>
            ) : (
              <GovetLogo size="md" name={clinicName} tagline={id.tagline || "Centro de Especialidades"} />
            )}
          </div>

          {/* Menú de Navegación */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#hero" className="text-emerald-700 font-bold hover:text-emerald-800 transition-colors">
              Inicio
            </a>
            <a href="#nosotros" className="hover:text-emerald-700 transition-colors">
              Sobre Nosotros
            </a>
            <a href="#servicios" className="hover:text-emerald-700 transition-colors">
              Especialidades & Servicios
            </a>
            {showHealthPlans && (
              <a href="#planes" className="hover:text-emerald-700 transition-colors">
                Planes de Salud
              </a>
            )}
            <a href="#opiniones" className="hover:text-emerald-700 transition-colors">
              Opiniones
            </a>
            <a href="#contacto" className="hover:text-emerald-700 transition-colors">
              Contacto
            </a>
          </nav>

          {/* Acciones de Llamada y Citas */}
          <div className="flex items-center gap-3">
            {ct.phone && (
              <a 
                href={`tel:${ct.phone}`}
                className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-200 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center">
                  <Phone className="w-3 h-3" />
                </div>
                <span>{ct.phone}</span>
              </a>
            )}

            <button
              onClick={() => setAppointmentModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold tracking-wide transition-all shadow-sm hover:shadow-md flex items-center gap-2 group"
            >
              <Calendar className="w-4 h-4 text-emerald-100" />
              <span>Agendar Cita</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

        </div>
      </header>

      {/* 3. HERO SECTION CON SLIDER A SANGRE COMPLETA (100% ANCHO DE LADO A LADO) */}
      <section 
        id="hero" 
        className="relative w-full min-h-[580px] sm:min-h-[640px] md:h-[700px] lg:h-[740px] xl:h-[780px] 2xl:h-[820px] overflow-hidden bg-slate-950"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Imagen de Fondo a Sangre Completa (object-center con altura ampliada para encuadre óptimo de doctores y mascotas) */}
        <div className="absolute inset-0 w-full h-full">
          <img 
            src={currentSlide.image_url} 
            alt={cleanSlideTitle(currentSlide.title)}
            className="w-full h-full object-cover object-center transition-all duration-700" 
          />
          {/* Capas de degradado para garantizar contraste y legibilidad del texto sin oscurecer rostros */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/60 sm:via-slate-950/45 to-slate-950/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
        </div>

        {/* Contenido sobre la Imagen: Centrado verticalmente y alineado a la izquierda */}
        <div className="relative z-10 w-full h-full max-w-[1780px] mx-auto px-6 sm:px-12 lg:px-16 2xl:px-24 flex flex-col justify-center py-12">
          <div className="max-w-2xl space-y-3.5 sm:space-y-4">
            
            {/* Badge de Especialidad */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/90 text-white text-xs font-black uppercase tracking-wider backdrop-blur-xs shadow-xs w-fit">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>Especialidad #{((activeSlideIndex % activeSlides.length) + 1).toString().padStart(2, '0')}</span>
              <span className="text-emerald-200">•</span>
              <span className="text-[11px] font-bold text-amber-300">{clinicName} Medical</span>
            </div>

            {/* Título de la Especialidad */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
              {cleanSlideTitle(currentSlide.title)}
            </h1>

            {/* Subtítulo de la Especialidad */}
            <p className="text-xs sm:text-sm md:text-base text-slate-200 font-normal leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-3 drop-shadow-xs">
              {cleanSlideSubtitle(currentSlide.subtitle)}
            </p>

            {/* Puntos de Confianza Psicológicos */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1 text-xs font-bold text-white/95 max-w-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white grid place-items-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Médicos Certificados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white grid place-items-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Atención Sin Estrés</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white grid place-items-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Resultados Mismo Día</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white grid place-items-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Monitoreo Continuo 24h</span>
              </div>
            </div>

            {/* Botones de Acción del Slide */}
            <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setAppointmentModalOpen(true)}
                className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 group hover:scale-[1.02]"
              >
                <span>{currentSlide.cta_text || "Agendar Cita"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {ct.whatsapp && (
                <a
                  href={`https://wa.me/${ct.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm backdrop-blur-xs transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-300" />
                  <span>WhatsApp</span>
                </a>
              )}

              {ct.phone && (
                <a
                  href={`tel:${ct.phone}`}
                  className="px-5 py-3 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm backdrop-blur-xs transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4 text-emerald-300" />
                  <span>Llamar</span>
                </a>
              )}
            </div>

          </div>
        </div>

        {/* Flechas de Navegación Laterales Flotantes */}
        <button 
          onClick={() => setActiveSlideIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length)}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md grid place-items-center shadow-lg transition-all hover:scale-105"
          aria-label="Especialidad Anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setActiveSlideIndex((prev) => (prev + 1) % activeSlides.length)}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md grid place-items-center shadow-lg transition-all hover:scale-105"
          aria-label="Siguiente Especialidad"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Botones Indicadores Compactos (Sin scroll horizontal, 100% limpios en móvil y desktop) */}
        <div className="absolute bottom-5 left-0 right-0 z-20 px-6 pointer-events-none">
          <div className="max-w-[1780px] mx-auto flex items-center justify-center sm:justify-between">
            {/* Píldoras / Dots pequeños de navegación */}
            <div className="flex items-center gap-2 pointer-events-auto bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10 shadow-lg">
              {activeSlides.map((_, idx) => {
                const isActive = idx === activeSlideIndex % activeSlides.length;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`transition-all duration-300 rounded-full ${
                      isActive 
                        ? "w-7 h-2.5 bg-emerald-400 shadow-sm ring-2 ring-emerald-300/40" 
                        : "w-2.5 h-2.5 bg-white/40 hover:bg-white/80"
                    }`}
                    aria-label={`Ir a diapositiva ${idx + 1}`}
                  />
                );
              })}
            </div>

            {/* Contador numérico sutil */}
            <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/90 text-xs font-bold pointer-events-auto shadow-lg">
              <span className="text-emerald-300">{(activeSlideIndex % activeSlides.length) + 1}</span>
              <span className="text-white/30">/</span>
              <span>{activeSlides.length}</span>
            </div>
          </div>
        </div>

      </section>

      {/* 4. SECCIÓN SOBRE NOSOTROS & NUESTRA HISTORIA (UNIFICADA) */}
      <section id="nosotros" className="relative py-16 sm:py-24 bg-white border-b border-slate-100 overflow-hidden">
        {/* Elemento decorativo sutil de fondo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50/70 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-50/70 rounded-full blur-3xl pointer-events-none -ml-32 -mb-32" />

        <div className="w-full max-w-[1780px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 relative z-10">
          
          {/* Encabezado Unificado de Sección */}
          <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16 space-y-3.5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sobre Nosotros & Nuestra Historia</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Cuidamos la vida de tu mascota con vocación y ciencia médica
            </h2>

            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
              {id.mision || "Nuestra misión es brindar un cuidado integral y de alta especialidad a las mascotas a través de médicos extraordinarios y un trato profundamente humano. Ofrecemos atención para urgencias 24/7 y medicina preventiva de excelencia."}
            </p>
          </div>

          {/* Bloque de Dos Columnas: Fotografía + Narrativa Completa */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-16 items-center">
            
            {/* Columna Izquierda: Foto de la Clínica con Badges */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-50 bg-slate-100 aspect-4/3 sm:aspect-4/3 lg:aspect-square">
                <img 
                  src={id.about_image_url || id.cover_image_url || "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80"} 
                  alt="Instalaciones y equipo Govet" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Badge Flotante de Experiencia */}
              <div className="absolute -bottom-5 -right-3 sm:right-6 bg-white p-3.5 sm:p-4 rounded-2xl shadow-xl border border-slate-200/80 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 grid place-items-center font-black text-base">
                  🏥
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 leading-tight">
                    {id.founded_year ? `Fundada en ${id.founded_year}` : "Especialistas Certificados"}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    Compromiso & Salud Animal
                  </div>
                </div>
              </div>

              {/* Píldoras Rápidas de Confianza bajo la foto */}
              <div className="grid grid-cols-3 gap-2.5 mt-8 pt-2">
                <div className="text-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-lg font-black text-emerald-700">+15</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Años Exp.</div>
                </div>
                <div className="text-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-lg font-black text-emerald-700">+12k</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pacientes</div>
                </div>
                <div className="text-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-lg font-black text-emerald-700">24/7</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Urgencias</div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Narrativa, Visión, Cita y Botones */}
            <div className="lg:col-span-7 space-y-5">
              
              <div className="space-y-3">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Conoce nuestra historia y origen
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  {id.historia || `${clinicName} nace con la vocación de transformar radicalmente la experiencia del cuidado médico veterinario. Mediante un trato empático, instalaciones quirúrgicas esterilizadas y tecnología diagnóstica de alta precisión, nos convertimos en el destino de máxima confianza para tu familia.`}
                </p>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  {id.vision || "En nuestras instalaciones nos enfocamos en reunir al mejor equipo médico veterinario para garantizar un servicio extraordinario. Toda nuestra infraestructura está diseñada en torno a este principio: crear un entorno acogedor y libre de estrés tanto para las mascotas como para sus dueños."}
                </p>
              </div>

              {/* Cita en Tarjeta Destacada */}
              <div className="bg-emerald-50/70 border-l-4 border-emerald-600 p-4 sm:p-5 rounded-r-2xl">
                <p className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed italic">
                  "Imagina dejar a tu perro o gato en manos de especialistas certificados, sabiendo que cuentan con quirófano monitorizado, laboratorio in situ y ecografía doppler para actuar cuando cada minuto cuenta."
                </p>
              </div>

              {/* Firma y Certificaciones */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <div className="font-black text-slate-900 text-sm">
                    Dirección Médica & Co-fundadores
                  </div>
                  <div className="text-emerald-700 font-bold text-xs">
                    {clinicName} • Hospital de Especialidades
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 font-bold text-xs border border-emerald-200">
                    ✓ Protocolo Sin Estrés
                  </span>
                  <span className="px-3 py-1 rounded-full bg-teal-100/70 text-teal-800 font-bold text-xs border border-teal-200">
                    ✓ Quirófano Propio
                  </span>
                </div>
              </div>

              {/* Botones de Acción de la Sección */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setAppointmentModalOpen(true)}
                  className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold tracking-wide transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-emerald-100" />
                  <span>Agenda una cita médica</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {ct.whatsapp && (
                  <a
                    href={`https://wa.me/${ct.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-colors flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Hablar por WhatsApp</span>
                  </a>
                )}
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 5. SECCIÓN DE SERVICIOS (ADAPTATIVA 100% RESPONSIVE EN MONITORES GRANDES) */}
      <section id="servicios" className="py-16 sm:py-24 bg-[#EDF6F5] border-b border-emerald-100/80">
        <div className="w-full max-w-[1780px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          
          {/* Encabezado de la Sección */}
          <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-800 bg-white px-4 py-1.5 rounded-full border border-emerald-200 shadow-2xs inline-block">
              Servicios Clínicos & Cuidado Integral
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Cuidado Médico Especializado en un Solo Lugar
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
              Desde chequeos preventivos de rutina hasta procedimientos quirúrgicos de alta precisión y bienestar diario para tus compañeros de vida.
            </p>
          </div>

          {/* Grid Adaptable: 1 col (móvil), 2 cols (sm), 3 cols (md), 4 cols (lg), 5 cols (xl / monitores anchos) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
            {displayServices.map((svc) => (
              <div 
                key={svc.num}
                className="group flex flex-col justify-between rounded-3xl bg-white p-3.5 sm:p-4 shadow-sm hover:shadow-xl border border-slate-200/80 transition-all duration-300 hover:-translate-y-1.5"
              >
                <div>
                  {/* Imagen del Servicio con esquinas redondeadas */}
                  <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-100 mb-3.5">
                    <img 
                      src={svc.img} 
                      alt={svc.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-[10px] font-black text-emerald-800 shadow-xs border border-white/60">
                      {svc.badge}
                    </span>
                  </div>

                  {/* Título en formato 01 | Nombre */}
                  <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug mb-1.5 group-hover:text-emerald-700 transition-colors">
                    <span className="text-emerald-700 font-extrabold">{svc.num}</span> | {svc.title}
                  </h3>

                  {/* Descripción Breve del Servicio */}
                  <p className="text-xs text-slate-600 leading-relaxed font-normal line-clamp-3">
                    {svc.desc}
                  </p>
                </div>

                {/* Botón Acción para Agendar este Servicio */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setBookingData((b) => ({ ...b, specialty: svc.title }));
                      setAppointmentModalOpen(true);
                    }}
                    className="text-xs font-bold text-emerald-700 group-hover:text-emerald-800 flex items-center gap-1 transition-colors"
                  >
                    <span>Solicitar cita</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <span className="text-[10px] text-slate-400 font-semibold">
                    Govet Care
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Banner inferior de Urgencias dentro de Servicios */}
          <div className="mt-14 bg-gradient-to-r from-emerald-900 to-teal-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Atención Continua</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-black">
                ¿Tu mascota necesita atención médica hoy mismo?
              </h4>
              <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl">
                Nuestro equipo médico está preparado para recibir consultas de rutina o emergencias con quirófano y laboratorio inmediato.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => setAppointmentModalOpen(true)}
                className="px-6 py-3 rounded-full bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-black uppercase tracking-wider transition-all shadow-md"
              >
                Agendar Consulta
              </button>
              {ct.phone && (
                <a
                  href={`tel:${ct.phone}`}
                  className="px-5 py-3 rounded-full bg-emerald-800/80 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center gap-2 border border-emerald-700/60"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{ct.phone}</span>
                </a>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* 6. PLANES DE SALUD Y PAQUETES PREVENTIVOS (OPCIONAL CON TOGGLE Y DATOS EDITABLES) */}
      {showHealthPlans && (
        <section id="planes" className="py-16 sm:py-24 bg-white border-b border-slate-100">
          <div className="w-full max-w-[1780px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
            
            <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16 space-y-3">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200 inline-block">
                Previsión & Salud Familiar
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                {plansTitle}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                {plansSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-6xl xl:max-w-7xl mx-auto">
              {plansList.map((plan, idx) => (
                <div
                  key={plan.id || idx}
                  className={`flex flex-col justify-between rounded-[32px] p-8 transition-all duration-300 relative ${
                    plan.recommended
                      ? 'bg-gradient-to-b from-emerald-50/70 via-white to-white border-2 border-emerald-600 shadow-xl ring-4 ring-emerald-600/10 -translate-y-2'
                      : 'bg-white border border-slate-200/90 shadow-sm hover:shadow-md'
                  }`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                      ★ RECOMENDADO POR FAMILIAS ★
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {plan.badge || "PLAN"}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">Govet Plans</span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-6 font-medium">
                      {plan.target}
                    </p>

                    <div className="mb-6 pb-6 border-b border-slate-100 flex items-baseline gap-1.5">
                      <span className="text-4xl font-black text-slate-900 tracking-tight">{plan.price}</span>
                      <span className="text-xs text-slate-500 font-medium">{plan.period}</span>
                    </div>

                    <div className="space-y-3 mb-8">
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Incluye coberturas:
                      </div>
                      {plan.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                          <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span className="leading-snug">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setBookingData((b) => ({ ...b, specialty: `Plan de Salud: ${plan.name}` }));
                      setAppointmentModalOpen(true);
                    }}
                    className={`w-full py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 ${
                      plan.recommended
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>Solicitar este Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* 7. TESTIMONIOS Y OPINIONES DE FAMILIAS GOVET */}
      <section id="opiniones" className="py-16 sm:py-24 bg-[#F8FAFC] border-b border-slate-200/80">
        <div className="w-full max-w-[1780px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          
          <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold shadow-2xs">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>4.9 / 5.0 en Google Reviews (500+ Opiniones)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Familias que Confían en Govet
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              La tranquilidad de nuestros clientes y la felicidad de sus compañeros de vida son nuestro mayor orgullo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl xl:max-w-7xl mx-auto">
            {[
              {
                id: 'test-1',
                name: 'Valeria & Bruno (Golden Retriever)',
                role: 'Cirugía de Rodilla y Rehabilitación',
                text: 'Bruno se rompió los ligamentos jugando. El equipo de traumatología de Govet fue impecable desde el primer diagnóstico hasta la fisioterapia. Hoy vuelve a correr feliz y sin ningún dolor.',
                rating: 5,
                date: 'Hace 2 semanas',
              },
              {
                id: 'test-2',
                name: 'Familia Ramírez con Mishi & Simba',
                role: 'Medicina Felina y Ecografía',
                text: 'Tener un área cat-friendly donde los gatos no se estresan con los ladridos hace una diferencia enorme. Los doctores son pacientes, cariñosos y el equipamiento de ecografía es de primer mundo.',
                rating: 5,
                date: 'Hace 1 mes',
              },
              {
                id: 'test-3',
                name: 'Andrés & Toby (Bulldog Francés)',
                role: 'Urgencias 24h y Cuidados Críticos',
                text: 'Toby presentó un cuadro de asfixia en la madrugada. Llegamos a la clínica a las 3:00 am y el quirófano ya estaba listo. Le salvaron la vida. No hay palabras para agradecer su entrega.',
                rating: 5,
                date: 'Hace 3 semanas',
              },
            ].map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex text-amber-400">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{t.date}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                    "{t.text}"
                  </p>
                </div>

                <div className="pt-4 mt-5 border-t border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm grid place-items-center shrink-0">
                    🐾
                  </div>
                  <div>
                    <div className="font-black text-xs text-slate-900">{t.name}</div>
                    <div className="text-[11px] text-emerald-700 font-semibold">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 8. SECCIÓN CONTÁCTENOS (DISEÑO PROFESIONAL MÉDICO GOVET) */}
      <section id="contacto" className="py-20 sm:py-28 bg-gradient-to-b from-white via-slate-50/60 to-white relative overflow-hidden border-t border-slate-100">
        
        {/* Glows decorativos de fondo sutiles */}
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -ml-48" />
        <div className="absolute bottom-10 right-0 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl pointer-events-none -mr-48" />

        <div className="w-full max-w-[1780px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 relative z-10">
          
          {/* Encabezado Principal */}
          <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18 space-y-3.5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black uppercase tracking-wider shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{ct.contact_badge || "Atención Médica & Ubicación"}</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              {ct.contact_title || "Contáctanos y Cómo Llegar al Hospital"}
            </h2>
            
            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
              {ct.contact_subtitle || "Estamos a tu entera disposición las 24 horas del día. Inicia tu ruta con un clic en tu aplicación preferida o comunícate directamente con nuestro equipo médico."}
            </p>
          </div>

          {/* Grid Principal de 2 Grandes Bloques Arquitectónicos */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl xl:max-w-7xl mx-auto">
            
            {/* Tarjeta 1: Navegación GPS & Cómo Llegar (Google Maps + Waze) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-7 sm:p-9 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 grid place-items-center border border-emerald-100 shadow-2xs">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-900 text-xs font-bold border border-emerald-200">
                    {ct.location_badge || (ct.emergency_24h ? "Guardia Activa 24/7" : "Atención Especializada")}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
                    {ct.location_title || "Ubicación e Instalaciones"}
                  </h3>
                  <div className="font-bold text-sm text-emerald-800 mb-1">
                    {clinicName}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {ct.address || "Avenida Principal de Especialidades Médicas, Torre de Salud Animal, Costa Rica."}
                  </p>
                </div>

                {/* Puntos clave de acceso */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{ct.perk_1 || "Aparcamiento gratuito y seguro para clientes"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{ct.perk_2 || "Rampa de ingreso directo para emergencias en camilla"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{ct.perk_3 || "Área de recepción con separación canina y felina"}</span>
                  </div>
                </div>
              </div>

              {/* Botones de Navegación GPS Profesionales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 border-t border-slate-100">
                {/* Botón Google Maps */}
                <a
                  href={ct.google_maps_url || (ct.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ct.address)}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicName)}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 transition-all group shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 grid place-items-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-600" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
                      Google Maps
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      Ver mapa y ruta
                    </div>
                  </div>
                </a>

                {/* Botón Waze */}
                <a
                  href={ct.waze_url || (ct.address ? `https://waze.com/ul?q=${encodeURIComponent(ct.address)}` : `https://waze.com/ul?q=${encodeURIComponent(clinicName)}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-300 transition-all group shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 grid place-items-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-teal-600" fill="currentColor">
                      <path d="M18.5 9.5c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5zm-5 0c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5zm-3.4 5.9c.4.2.9.1 1.1-.3 1.1-1.9 3.1-3.1 5.3-3.1s4.2 1.2 5.3 3.1c.2.4.7.5 1.1.3.4-.2.5-.7.3-1.1-1.3-2.3-3.8-3.8-6.7-3.8s-5.4 1.5-6.7 3.8c-.2.4-.1.9.3 1.1z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black text-slate-900 group-hover:text-teal-800 transition-colors">
                      Navegar en Waze
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      Tráfico en tiempo real
                    </div>
                  </div>
                </a>
              </div>
            </div>

            {/* Tarjeta 2: Vías Rápidas de Comunicación (WhatsApp, Teléfono, Email) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-7 sm:p-9 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 grid place-items-center border border-emerald-100 shadow-2xs">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Horario de Atención</div>
                    <div className="text-xs font-black text-slate-800">{ct.schedule || "Lunes a Domingo • 24/7"}</div>
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Canales de Comunicación Inmediata
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  ¿Tienes una consulta médica, deseas cotizar un procedimiento o requieres asistencia de urgencia? Comunícate directamente por tu canal preferido.
                </p>

                {/* 1. Botón Principal de WhatsApp (Estilo Médico Premium) */}
                <a
                  href={`https://wa.me/${(ct.whatsapp || ct.phone || "50683042817").replace(/\D/g, '')}?text=${encodeURIComponent(ct.whatsapp_message || "Hola, me gustaría comunicarme con la clínica para una consulta médica veterinaria.")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs grid place-items-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-black uppercase tracking-wider text-emerald-100">WhatsApp Oficial</div>
                      <div className="text-sm font-black text-white">Chatear con el Equipo Médico</div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-emerald-100 group-hover:translate-x-1 transition-transform" />
                </a>

                {/* 2. Botón de Llamada Telefónica */}
                {ct.phone && (
                  <a
                    href={`tel:${ct.phone}`}
                    className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 grid place-items-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-[11px] font-bold text-slate-500">Línea Telefónica Directa</div>
                        <div className="text-xs sm:text-sm font-black text-slate-900">{ct.phone}</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Llamar <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </a>
                )}

                {/* 3. Botón de Correo Electrónico */}
                <a
                  href={`mailto:${ct.email || "consulta@govet.com"}?subject=Consulta%20Veterinaria%20Govet`}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 grid place-items-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-bold text-slate-500">Correo Institucional</div>
                      <div className="text-xs sm:text-sm font-black text-slate-900 truncate max-w-[220px] sm:max-w-none">
                        {ct.email || "consulta@govet.com"}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-teal-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Escribir <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </a>

              </div>

              {/* Redes Sociales en paleta médica */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Síguenos en redes:</span>
                <div className="flex items-center gap-2">
                  {ct.social?.facebook && (
                    <a
                      href={ct.social.facebook}
                      target="_blank"
                      rel="noreferrer"
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-emerald-600 text-slate-600 hover:text-white grid place-items-center transition-all shadow-2xs"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                  )}
                  {ct.social?.instagram && (
                    <a
                      href={ct.social.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-emerald-600 text-slate-600 hover:text-white grid place-items-center transition-all shadow-2xs"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {ct.social?.tiktok && (
                    <a
                      href={ct.social.tiktok}
                      target="_blank"
                      rel="noreferrer"
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-emerald-600 text-slate-600 hover:text-white grid place-items-center transition-all shadow-2xs"
                      aria-label="TikTok"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                  {ct.social?.youtube && (
                    <a
                      href={ct.social.youtube}
                      target="_blank"
                      rel="noreferrer"
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-emerald-600 text-slate-600 hover:text-white grid place-items-center transition-all shadow-2xs"
                      aria-label="YouTube"
                    >
                      <Globe className="w-4 h-4 text-red-500" />
                    </a>
                  )}
                  {ct.social?.twitter && (
                    <a
                      href={ct.social.twitter}
                      target="_blank"
                      rel="noreferrer"
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-emerald-600 text-slate-600 hover:text-white grid place-items-center transition-all shadow-2xs"
                      aria-label="X Twitter"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                  {ct.social?.linkedin && (
                    <a
                      href={ct.social.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-emerald-600 text-slate-600 hover:text-white grid place-items-center transition-all shadow-2xs"
                      aria-label="LinkedIn"
                    >
                      <Globe className="w-4 h-4 text-blue-600" />
                    </a>
                  )}
                  {ct.whatsapp && (
                    <a
                      href={`https://wa.me/${ct.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-9 h-9 rounded-xl bg-emerald-100 hover:bg-emerald-600 text-emerald-800 hover:text-white grid place-items-center transition-all shadow-2xs"
                      aria-label="WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 9. MODAL DE CITA DE ESPECIALIDAD */}
      {appointmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs grid place-items-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <GovetLogo size="sm" withTagline={false} />
                <span className="font-bold text-sm text-slate-900">Agendar Cita</span>
              </div>
              <button 
                onClick={() => setAppointmentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 grid place-items-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formSent ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-black text-slate-900 text-lg">¡Solicitud Recibida!</h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  El equipo de especialistas de Govet se comunicará contigo vía WhatsApp o llamada para confirmar tu horario.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Propietario</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Mendoza"
                    value={bookingData.name}
                    onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Mascota</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Bruno"
                      value={bookingData.pet}
                      onChange={(e) => setBookingData({ ...bookingData, pet: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      required
                      placeholder="+34 600..."
                      value={bookingData.phone}
                      onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Especialidad Requerida</label>
                  <select
                    value={bookingData.specialty}
                    onChange={(e) => setBookingData({ ...bookingData, specialty: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none bg-white"
                  >
                    <option value="Cirugía y Quirófano">Cirugía y Quirófano Avanzado</option>
                    <option value="Cardiología y Ecografía">Cardiología & Ultrasonido Doppler</option>
                    <option value="Traumatología y Ortopedia">Traumatología y Ortopedia</option>
                    <option value="Dermatología y Alergias">Dermatología Clínica</option>
                    <option value="Odontología">Odontología y Profilaxis</option>
                    <option value="Consulta General">Consulta General Preventiva</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Fecha Deseada</label>
                    <input
                      type="date"
                      required
                      value={bookingData.date}
                      onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Horario</label>
                    <input
                      type="time"
                      value={bookingData.time}
                      onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md mt-2"
                >
                  Confirmar Solicitud de Cita
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Footer completo de Go2Vet y Clínica */}
      <AppFooter />
    </div>
  );
}
