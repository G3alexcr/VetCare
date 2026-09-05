'use client';

import React, { useState } from 'react';
import { 
  Phone, Mail, MapPin, Clock, Star, Calendar, ArrowRight, 
  Check, ShieldCheck, Heart, Award, Instagram, Facebook, 
  ChevronRight, MessageCircle, Sparkles, AlertCircle
} from 'lucide-react';
import type { 
  WebsiteSettings, WebsiteService, WebsiteSlide, 
  WebsiteGroupItem, WebsiteTestimonial, WebsiteGalleryItem, WebsitePost 
} from '@/lib/website-store';
import { DEFAULT_PACKAGES } from '@/lib/website-store';

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

export function WelfareEliteRenderer({ settings, services, clinic, team, testimonials, gallery }: Props) {
  const [activePackage, setActivePackage] = useState<string>('pkg-2');
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [bookingData, setBookingData] = useState({ name: '', phone: '', pet: '', service: 'Consulta General', date: '' });

  const id = settings.identity;
  const ct = settings.contact;
  const clinicName = id.name || clinic?.name || "Welfare Veterinary Clinic";
  const primaryColor = id.primary_color || "#0f766e";
  const accentColor = id.accent_color || "#b45309";

  const packages = DEFAULT_PACKAGES;

  const displayServices = services.length > 0 ? services : [
    { id: '1', title: 'Odontología y Limpieza', description: 'Prevención de sarro, profilaxis y salud bucal sin dolor.', icon: '🦷', badge: 'Preventivo', duration: '45 min', price: 45, clinicId: '', sort_order: 1, is_active: true, price_from: false, image_url: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80' },
    { id: '2', title: 'Primera Visita Cachorros', description: 'Evaluación pediátrica integral, peso y vacunas iniciales.', icon: '🐾', badge: 'Esencial', duration: '30 min', price: 35, clinicId: '', sort_order: 2, is_active: true, price_from: false, image_url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80' },
    { id: '3', title: 'Microchip & Certificados', description: 'Identificación oficial internacional y pasaporte de viaje.', icon: '🏷️', badge: 'Legal', duration: '15 min', price: 28, clinicId: '', sort_order: 3, is_active: true, price_from: false, image_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80' },
    { id: '4', title: 'Vacunación Integral', description: 'Protección contra rabia, parvovirus, moquillo y felinas.', icon: '💉', badge: 'Anual', duration: '20 min', price: 30, clinicId: '', sort_order: 4, is_active: true, price_from: false, image_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80' },
    { id: '5', title: 'Control Antiparasitario', description: 'Desparasitación interna y pipetas contra pulgas y garrapatas.', icon: '🛡️', badge: 'Protección', duration: '15 min', price: 22, clinicId: '', sort_order: 5, is_active: true, price_from: false, image_url: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=600&q=80' },
    { id: '6', title: 'Laboratorio y Cardiología', description: 'Monitoreo cardíaco, ecografías y análisis clínico express.', icon: '❤️', badge: 'Especialidad', duration: '60 min', price: 65, clinicId: '', sort_order: 6, is_active: true, price_from: true, image_url: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=600&q=80' },
  ];

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSent(true);
    setTimeout(() => {
      setAppointmentModalOpen(false);
      setFormSent(false);
    }, 2000);
  };

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const activeSlides = (slides && slides.length > 0) ? slides : [
    { id: 'd1', clinicId: '', title: id.hero_title || 'Cuidado Veterinario de Máxima Confianza', subtitle: id.hero_subtitle || id.tagline || 'Médicos veterinarios certificados cuidando a tu familia.', image_url: id.hero_image_url || id.cover_image_url || 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1200&q=80', cta_text: 'Agendar Cita', cta_link: '#contacto', sort_order: 1 },
    { id: 'd2', clinicId: '', title: 'Quirófano e Instalaciones Modernas', subtitle: 'Tecnología médica avanzada, radiología digital y monitorización anestésica.', image_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1200&q=80', cta_text: 'Nuestros Servicios', cta_link: '#servicios', sort_order: 2 },
    { id: 'd3', clinicId: '', title: 'Estética, Baño y Bienestar Integral', subtitle: 'Protocolos respetuosos sin estrés para la comodidad de tu compañero.', image_url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=80', cta_text: 'Ver Paquetes', cta_link: '#paquetes', sort_order: 3 },
  ];

  const currentSlide = activeSlides[activeSlideIndex % activeSlides.length];
  const isSliderMode = id.hero_type !== 'single';

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-800 font-sans antialiased selection:bg-amber-100 selection:text-amber-900">
      
      {/* Topbar de Emergencia */}
      <div className="bg-[#8C4A27] text-amber-50 px-4 py-2 text-xs font-medium tracking-wide">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
            <span>Atención 24/7 para emergencias médicas y cuidados críticos.</span>
          </div>
          <div className="flex items-center gap-4 text-amber-200 text-xs">
            {ct.phone && (
              <a href={`tel:${ct.phone}`} className="hover:text-white flex items-center gap-1 font-semibold transition-colors">
                <Phone className="w-3 h-3" /> {ct.phone}
              </a>
            )}
            <div className="flex items-center gap-2 pl-3 border-l border-amber-600/40">
              <span className="hover:text-white cursor-pointer">ES</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer">EN</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header Navegación Principal */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {clinic?.logo_url ? (
              <img src={clinic.logo_url} alt={clinicName} className="h-11 w-auto object-contain rounded-lg" />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-stone-900 text-amber-400 font-serif font-bold text-xl grid place-items-center shadow-xs">
                {clinicName.charAt(0)}
              </div>
            )}
            <div>
              <span className="font-serif font-bold text-xl sm:text-2xl text-stone-900 tracking-tight block leading-none">
                {clinicName}
              </span>
              <span className="text-[11px] uppercase tracking-widest text-stone-600 font-bold block mt-1">
                Hospital & Centro Veterinario
              </span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-stone-600">
            <a href="#hero" className="text-stone-900 font-semibold hover:text-[#8C4A27] transition-colors">Inicio</a>
            <a href="#nosotros" className="hover:text-[#8C4A27] transition-colors">Nosotros</a>
            <a href="#servicios" className="hover:text-[#8C4A27] transition-colors">Servicios</a>
            <a href="#paquetes" className="hover:text-[#8C4A27] transition-colors">Paquetes de Salud</a>
            <a href="#testimonios" className="hover:text-[#8C4A27] transition-colors">Opiniones</a>
            <a href="#contacto" className="hover:text-[#8C4A27] transition-colors">Contacto</a>
          </nav>

          <div className="flex items-center gap-3">
            {ct.phone && (
              <a 
                href={`tel:${ct.phone}`}
                className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full border border-stone-300 text-xs font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center">
                  <Phone className="w-3 h-3" />
                </div>
                <span>{ct.phone}</span>
              </a>
            )}
            <button
              onClick={() => setAppointmentModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-[#143D43] text-white text-xs sm:text-sm font-semibold tracking-wide hover:bg-[#0c2a2e] transition-all shadow-sm hover:shadow-md flex items-center gap-1.5"
            >
              <span>Agendar cita</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section con Soporte de SLIDER CARRUSEL de la Clínica */}
      <section id="hero" className="relative pt-8 pb-16 lg:py-16 overflow-hidden bg-gradient-to-b from-[#F5EFEB] to-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {isSliderMode ? (
            /* HERO MODO SLIDER INTERACTIVO */
            <div className="relative rounded-[36px] overflow-hidden shadow-2xl border-4 border-white bg-stone-900 min-h-[460px] sm:min-h-[520px] flex items-center">
              {/* Imagen de Fondo del Slide */}
              <img 
                src={currentSlide.image_url} 
                alt={currentSlide.title}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-900/50 to-transparent" />

              {/* Contenido del Slide */}
              <div className="relative z-10 max-w-2xl p-8 sm:p-14 text-white space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/90 text-stone-950 text-xs font-extrabold tracking-wider uppercase shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{id.hero_badge || "Instalaciones & Especialidades"}</span>
                </div>

                <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.12] text-white tracking-tight">
                  {currentSlide.title}
                </h1>

                <p className="text-sm sm:text-lg text-stone-200 leading-relaxed font-normal">
                  {currentSlide.subtitle}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => setAppointmentModalOpen(true)}
                    className="px-7 py-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs sm:text-sm font-black shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{currentSlide.cta_text || "Agendar Consulta"}</span>
                  </button>
                  <a
                    href="#servicios"
                    className="px-6 py-3.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-2"
                  >
                    <span>Ver Servicios</span>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Controles del Slider (Flechas y Puntos) */}
              <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3 bg-stone-950/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
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
                        activeSlideIndex % activeSlides.length === i ? "w-6 bg-amber-400" : "w-2 bg-white/50"
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-bold tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>{id.hero_badge || "Atención Veterinaria de Excelencia"}</span>
                </div>

                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-stone-900 font-normal leading-[1.12] tracking-tight">
                  {id.hero_title || <>Cuidado Veterinario de <span className="font-semibold text-[#8C4A27]">Máxima Confianza</span> para Mascotas</>}
                </h1>

                <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl font-normal">
                  {id.hero_subtitle || id.tagline || id.description || "En nuestra clínica, médicos veterinarios certificados cuidan a tus compañeros de vida con compasión, tecnología diagnóstica de última generación y respeto absoluto."}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => setAppointmentModalOpen(true)}
                    className="px-7 py-3.5 rounded-full bg-[#143D43] hover:bg-[#0c2a2e] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{id.cta_primary_text || "Visitar la clínica"}</span>
                  </button>
                  <a
                    href="#servicios"
                    className="px-7 py-3.5 rounded-full bg-[#8C4A27] hover:bg-[#723b1e] text-white text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                  >
                    <span>{id.cta_secondary_text || "Explorar servicios"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>

                {/* Badges de Confianza */}
                <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-stone-600">
                  <div className="flex items-center gap-2 bg-white/80 px-3.5 py-2 rounded-xl border border-stone-200/80 shadow-xs">
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                      ))}
                    </div>
                    <span className="font-bold text-stone-900">5.0</span>
                    <span className="text-stone-500">• Google Reviews</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-stone-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Médicos con Licencia Médica Oficial</span>
                  </div>
                </div>
              </div>

              {/* Imagen Hero Fija */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white">
                  <img 
                    src={id.hero_image_url || id.cover_image_url || "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=900&q=80"} 
                    alt={clinicName}
                    className="w-full h-[420px] sm:h-[480px] object-cover"
                  />
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-stone-100 shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 grid place-items-center text-amber-700 font-bold">
                        ★
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900">Calificación de Excelencia</div>
                        <div className="text-[11px] text-stone-500">Más de 2,400 familias confían en nosotros</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      VERIFICADO
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Franja de Métricas / Cápsulas Elevadas */}
      <section className="relative -mt-6 z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-200/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-stone-100">
            
            <div className="text-center pt-3 md:pt-0">
              <div className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">10K+</div>
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mt-1">Mascotas Felices</div>
            </div>

            <div className="text-center pt-3 md:pt-0">
              <div className="font-serif text-3xl sm:text-4xl font-bold text-[#8C4A27]">25+</div>
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mt-1">Años de Trayectoria</div>
            </div>

            <div className="text-center pt-3 md:pt-0">
              <div className="font-serif text-3xl sm:text-4xl font-bold text-[#143D43]">30+</div>
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mt-1">Servicios Médicos</div>
            </div>

            <div className="text-center pt-3 md:pt-0">
              <div className="font-serif text-3xl sm:text-4xl font-bold text-emerald-700">8,500+</div>
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mt-1">Familias Atendidas</div>
            </div>

          </div>
        </div>
      </section>

      {/* Servicios Principales en Cuadrícula */}
      <section id="servicios" className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8C4A27] block mb-2">Especialidades Clínicas</span>
          <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal">
            Servicios Veterinarios que Ofrecemos
          </h2>
          <p className="text-stone-600 text-sm mt-3 leading-relaxed">
            Desde medicina preventiva y consultas especializadas hasta cirugías y odontología avanzada con tecnología moderna.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayServices.map((svc) => (
            <div 
              key={svc.id}
              className="bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col"
            >
              <div className="h-48 relative overflow-hidden bg-stone-100">
                <img 
                  src={svc.image_url || "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80"} 
                  alt={svc.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {svc.badge && (
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[#8C4A27] text-[11px] font-bold shadow-xs">
                    {svc.badge}
                  </span>
                )}
                {svc.price && (
                  <span className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-[#143D43] text-white text-xs font-bold shadow-sm">
                    {svc.price_from ? `Desde $${svc.price}` : `$${svc.price}`}
                  </span>
                )}
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{svc.icon}</span>
                    <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-[#8C4A27] transition-colors">
                      {svc.title}
                    </h3>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed font-normal">
                    {svc.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] text-stone-600 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-stone-500" /> {svc.duration || "30 min"}
                  </span>
                  <button 
                    onClick={() => {
                      setBookingData(d => ({ ...d, service: svc.title }));
                      setAppointmentModalOpen(true);
                    }}
                    className="text-xs font-bold text-[#143D43] hover:text-[#8C4A27] flex items-center gap-1 transition-colors"
                  >
                    <span>Reservar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sección Nosotros con Marco Elíptico */}
      <section id="nosotros" className="py-16 bg-[#F5EFEB] border-y border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-5 relative">
              <div className="w-full h-80 sm:h-96 rounded-[40px] overflow-hidden shadow-xl border-4 border-white">
                <img 
                  src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80" 
                  alt="Instalaciones y equipo veterinario"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-2xl shadow-lg border border-stone-100 hidden sm:block">
                <div className="text-xs font-bold text-stone-900">Instalaciones Equipadas</div>
                <div className="text-[11px] text-stone-500">Quirófano, Rayos X y Laboratorio</div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5">
              <span className="text-xs font-bold uppercase tracking-widest text-[#8C4A27]">Nuestra Filosofía</span>
              <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal leading-snug">
                Pasión por la Salud y el Bienestar Animal
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed font-normal">
                {id.mision || "Nuestra misión es brindar una atención médica integral, oportuna y compasiva. Entendemos que cada mascota es un miembro invaluable de tu familia y merece un trato lleno de respeto, paciencia y afecto."}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-stone-200/70">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 grid place-items-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">Enfoque Preventivo</h4>
                    <p className="text-[11px] text-stone-500">Diagnósticos tempranos para alargar la vida de tu mascota.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-stone-200/70">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 grid place-items-center shrink-0">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">Manejo Sin Estrés</h4>
                    <p className="text-[11px] text-stone-500">Protocolos amigables para felinos y perros temerosos.</p>
                  </div>
                </div>
              </div>

              {ct.phone && (
                <div className="pt-2">
                  <a 
                    href={`tel:${ct.phone}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-900 text-amber-200 text-xs font-bold hover:bg-stone-800 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Llamada directa: {ct.phone}</span>
                  </a>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Paquetes de Salud Preventivos (Pricing Cards) */}
      <section id="paquetes" className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8C4A27] block mb-2">Planes Todo Incluido</span>
          <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal">
            Nuestros Paquetes de Salud
          </h2>
          <p className="text-stone-600 text-sm mt-3 leading-relaxed">
            Asegura la salud de tu compañero durante todo el año con paquetes integrales diseñados para cada etapa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {packages.map((pkg) => {
            const isPopular = pkg.popular;
            return (
              <div 
                key={pkg.id}
                className={`rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 relative ${
                  isPopular 
                    ? "bg-white border-2 border-[#143D43] shadow-xl md:-translate-y-2" 
                    : "bg-white border border-stone-200/80 shadow-xs hover:shadow-lg"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#143D43] text-amber-300 text-[10px] font-extrabold uppercase tracking-widest shadow-sm">
                    {pkg.badge || "MÁS POPULAR"}
                  </span>
                )}

                <div>
                  <div className="text-xs font-bold uppercase text-stone-600 tracking-wider mb-1">{pkg.species}</div>
                  <h3 className="font-serif text-2xl font-bold text-stone-900 mb-4">{pkg.name}</h3>

                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="font-serif text-4xl font-bold text-stone-900">{pkg.price}</span>
                    <span className="text-xs text-stone-600 font-medium">/ cuota anual</span>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-stone-100 mb-8">
                    {pkg.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-stone-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setBookingData(d => ({ ...d, service: pkg.name }));
                    setAppointmentModalOpen(true);
                  }}
                  className={`w-full py-3 rounded-full text-xs font-bold tracking-wide transition-all ${
                    isPopular 
                      ? "bg-[#143D43] hover:bg-[#0c2a2e] text-white shadow-sm" 
                      : "bg-stone-100 hover:bg-stone-200 text-stone-900"
                  }`}
                >
                  Contratar este plan
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonio Destacado */}
      <section id="testimonios" className="py-16 bg-[#F5EFEB]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-lg border border-stone-200/80 relative">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <img 
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80" 
                alt="Clienta con su mascota"
                className="w-24 h-24 rounded-2xl object-cover shadow-sm border-2 border-amber-200 shrink-0"
              />
              <div className="space-y-3 text-center sm:text-left">
                <div className="flex justify-center sm:justify-start text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                  ))}
                </div>
                <p className="font-serif italic text-lg sm:text-xl text-stone-800 leading-relaxed">
                  &ldquo;Traje a mi perrita Luna para una cirugía delicada y el trato de todo el equipo fue impecable. Nos mantuvieron informados minuto a minuto y la recuperación fue increíblemente rápida. No confiaría a mis mascotas a nadie más.&rdquo;
                </p>
                <div className="pt-1">
                  <div className="font-bold text-sm text-stone-900">Mariana Silva</div>
                  <div className="text-xs text-stone-500">Mamá de Luna (Golden Retriever, 4 años)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Galería Social Cuadrada */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8C4A27]">Comunidad</span>
            <h3 className="font-serif text-2xl font-bold text-stone-900">#Familias{clinicName.replace(/\s+/g, '')}</h3>
          </div>
          <a href="#contacto" className="text-xs font-bold text-[#143D43] hover:underline flex items-center gap-1">
            <span>Síguenos en redes</span>
            <Instagram className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=400&q=80",
          ].map((url, i) => (
            <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-xs hover:opacity-95 transition-opacity">
              <img src={url} alt="Mascota en consulta" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* Footer Navy Institucional */}
      <footer id="contacto" className="bg-[#102A2E] text-stone-300 pt-16 pb-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
            
            <div className="space-y-4">
              <div className="font-serif text-2xl font-bold text-white">{clinicName}</div>
              <p className="text-xs text-stone-400 leading-relaxed">
                Hospital veterinario dedicado a la salud, prevención y tratamiento compasivo de animales de compañía.
              </p>
              {ct.emergency_24h && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/70 border border-rose-700/50 text-rose-300 text-xs font-bold">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Servicio de Urgencias 24 Horas</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Contacto Directo</h4>
              <ul className="space-y-2 text-xs">
                {ct.phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{ct.phone}</span>
                  </li>
                )}
                {ct.whatsapp && (
                  <li className="flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <a href={`https://wa.me/${ct.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="hover:text-white">
                      WhatsApp: {ct.whatsapp}
                    </a>
                  </li>
                )}
                {ct.email && (
                  <li className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>{ct.email}</span>
                  </li>
                )}
                {ct.address && (
                  <li className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span>{ct.address}</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Horarios de Atención</h4>
              <div className="text-xs space-y-1.5 text-stone-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>{ct.schedule || "Lunes a Sábado: 8:00 AM - 8:00 PM"}</span>
                </div>
                <div>Domingos: 9:00 AM - 4:00 PM</div>
                <div className="text-amber-300 font-semibold pt-1">Guardia de urgencia médica 24/7</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Cita Rápida</h4>
              <p className="text-xs text-stone-400">
                Reserva tu consulta médica o servicio de estética en segundos.
              </p>
              <button
                onClick={() => setAppointmentModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Agendar Cita en Línea
              </button>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
            <div>© {new Date().getFullYear()} {clinicName}. Todos los derechos reservados.</div>
            <div className="flex items-center gap-4">
              <span>Aviso de Privacidad</span>
              <span>•</span>
              <span>Términos del Servicio</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal de Agendamiento de Cita */}
      {appointmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl font-bold text-stone-900">Agendar Cita Veterinaria</h3>
              <button 
                onClick={() => setAppointmentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 grid place-items-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formSent ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center mx-auto text-xl">
                  ✓
                </div>
                <h4 className="font-bold text-stone-900">¡Solicitud Enviada!</h4>
                <p className="text-xs text-stone-600">Nos pondremos en contacto contigo en breve para confirmar el horario.</p>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Nombre del Propietario</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej. Carlos Mendoza"
                    value={bookingData.name}
                    onChange={e => setBookingData({ ...bookingData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[#143D43]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Nombre Mascota</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej. Toby"
                      value={bookingData.pet}
                      onChange={e => setBookingData({ ...bookingData, pet: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[#143D43]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Teléfono / WhatsApp</label>
                    <input 
                      type="tel" 
                      required 
                      placeholder="+34 600 000 000"
                      value={bookingData.phone}
                      onChange={e => setBookingData({ ...bookingData, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[#143D43]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Servicio de Interés</label>
                  <input 
                    type="text" 
                    value={bookingData.service}
                    onChange={e => setBookingData({ ...bookingData, service: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[#143D43]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Fecha Deseada</label>
                  <input 
                    type="date" 
                    required 
                    value={bookingData.date}
                    onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[#143D43]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#143D43] hover:bg-[#0c2a2e] text-white font-bold text-xs shadow-md transition-colors"
                >
                  Confirmar Solicitud de Cita
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
