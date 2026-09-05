'use client';

import React, { useState } from 'react';
import { 
  Phone, Mail, MapPin, Clock, ArrowRight, ShieldCheck, 
  Activity, Award, Heart, CheckCircle2, Stethoscope, ChevronRight, Zap
} from 'lucide-react';
import type { 
  WebsiteSettings, WebsiteService, WebsiteSlide, 
  WebsiteGroupItem, WebsiteTestimonial, WebsiteGalleryItem, WebsitePost 
} from '@/lib/website-store';

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

export function PetClinicProRenderer({ settings, services, clinic, team, testimonials }: Props) {
  const [discountModal, setDiscountModal] = useState(false);
  const [discountClaimed, setDiscountClaimed] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');

  const id = settings.identity;
  const ct = settings.contact;
  const clinicName = id.name || clinic?.name || "Pet Clinic Pro";

  const handleClaimDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountClaimed(true);
    setTimeout(() => {
      setDiscountModal(false);
      setDiscountClaimed(false);
    }, 2500);
  };

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const activeSlides = (slides && slides.length > 0) ? slides : [
    { id: 'p1', clinicId: '', title: id.hero_title || 'El Mejor Cuidado Para Tu Mascota', subtitle: id.hero_subtitle || id.description || 'Hospital veterinario médico y quirúrgico de alta especialidad.', image_url: id.hero_image_url || id.cover_image_url || 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1200&q=80', cta_text: 'Obtener Descuento', cta_link: '#', sort_order: 1 },
    { id: 'p2', clinicId: '', title: 'Tecnología Quirúrgica Segura', subtitle: 'Anestesia inhalatoria, monitor multiparamétrico y área de recuperación climatizada.', image_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1200&q=80', cta_text: 'Ver Instalaciones', cta_link: '#tecnologia', sort_order: 2 },
    { id: 'p3', clinicId: '', title: 'Laboratorio de Diagnóstico Rápido', subtitle: 'Analítica de sangre, ecografía y radiología digital en la misma consulta.', image_url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=80', cta_text: 'Servicios Médicos', cta_link: '#servicios', sort_order: 3 },
  ];

  const currentSlide = activeSlides[activeSlideIndex % activeSlides.length];
  const isSliderMode = id.hero_type !== 'single';

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* Header PetClinic Pro */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          
          {/* Logo Estetoscopio y Huella */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 grid place-items-center text-blue-600">
              <Stethoscope className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <span className="font-black text-2xl text-blue-900 tracking-tight block leading-none">
                {clinicName}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600">
                Hospital Médico Quirúrgico
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-600">
            <a href="#hero" className="text-blue-600 hover:text-blue-800 transition-colors">Inicio</a>
            <a href="#servicios" className="hover:text-blue-600 transition-colors">Servicios</a>
            <a href="#tecnologia" className="hover:text-blue-600 transition-colors">Tecnología</a>
            <a href="#contacto" className="hover:text-blue-600 transition-colors">Contacto</a>
          </nav>

          {/* Teléfono de Guardia 24h Destacado */}
          <div className="flex items-center gap-3">
            {ct.phone && (
              <a 
                href={`tel:${ct.phone}`}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-all font-bold text-xs shadow-xs"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white grid place-items-center text-[10px]">
                  24h
                </div>
                <span>{ct.phone}</span>
              </a>
            )}
            <button
              onClick={() => setDiscountModal(true)}
              className="hidden sm:inline-flex px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              10% Dto 1ª Cita
            </button>
          </div>

        </div>
      </header>

      {/* Hero Section PetClinic Pro con Slider Interactivo de la Clínica */}
      <section id="hero" className="relative pt-8 pb-16 lg:py-16 overflow-hidden bg-gradient-to-b from-blue-50/40 via-sky-50/20 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {isSliderMode ? (
            /* HERO MODO SLIDER INTERACTIVO */
            <div className="relative rounded-[36px] overflow-hidden shadow-2xl border-4 border-white bg-blue-950 min-h-[460px] sm:min-h-[500px] flex items-center">
              <img 
                src={currentSlide.image_url} 
                alt={currentSlide.title}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-950/55 to-transparent" />

              <div className="relative z-10 max-w-2xl p-8 sm:p-12 text-white space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/90 text-white text-xs font-bold uppercase tracking-wider">
                  <Activity className="w-3.5 h-3.5" />
                  <span>{id.hero_badge || "Medicina Veterinaria Avanzada"}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                  {currentSlide.title}
                </h1>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-xs uppercase font-bold text-sky-200">PROMO BIENVENIDA</span>
                  <span className="text-2xl font-black text-rose-400">10% DTO</span>
                  <span className="text-xs text-sky-100">en tu 1ª consulta</span>
                </div>

                <p className="text-sm sm:text-base text-blue-100 max-w-lg leading-relaxed font-normal">
                  {currentSlide.subtitle}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-3">
                  <button
                    onClick={() => setDiscountModal(true)}
                    className="px-8 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <span>{currentSlide.cta_text || "Obtener mi Descuento"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {ct.phone && (
                    <a
                      href={`tel:${ct.phone}`}
                      className="px-6 py-3.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>{ct.phone}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Controles de Slider */}
              <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3 bg-blue-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <button
                  onClick={() => setActiveSlideIndex((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1))}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white grid place-items-center text-sm font-bold transition-colors"
                >
                  ‹
                </button>
                <div className="flex items-center gap-1.5">
                  {activeSlides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlideIndex(i)}
                      className={`h-2 rounded-full transition-all ${
                        activeSlideIndex % activeSlides.length === i ? "w-6 bg-rose-500" : "w-2 bg-white/50"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setActiveSlideIndex((prev) => (prev + 1) % activeSlides.length)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white grid place-items-center text-sm font-bold transition-colors"
                >
                  ›
                </button>
              </div>
            </div>
          ) : (
            /* HERO MODO ASIMÉTRICO FIJO */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider">
                  <Activity className="w-3.5 h-3.5 text-blue-700" />
                  <span>{id.hero_badge || "Medicina Veterinaria Avanzada"}</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-blue-950 tracking-tight leading-[1.1]">
                  {id.hero_title || "El Mejor Cuidado Para Tu Mascota"}
                </h1>

                <div className="flex items-baseline gap-3 pt-2">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500">DESCUENTO</span>
                  <span className="text-4xl sm:text-5xl font-black text-rose-600 leading-none">10%</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-700">En tu 1ª Consulta</span>
                </div>

                <p className="text-sm sm:text-base text-slate-600 max-w-lg leading-relaxed font-normal">
                  {id.hero_subtitle || id.description || "Diagnóstico de alta precisión, cirugías con monitoreo anestésico continuo y consultas con especialistas que entienden a tu mascota."}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={() => setDiscountModal(true)}
                    className="px-8 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <span>{id.cta_primary_text || "Obtener mi Descuento"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {ct.phone && (
                    <a
                      href={`tel:${ct.phone}`}
                      className="px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span>{ct.phone}</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5 relative">
                <div className="rounded-[40px] overflow-hidden shadow-2xl border-4 border-white bg-white">
                  <img 
                    src={id.hero_image_url || id.cover_image_url || "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80"} 
                    alt={clinicName}
                    className="w-full h-80 sm:h-[440px] object-cover"
                  />
                </div>

                <div className="absolute -bottom-5 left-6 bg-white p-4 rounded-2xl shadow-xl border border-blue-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 grid place-items-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">Tecnología Médica Segura</div>
                    <div className="text-[10px] text-slate-500">Quirófano esterilizado certificado</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>



      {/* Servicios Médicos en Cuadrícula */}
      <section id="servicios" className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-14">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 grid place-items-center mx-auto mb-2">
            🐾
          </div>
          <h2 className="text-3xl font-black text-blue-950">Servicios que Ofrecemos</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">Medicina preventiva y procedimientos quirúrgicos de excelencia</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(services.length > 0 ? services : [
            { id: '1', title: 'Medicina General & Preventiva', description: 'Revisión periódica de salud, constantes vitales y peso.', icon: '🩺', badge: 'Preventivo', duration: '30 min', price: 30 },
            { id: '2', title: 'Cirugía de Tejidos Blandos', description: 'Quirófano equipado con anestesia inhalatoria y monitoreo.', icon: '🔬', badge: 'Quirúrgico', duration: 'Variable', price: 120 },
            { id: '3', title: 'Vacunación y Microchip', description: 'Esquemas completos anuales y registro legal de identificación.', icon: '💉', badge: 'Esencial', duration: '15 min', price: 28 },
            { id: '4', title: 'Laboratorio de Análisis In Situ', description: 'Hemogramas, química sanguínea y urianálisis en minutos.', icon: '🧪', badge: 'Diagnóstico', duration: '30 min', price: 45 },
            { id: '5', title: 'Odontología y Profilaxis', description: 'Limpieza ultrasónica sin traumatismo y extracción si procede.', icon: '🦷', badge: 'Bucal', duration: '45 min', price: 50 },
            { id: '6', title: 'Hospitalización y Cuidados Críticos', description: 'Boxes individuales con calefacción y oxigenoterapia.', icon: '🏥', badge: '24 Horas', duration: '24/7', price: 80 },
          ]).map((s) => (
            <div 
              key={s.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 grid place-items-center text-2xl mb-4">
                  {s.icon}
                </div>
                <h3 className="font-bold text-base text-blue-950 mb-2">{s.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700">Estimado: ${s.price || 35}</span>
                <button
                  onClick={() => setDiscountModal(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>Agendar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sección Tecnología y Equipamiento */}
      <section id="tecnologia" className="py-16 bg-blue-50/40 border-y border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-700">Instalaciones</span>
              <h2 className="text-3xl font-black text-blue-950">Tecnología Diagnóstica de Vanguardia</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Contamos con equipos de radiología digital, ecografía Doppler y monitores multiparamétricos que permiten obtener diagnósticos fiables en el menor tiempo posible.
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Anestesia inhalatoria segura para pacientes senior</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Resultados de analítica sanguínea en menos de 1 hora</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Área separada para perros y gatos para reducir estrés</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <img 
                src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=500&q=80" 
                alt="Quirófano veterinario" 
                className="rounded-3xl shadow-md h-48 w-full object-cover"
              />
              <img 
                src="https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=500&q=80" 
                alt="Consulta diagnóstica" 
                className="rounded-3xl shadow-md h-48 w-full object-cover"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Footer PetClinic Pro */}
      <footer id="contacto" className="bg-[#0B1E38] text-slate-300 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-white/10 text-xs">
            <div>
              <div className="font-black text-xl text-white tracking-tight mb-2">{clinicName}</div>
              <p className="text-slate-400 leading-relaxed">
                Hospital veterinario de referencia. Dedicados a la salud, confort y longevidad de tu mascota.
              </p>
            </div>
            <div>
              <div className="font-bold text-white uppercase tracking-wider mb-2">Urgencias y Citas</div>
              <div className="text-slate-400 space-y-1">
                <div>Teléfono: {ct.phone || "+34 900 123 456"}</div>
                <div>Horario: {ct.schedule || "Lunes a Domingo 24h"}</div>
                <div>Email: {ct.email || "citas@petclinicpro.com"}</div>
              </div>
            </div>
            <div>
              <div className="font-bold text-white uppercase tracking-wider mb-2">Dirección</div>
              <p className="text-slate-400 leading-relaxed">
                {ct.address || "Avenida Principal de la Salud Animal, Nº 14"}
              </p>
            </div>
          </div>

          <div className="pt-8 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} {clinicName}. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      {/* Modal Reclamar 10% Descuento */}
      {discountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-blue-100 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 grid place-items-center mx-auto mb-3 text-2xl font-black">
              10%
            </div>
            <h3 className="text-2xl font-black text-blue-950 mb-1">Tu Cupón de Bienvenida</h3>
            <p className="text-xs text-slate-600 mb-6">
              Ingresa tu número de WhatsApp para enviarte tu código de 10% de descuento para tu primera visita.
            </p>

            {discountClaimed ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold">
                ✓ ¡Cupón enviado! Preséntalo al llegar a tu consulta.
              </div>
            ) : (
              <form onSubmit={handleClaimDiscount} className="space-y-3">
                <input 
                  type="tel" 
                  required 
                  placeholder="Tu WhatsApp / Teléfono"
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 text-center font-bold"
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Recibir mi Cupón de 10%
                </button>
              </form>
            )}

            <button 
              onClick={() => setDiscountModal(false)}
              className="mt-4 text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
