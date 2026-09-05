'use client';

import React, { useState } from 'react';
import { 
  Calendar, Clock, Phone, Mail, MapPin, ArrowRight, 
  Check, Star, ShieldCheck, Heart, Sparkles, ChevronDown, 
  ChevronRight, Scissors, Stethoscope, Home, CheckCircle2
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

export function SmartVetRenderer({ settings, services, clinic, team, testimonials, slides }: Props) {
  const id = settings.identity;
  const ct = settings.contact;
  const clinicName = id.name || clinic?.name || "SmartVet";

  const [slideIdx, setSlideIdx] = useState(0);
  const activeSlides = (slides && slides.length > 0) ? slides : [
    { id: 'sv1', clinicId: '', title: 'Tecnología y Diagnóstico Veterinario', subtitle: '', image_url: id.hero_image_url || id.cover_image_url || "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80", cta_text: '', cta_link: '', sort_order: 1 },
    { id: 'sv2', clinicId: '', title: 'Quirófano Esterilizado', subtitle: '', image_url: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80", cta_text: '', cta_link: '', sort_order: 2 },
    { id: 'sv3', clinicId: '', title: 'Ecografía y Rayos X Digital', subtitle: '', image_url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80", cta_text: '', cta_link: '', sort_order: 3 },
  ];
  const currentSlide = activeSlides[slideIdx % activeSlides.length];
  const isSlider = id.hero_type === 'slider' || (slides && slides.length > 0);

  // Formulario interactivo en el Hero
  const [booking, setBooking] = useState({
    owner: '',
    pet: '',
    breed: '',
    service: 'Consulta General',
    phone: '',
    date: '2026-09-10',
    time: '10:30'
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleHeroBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 4000);
  };

  const partnerBrands = [
    { name: 'Royal Canin', logo: '🐾 Royal Canin' },
    { name: 'Purina Pro Plan', logo: '🛡️ Purina' },
    { name: 'Acana Pet Food', logo: '🌾 Acana' },
    { name: 'Simparica Trio', logo: '💊 Simparica' },
    { name: 'Brit Care', logo: '❤️ Brit Care' },
    { name: 'Josera Pet', logo: '⭐ Josera' },
  ];

  return (
    <div className="min-h-screen bg-[#F3E8FF]/60 text-slate-900 font-sans antialiased selection:bg-purple-200 selection:text-purple-950">
      
      {/* Header Estilo SmartVet */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-purple-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button className="px-3.5 py-1.5 rounded-full border border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-100 transition-colors">
              Menú
            </button>
            <div className="flex items-center gap-2">
              {clinic?.logo_url ? (
                <img src={clinic.logo_url} alt={clinicName} className="h-8 w-auto object-contain" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-purple-700 text-white font-black text-base grid place-items-center">
                  V
                </div>
              )}
              <span className="font-black text-xl sm:text-2xl tracking-tighter text-slate-950 uppercase">
                {clinicName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {ct.phone && (
              <a 
                href={`tel:${ct.phone}`} 
                className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-purple-700 transition-colors px-3 py-1.5 rounded-full border border-slate-200"
              >
                <Phone className="w-3.5 h-3.5 text-purple-600" />
                <span>{ct.phone}</span>
              </a>
            )}
            <a
              href="#booking-hero"
              className="px-5 py-2.5 rounded-full bg-slate-950 hover:bg-purple-900 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
            >
              Agendar Cita
            </a>
          </div>

        </div>
      </header>

      {/* Hero Section SmartVet: Split con Motor de Reserva y Mascota */}
      <section id="booking-hero" className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Columna Izquierda: Título + Booking Form */}
          <div className="lg:col-span-7 bg-white/90 backdrop-blur-sm rounded-[36px] p-6 sm:p-10 border border-purple-100 shadow-xl flex flex-col justify-between relative overflow-hidden">
            
            {/* Sticker Retro Amarillo Estelar */}
            <div className="absolute top-6 right-6 sm:right-8 rotate-12 bg-amber-300 text-amber-950 font-black text-[10px] sm:text-xs uppercase px-3 py-2 rounded-full shadow-md border-2 border-amber-400 animate-bounce">
              {id.hero_badge || "★ CLÍNICA #1 2026 ★"}
            </div>

            <div className="space-y-4 mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-[1.1] max-w-xl">
                {id.hero_title || "CENTRO INTEGRAL DE SALUD PARA TU MASCOTA"}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-medium max-w-lg leading-relaxed">
                {id.hero_subtitle || id.tagline || id.description || "Desde medicina diagnóstica preventiva hasta estética y guardería. Todo lo que tu mascota necesita en un solo lugar de absoluta confianza."}
              </p>
            </div>

            {/* Motor de Reserva Rápida Directo en el Hero */}
            <div className="bg-purple-50/70 p-5 sm:p-6 rounded-3xl border border-purple-100">
              <div className="text-xs font-black uppercase tracking-wider text-purple-900 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Reserva Rápida Inmediata</span>
              </div>

              {bookingSuccess ? (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <div className="font-bold text-sm text-emerald-900">¡Cita solicitada exitosamente!</div>
                  <div className="text-xs text-emerald-700">Te enviaremos la confirmación por WhatsApp en pocos minutos.</div>
                </div>
              ) : (
                <form onSubmit={handleHeroBooking} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input 
                      type="text" 
                      required
                      placeholder="Tu Nombre" 
                      value={booking.owner}
                      onChange={e => setBooking({ ...booking, owner: e.target.value })}
                      className="px-3.5 py-2.5 rounded-full bg-white border border-purple-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600 shadow-xs"
                    />
                    <input 
                      type="text" 
                      required
                      placeholder="Nombre Mascota" 
                      value={booking.pet}
                      onChange={e => setBooking({ ...booking, pet: e.target.value })}
                      className="px-3.5 py-2.5 rounded-full bg-white border border-purple-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600 shadow-xs"
                    />
                    <input 
                      type="text" 
                      placeholder="Especie / Raza" 
                      value={booking.breed}
                      onChange={e => setBooking({ ...booking, breed: e.target.value })}
                      className="px-3.5 py-2.5 rounded-full bg-white border border-purple-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600 shadow-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <select 
                      value={booking.service}
                      onChange={e => setBooking({ ...booking, service: e.target.value })}
                      className="px-3.5 py-2.5 rounded-full bg-white border border-purple-200 text-xs text-slate-900 focus:outline-none focus:border-purple-600 shadow-xs"
                    >
                      <option value="Consulta General">Consulta Médica</option>
                      <option value="Vacunación">Vacunación Anual</option>
                      <option value="Grooming & Baño">Estética & Baño</option>
                      <option value="Desparasitación">Desparasitación</option>
                      <option value="Urgencia Médica">Urgencia 24/7</option>
                    </select>

                    <input 
                      type="tel" 
                      required
                      placeholder="Teléfono / WhatsApp" 
                      value={booking.phone}
                      onChange={e => setBooking({ ...booking, phone: e.target.value })}
                      className="px-3.5 py-2.5 rounded-full bg-white border border-purple-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600 shadow-xs"
                    />

                    <input 
                      type="date" 
                      required
                      value={booking.date}
                      onChange={e => setBooking({ ...booking, date: e.target.value })}
                      className="px-3.5 py-2.5 rounded-full bg-white border border-purple-200 text-xs text-slate-900 focus:outline-none focus:border-purple-600 shadow-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-full bg-slate-950 hover:bg-purple-900 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Confirmar Cita Médica</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* Columna Derecha: Foto Mascota / Slider con Micro-tarjetas Glassmorphism */}
          <div className="lg:col-span-5 relative rounded-[36px] overflow-hidden min-h-[440px] bg-gradient-to-br from-purple-100 to-teal-100 shadow-xl border border-white group">
            <img 
              src={currentSlide.image_url} 
              alt={currentSlide.title || "Mascota en la clínica"}
              className="w-full h-full object-cover transition-all duration-500"
            />

            {/* Slider Controls */}
            {isSlider && activeSlides.length > 1 && (
              <>
                <button 
                  onClick={() => setSlideIdx((i) => (i - 1 + activeSlides.length) % activeSlides.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-800 grid place-items-center shadow-md transition-transform hover:scale-105 z-10"
                  aria-label="Anterior"
                >
                  ‹
                </button>
                <button 
                  onClick={() => setSlideIdx((i) => (i + 1) % activeSlides.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-800 grid place-items-center shadow-md transition-transform hover:scale-105 z-10"
                  aria-label="Siguiente"
                >
                  ›
                </button>
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full">
                  {activeSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSlideIdx(idx)}
                      className={`h-1.5 rounded-full transition-all ${idx === slideIdx % activeSlides.length ? 'w-4 bg-purple-400' : 'w-1.5 bg-white/60'}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Micro-promoción 1 Glassmorphism (-20%) */}
            <div className="absolute bottom-6 left-6 bg-white/85 backdrop-blur-md p-4 rounded-3xl border border-white/60 shadow-lg max-w-[200px]">
              <div className="text-2xl sm:text-3xl font-black text-purple-900 leading-none">-20%</div>
              <div className="text-[11px] font-bold text-slate-700 mt-1 leading-tight">
                en chequeo integral de primera visita y análisis rápido.
              </div>
            </div>

            {/* Micro-promoción 2 Glassmorphism (Esterilización de cortesía) */}
            <div className="absolute bottom-6 right-6 bg-white/85 backdrop-blur-md p-4 rounded-3xl border border-white/60 shadow-lg max-w-[200px] hidden sm:block">
              <div className="text-xs font-black text-emerald-800 uppercase tracking-wide">Plan Adopción</div>
              <div className="text-[11px] font-bold text-slate-700 mt-1 leading-tight">
                Vacuna inicial sin costo para mascotas rescatadas.
              </div>
            </div>

          </div>

        </div>

        {/* 3 Tarjetas Rápidas de Servicios (Píldoras) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-3xl p-4 border border-purple-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <img 
              src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=200&q=80" 
              alt="Diagnóstico"
              className="w-16 h-16 rounded-2xl object-cover"
            />
            <div>
              <div className="text-sm font-black text-slate-900">Salud & Diagnóstico</div>
              <div className="text-xs text-slate-500">Laboratorio y vacunas</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-purple-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <img 
              src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=200&q=80" 
              alt="Hotel canino"
              className="w-16 h-16 rounded-2xl object-cover"
            />
            <div>
              <div className="text-sm font-black text-slate-900">Guardería & Hotel</div>
              <div className="text-xs text-slate-500">Hospedaje vigilado 24h</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-purple-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <img 
              src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=200&q=80" 
              alt="Grooming"
              className="w-16 h-16 rounded-2xl object-cover"
            />
            <div>
              <div className="text-sm font-black text-slate-900">Peluquería & Spa</div>
              <div className="text-xs text-slate-500">Baño y corte profesional</div>
            </div>
          </div>
        </div>

        {/* Cinta de Marcas de Confianza */}
        <div className="mt-12 pt-8 border-t border-purple-200/80">
          <div className="text-center text-xs font-black uppercase tracking-widest text-purple-900/60 mb-6">
            Trabajamos con las mejores marcas veterinarias certificadas
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-80">
            {partnerBrands.map((b, i) => (
              <span key={i} className="text-sm sm:text-base font-black tracking-wider text-slate-600 hover:text-purple-900 transition-colors">
                {b.logo}
              </span>
            ))}
          </div>
        </div>

      </section>

      {/* Servicios Completos con Precios y Duración */}
      <section className="py-16 bg-white border-y border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-black text-purple-700 uppercase tracking-widest">Nuestra Atención</span>
            <h2 className="text-3xl font-black text-slate-950 mt-1">Servicios Veterinarios</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">Cuidado completo, rápido y con la máxima calidez.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(services.length > 0 ? services : [
              { id: '1', title: 'Medicina General', description: 'Revisión preventiva, diagnóstico y control de peso.', icon: '🩺', badge: 'Habitual', duration: '30 min', price: 30 },
              { id: '2', title: 'Vacunas y Desparasitación', description: 'Protección completa para cachorros y adultos.', icon: '💉', badge: 'Preventivo', duration: '15 min', price: 25 },
              { id: '3', title: 'Spa & Peluquería Canina', description: 'Baño medicado, corte higiénico y corte de uñas.', icon: '✂️', badge: 'Estética', duration: '60 min', price: 40 },
              { id: '4', title: 'Urgencias y Cirugía', description: 'Atención médica prioritaria 24/7 y monitorización.', icon: '🏥', badge: '24/7', duration: 'Inmediato', price: 60 },
            ]).map((s) => (
              <div key={s.id} className="bg-purple-50/50 rounded-3xl p-6 border border-purple-100 hover:border-purple-300 transition-all hover:shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">{s.icon}</span>
                    {s.badge && (
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-200 text-purple-900 text-[10px] font-black uppercase">
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-base text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-purple-100 flex items-center justify-between">
                  <span className="font-black text-base text-purple-950">${s.price || 35}</span>
                  <span className="text-[11px] font-semibold text-slate-500">{s.duration || "30 min"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer SmartVet */}
      <footer className="bg-slate-950 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="font-black text-xl text-white tracking-tight uppercase">{clinicName}</div>
            <div className="text-xs text-slate-400 mt-1">Cuidado moderno y ágil para mascotas.</div>
          </div>
          <div className="text-xs text-slate-400 text-center sm:text-right">
            <div>{ct.address || "Atención presencial en clínica central"}</div>
            <div className="text-purple-400 font-bold mt-1">Llámanos: {ct.phone || "+34 900 123 456"}</div>
          </div>
        </div>
      </footer>

    </div>
  );
}
