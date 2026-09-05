'use client';

import React, { useState } from 'react';
import { 
  Phone, Mail, MapPin, Clock, Calendar, AlertCircle, 
  Check, Heart, Home, FileText, Award, ArrowRight, ChevronRight, Shield
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

export function MedicaZooRenderer({ settings, services, clinic, testimonials, slides }: Props) {
  const [urgencyModal, setUrgencyModal] = useState(false);
  const [bookingModal, setBookingModal] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);

  const activeSlides = (slides && slides.length > 0) ? slides : [
    { id: 'm1', clinicId: '', title: 'Medicina Preventiva & Diagnóstico', subtitle: 'Atención compasiva para tu mascota.', image_url: settings.identity.hero_image_url || settings.identity.cover_image_url || 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80', cta_text: '', cta_link: '', sort_order: 1 },
    { id: 'm2', clinicId: '', title: 'Quirófano y Rayos X Digital', subtitle: 'Instalaciones estériles y tecnología de alta precisión.', image_url: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80', cta_text: '', cta_link: '', sort_order: 2 },
    { id: 'm3', clinicId: '', title: 'Cuidados Intensivos 24h', subtitle: 'Monitoreo constante por personal veterinario calificado.', image_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80', cta_text: '', cta_link: '', sort_order: 3 }
  ];

  const currentSlide = activeSlides[slideIdx % activeSlides.length];
  const isSlider = settings.identity.hero_type === 'slider' || (slides && slides.length > 0);

  const id = settings.identity;
  const ct = settings.contact;
  const clinicName = id.name || clinic?.name || "Medica Zoo";

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-teal-100 selection:text-teal-900">
      
      {/* Topbar Médico Clínico */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {ct.phone && (
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                <span>Contacto: {ct.phone}</span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>{ct.schedule || "L-S: 8:00 - 20:00h | Urgencias 24h"}</span>
            </div>
          </div>
          {ct.address && (
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span className="truncate max-w-xs">{ct.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Header Medica Zoo */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {clinic?.logo_url ? (
              <img src={clinic.logo_url} alt={clinicName} className="h-10 w-auto object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-black text-xl grid place-items-center shadow-sm">
                +
              </div>
            )}
            <div>
              <span className="font-extrabold text-2xl tracking-tight text-teal-900 leading-none block">
                {clinicName}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-teal-600">Centro Médico Veterinario</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#hero" className="text-teal-700 hover:text-teal-900 transition-colors">Inicio</a>
            <a href="#servicios" className="hover:text-teal-700 transition-colors">Servicios</a>
            <a href="#por-que-nosotros" className="hover:text-teal-700 transition-colors">¿Por qué nosotros?</a>
            <a href="#contacto" className="hover:text-teal-700 transition-colors">Contacto</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setBookingModal(true)}
              className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              Agendar consulta
            </button>
            <button
              onClick={() => setUrgencyModal(true)}
              className="px-4 py-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Tengo una urgencia</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Medica Zoo con Silueta Curva */}
      <section id="hero" className="pt-8 pb-16 sm:py-20 relative overflow-hidden bg-gradient-to-b from-teal-50/40 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                {id.hero_title || <>Cuidamos a tu mascota como si fuera <span className="text-teal-600 underline decoration-teal-300">nuestra</span></>}
              </h1>
              
              <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-xl">
                {id.hero_subtitle || id.tagline || id.description || "Urgencias 24/7, atención con cariño genuino, medicina preventiva avanzada y todos los servicios de diagnóstico en un solo lugar."}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => setBookingModal(true)}
                  className="px-7 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {id.cta_primary_text || "Agendar consulta"}
                </button>
                <button
                  onClick={() => setUrgencyModal(true)}
                  className="px-7 py-3.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{id.cta_secondary_text || "Tengo una urgencia 24h"}</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative w-full h-80 sm:h-[420px] rounded-[50px] overflow-hidden shadow-2xl border-4 border-white bg-teal-100 group">
                <img 
                  src={currentSlide.image_url} 
                  alt={currentSlide.title || clinicName}
                  className="w-full h-full object-cover transition-all duration-500"
                />
                
                {/* Overlay con Título del Slide */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-5 text-white">
                  <div className="text-xs font-bold uppercase tracking-wider text-teal-300">
                    Instalaciones Médicas
                  </div>
                  <div className="text-sm font-bold truncate">
                    {currentSlide.title}
                  </div>
                </div>

                {/* Controles del Slider */}
                {isSlider && activeSlides.length > 1 && (
                  <>
                    <button 
                      onClick={() => setSlideIdx((i) => (i - 1 + activeSlides.length) % activeSlides.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-800 grid place-items-center shadow-md transition-transform hover:scale-105"
                      aria-label="Anterior"
                    >
                      ‹
                    </button>
                    <button 
                      onClick={() => setSlideIdx((i) => (i + 1) % activeSlides.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-800 grid place-items-center shadow-md transition-transform hover:scale-105"
                      aria-label="Siguiente"
                    >
                      ›
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                      {activeSlides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSlideIdx(idx)}
                          className={`h-1.5 rounded-full transition-all ${idx === slideIdx % activeSlides.length ? 'w-5 bg-teal-400' : 'w-1.5 bg-white/60'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Flujo Orgánico de Servicios con Camino de Huellas */}
      <section id="servicios" className="py-20 max-w-5xl mx-auto px-4 sm:px-6 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Nuestros <span className="text-teal-600">servicios</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">Atención médica humana para tus compañeros peludos</p>
        </div>

        <div className="space-y-16 sm:space-y-24 relative">
          
          {/* Item 1: Servicio Médico */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="w-full h-64 sm:h-72 rounded-[40px] overflow-hidden shadow-lg border-2 border-teal-100">
              <img 
                src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80" 
                alt="Consulta Médica Veterinaria"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-slate-900">Servicio Médico Integral</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Consultas generales y especializadas, vacunación séxtuple, desparasitación interna/externa y diagnóstico de alta precisión.
              </p>
              <button 
                onClick={() => setBookingModal(true)}
                className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
              >
                Agendar consulta
              </button>
            </div>
          </div>

          {/* Dotted Paw Trails Separator */}
          <div className="flex justify-center items-center gap-3 text-teal-400 py-2 opacity-70">
            <span>🐾</span>
            <span className="w-2 h-2 rounded-full bg-teal-300" />
            <span>🐾</span>
            <span className="w-2 h-2 rounded-full bg-teal-300" />
            <span>🐾</span>
          </div>

          {/* Item 2: Grooming */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-3 order-2 md:order-1 text-left sm:text-right">
              <h3 className="text-2xl font-black text-slate-900">Grooming & Estética Spa</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Baño medicado y dermocosmético, corte de raza, profilaxis auricular y corte de uñas sin estrés.
              </p>
              <button 
                onClick={() => setBookingModal(true)}
                className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
              >
                Agendar grooming
              </button>
            </div>
            <div className="w-full h-64 sm:h-72 rounded-[40px] overflow-hidden shadow-lg border-2 border-teal-100 order-1 md:order-2">
              <img 
                src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80" 
                alt="Spa y Grooming para mascotas"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Dotted Paw Trails Separator */}
          <div className="flex justify-center items-center gap-3 text-teal-400 py-2 opacity-70">
            <span>🐾</span>
            <span className="w-2 h-2 rounded-full bg-teal-300" />
            <span>🐾</span>
            <span className="w-2 h-2 rounded-full bg-teal-300" />
            <span>🐾</span>
          </div>

          {/* Item 3: Urgencias 24/7 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="w-full h-64 sm:h-72 rounded-[40px] overflow-hidden shadow-lg border-2 border-teal-100">
              <img 
                src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80" 
                alt="Urgencias Veterinarias 24 Horas"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-slate-900">Urgencias Médicas 24/7</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Atención médica inmediata, triaje rápido, estabilización de pacientes críticos y monitoreo intensivo continuo.
              </p>
              <button 
                onClick={() => setUrgencyModal(true)}
                className="px-5 py-2.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Tengo una urgencia</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ¿Por qué traer a tu mascota con nosotros? (Tarjetas de Garantías) */}
      <section id="por-que-nosotros" className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              ¿Por qué traer a tu mascota con <span className="text-teal-600">nosotros</span>?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 grid place-items-center mb-4">
                <Heart className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">Todos los servicios en un solo lugar</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Laboratorio, quirófano, rayos X, estética y farmacia integral.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 grid place-items-center mb-4">
                <Home className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">Atención médica a domicilio</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Visitas veterinarias sin estrés para mascotas de movilidad reducida.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 grid place-items-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">Seguimiento post-atención</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Recordatorios de dosis, evolución clínica y contacto vía WhatsApp.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 grid place-items-center mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">Veterinarios certificados</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Profesionales con cédula oficial y actualización científica continua.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Banner de Urgencias de Alto Impacto */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 my-16">
        <div className="bg-slate-950 text-white rounded-[40px] p-8 sm:p-12 overflow-hidden relative shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                ¿Listo para cuidar a tu mascota como se merece?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
                Agenda tu cita preventiva hoy o comunícate de inmediato con nuestra línea médica de guardia 24 horas.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button 
                  onClick={() => setBookingModal(true)}
                  className="px-6 py-3 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-md transition-all"
                >
                  Agendar tu cita
                </button>
                <button 
                  onClick={() => setUrgencyModal(true)}
                  className="px-6 py-3 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-black text-xs shadow-md transition-all"
                >
                  Tengo una urgencia
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center">
              <img 
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=400&q=80" 
                alt="Perro y gato felices" 
                className="w-48 h-48 sm:w-56 sm:h-56 rounded-full object-cover border-4 border-teal-500 shadow-xl"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Footer Medica Zoo */}
      <footer id="contacto" className="bg-white border-t border-slate-200 py-12 text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
          <div>
            <span className="font-extrabold text-lg text-slate-900 block">{clinicName}</span>
            <span>© {new Date().getFullYear()} {clinicName}. Todos los derechos reservados.</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Ubicación: {ct.address || "Sede Principal"}</span>
            <span>Teléfono: {ct.phone || "+34 900 123 456"}</span>
          </div>
        </div>
      </footer>

      {/* Modal de Urgencias */}
      {urgencyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-red-100">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 grid place-items-center mx-auto mb-4 text-2xl font-bold">
              🚨
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1">Línea de Urgencias 24/7</h3>
            <p className="text-xs text-slate-600 mb-6">
              Nuestro equipo de guardia está listo para recibirte de inmediato.
            </p>
            {ct.phone && (
              <a 
                href={`tel:${ct.phone}`} 
                className="block w-full py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-md transition-colors mb-3"
              >
                Llamar Ahora: {ct.phone}
              </a>
            )}
            <button 
              onClick={() => setUrgencyModal(false)}
              className="w-full py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Consulta */}
      {bookingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900">Agendar Consulta Médica</h3>
              <button onClick={() => setBookingModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <input type="text" placeholder="Tu Nombre" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600" />
              <input type="text" placeholder="Nombre Mascota" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600" />
              <input type="tel" placeholder="Teléfono" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600" />
              <button 
                onClick={() => setBookingModal(false)}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md mt-2"
              >
                Confirmar Cita
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
