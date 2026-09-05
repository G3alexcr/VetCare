'use client';

import React, { useState } from 'react';
import { 
  Phone, Mail, MapPin, Clock, Calendar, ChevronDown, ChevronUp, 
  Star, Heart, HelpCircle, User, Check, Send, Award
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

export function VetCatRenderer({ settings, services, clinic, team, testimonials, slides }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [messageSent, setMessageSent] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);

  const activeSlides = (slides && slides.length > 0) ? slides : [
    { id: 'vc1', clinicId: '', title: 'Medicina Preventiva & Gatitos Felices', subtitle: 'Atención respetuosa y sin estrés.', image_url: settings.identity.hero_image_url || settings.identity.cover_image_url || 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80', cta_text: '', cta_link: '', sort_order: 1 },
    { id: 'vc2', clinicId: '', title: 'Especialistas Felinos y Caninos', subtitle: 'Consultorios separados para tranquilidad de tu mascota.', image_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80', cta_text: '', cta_link: '', sort_order: 2 },
    { id: 'vc3', clinicId: '', title: 'Laboratorio y Ecografía en Vivo', subtitle: 'Diagnóstico rápido en minutos.', image_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80', cta_text: '', cta_link: '', sort_order: 3 },
  ];

  const currentSlide = activeSlides[slideIdx % activeSlides.length];
  const isSlider = settings.identity.hero_type === 'slider' || (slides && slides.length > 0);

  const id = settings.identity;
  const ct = settings.contact;
  const clinicName = id.name || clinic?.name || "Clínica Vet Cat";

  const faqs = [
    { q: "¿Con qué frecuencia debo vacunar a mi mascota?", a: "Los cachorros requieren un esquema inicial a las 6, 9 y 12 semanas. En adultos recomendamos un refuerzo anual contra rabia y enfermedades infecciosas comunes." },
    { q: "¿Cómo preparo a mi perro o gato antes de una cirugía o análisis?", a: "Para cirugías programadas y análisis sanguíneos completos se requiere un ayuno de 8 a 12 horas de sólidos. Agua puede mantenerse hasta 2 horas antes según indicación médica." },
    { q: "¿Atienden urgencias los fines de semana?", a: "Sí, nuestro centro permanece abierto y con guardia médica disponible las 24 horas todos los días del año." },
    { q: "¿Qué debo hacer si mi mascota comió algo tóxico?", a: "Comunícate de inmediato a nuestra línea de emergencia. No induzcas el vómito sin indicación veterinaria previa." }
  ];

  const doctors = team.length > 0 ? team : [
    { id: '1', name: 'Dra. Valeria Montes', role: 'Especialista en Medicina Felina & Cirugía', photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80', description: 'Más de 10 años de experiencia en medicina preventiva y manejo cat-friendly sin estrés.' },
    { id: '2', name: 'Dr. Alejandro Serrato', role: 'Cardiología & Diagnóstico por Imagen', photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80', description: 'Especialista en ecografía abdominal avanzada y monitoreo hemodinámico intensivo.' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FCFD] text-slate-800 font-sans antialiased selection:bg-cyan-100 selection:text-cyan-900">
      
      {/* Topbar Acuarela */}
      <div className="bg-white border-b border-cyan-100 px-4 py-2 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            {ct.phone && (
              <a href={`tel:${ct.phone}`} className="flex items-center gap-1.5 font-bold text-cyan-800 hover:underline">
                <Phone className="w-3.5 h-3.5 text-cyan-600" />
                <span>{ct.phone}</span>
              </a>
            )}
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="hidden sm:inline">Abierto todos los días con guardia médica</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>{ct.schedule || "Lun - Dom: 24 Horas"}</span>
          </div>
        </div>
      </div>

      {/* Header Vet Cat */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-cyan-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {clinic?.logo_url ? (
              <img src={clinic.logo_url} alt={clinicName} className="h-10 w-auto object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-cyan-500 text-white font-bold text-xl grid place-items-center shadow-xs">
                🐱
              </div>
            )}
            <div>
              <span className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight block leading-none">
                {clinicName}
              </span>
              <span className="text-[10px] text-cyan-700 font-bold uppercase tracking-widest">
                Clínica & Medicina Preventiva
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-slate-600">
            <a href="#hero" className="text-cyan-700 hover:text-cyan-900 transition-colors">Inicio</a>
            <a href="#servicios" className="hover:text-cyan-700 transition-colors">Servicios</a>
            <a href="#precios" className="hover:text-cyan-700 transition-colors">Precios</a>
            <a href="#doctores" className="hover:text-cyan-700 transition-colors">Especialistas</a>
            <a href="#faqs" className="hover:text-cyan-700 transition-colors">Preguntas</a>
            <a href="#contacto" className="hover:text-cyan-700 transition-colors">Contacto</a>
          </nav>

          <a
            href="#contacto"
            className="px-5 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            Solicitar Cita
          </a>
        </div>
      </header>

      {/* Hero Vet Cat con Fondo Acuarelado y Mascotas */}
      <section id="hero" className="pt-10 pb-16 relative overflow-hidden bg-gradient-to-b from-cyan-50/60 via-amber-50/30 to-[#F8FCFD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-6">
          
          <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-100 text-cyan-900 text-xs font-bold uppercase tracking-wider">
            {id.hero_badge || "🐾 Cuidado con Ternura y Máxima Profesionalidad"}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-3xl mx-auto leading-tight">
            {id.hero_title || "Veterinaria Familiar para los Compañeros de tu Vida"}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            {id.hero_subtitle || id.tagline || id.description || "Amamos a los animales tanto como tú. Tratamos a cada mascota con respeto, paciencia y la mejor tecnología médica."}
          </p>

          <div className="flex justify-center gap-3 pt-2">
            <a
              href="#contacto"
              className="px-7 py-3 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md transition-all"
            >
              {id.cta_primary_text || "Pedir Cita Online"}
            </a>
            <a
              href="#precios"
              className="px-7 py-3 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs shadow-xs transition-all"
            >
              {id.cta_secondary_text || "Ver Precios"}
            </a>
          </div>

          {/* Imagen de Mascotas / Slider de Fotos */}
          <div className="pt-6 max-w-2xl mx-auto relative group">
            <div className="relative w-full h-72 sm:h-96 rounded-[40px] overflow-hidden shadow-xl border-4 border-white mx-auto bg-cyan-100">
              <img 
                src={currentSlide.image_url} 
                alt={currentSlide.title || clinicName}
                className="w-full h-full object-cover transition-all duration-500"
              />
              
              {/* Overlay de Título del Slide */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-transparent p-4 text-white text-center">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  {currentSlide.title}
                </div>
                {currentSlide.subtitle && (
                  <div className="text-[11px] text-slate-200 truncate max-w-md mx-auto mt-0.5">
                    {currentSlide.subtitle}
                  </div>
                )}
              </div>

              {/* Controles del Slider */}
              {isSlider && activeSlides.length > 1 && (
                <>
                  <button 
                    onClick={() => setSlideIdx((i) => (i - 1 + activeSlides.length) % activeSlides.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-800 grid place-items-center shadow-md transition-transform hover:scale-105"
                    aria-label="Anterior"
                  >
                    ‹
                  </button>
                  <button 
                    onClick={() => setSlideIdx((i) => (i + 1) % activeSlides.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-800 grid place-items-center shadow-md transition-transform hover:scale-105"
                    aria-label="Siguiente"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                    {activeSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSlideIdx(idx)}
                        className={`h-1.5 rounded-full transition-all ${idx === slideIdx % activeSlides.length ? 'w-5 bg-cyan-400' : 'w-1.5 bg-white/60'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 3 Badges Clave */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto pt-6">
            <div className="bg-white p-4 rounded-2xl border border-cyan-100 shadow-xs flex items-center justify-center gap-2 text-xs font-bold text-slate-800">
              <span className="text-lg">🔬</span>
              <span>Diagnóstico Clínico Preciso</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-cyan-100 shadow-xs flex items-center justify-center gap-2 text-xs font-bold text-slate-800">
              <span className="text-lg">👨‍⚕️</span>
              <span>Doctores Certificados</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-cyan-100 shadow-xs flex items-center justify-center gap-2 text-xs font-bold text-slate-800">
              <span className="text-lg">❤️</span>
              <span>Atención Sin Estrés</span>
            </div>
          </div>

        </div>
      </section>

      {/* Servicios con Avatares Circulares de Mascotas */}
      <section id="servicios" className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-700">Tratamientos</span>
          <h2 className="text-3xl font-black text-slate-900 mt-1">Nuestros Servicios</h2>
          <p className="text-xs text-slate-500 mt-2">Todo lo que tu mascota necesita para vivir feliz y sana.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: '🐶', title: 'Vacunas', desc: 'Esquema completo anual' },
            { icon: '🐱', title: 'Medicina Felina', desc: 'Cat-Friendly sin estrés' },
            { icon: '🔬', title: 'Laboratorio', desc: 'Resultados en 30 minutos' },
            { icon: '🦷', title: 'Odontología', desc: 'Profilaxis y limpieza' },
            { icon: '🏥', title: 'Cirugías', desc: 'Quirófano monitorizado' },
            { icon: '✨', title: 'Estética & Baño', desc: 'Cuidado dermatológico' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-cyan-100 text-center shadow-xs hover:shadow-md transition-all flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-cyan-50 border border-cyan-100 grid place-items-center text-2xl mb-3 shadow-inner">
                {item.icon}
              </div>
              <h3 className="text-xs font-black text-slate-900 mb-1">{item.title}</h3>
              <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tarjeta Destacada de Precios Transparentes */}
      <section id="precios" className="max-w-4xl mx-auto px-4 sm:px-6 my-12">
        <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-[36px] p-8 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="relative z-10 text-center space-y-4">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider">
              Compromiso de Honestidad
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white">Nuestras Tarifas Claras y Transparentes</h3>
            <p className="text-xs sm:text-sm text-cyan-100 max-w-lg mx-auto">
              Sin sorpresas ni cargos ocultos. Conoce los valores de nuestras consultas y tratamientos básicos antes de iniciar.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/20">
                <div className="text-xs text-cyan-200">Consulta General</div>
                <div className="text-2xl font-black text-white">$25</div>
                <div className="text-[10px] text-cyan-100 mt-1">Revisión clínica completa</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/20">
                <div className="text-xs text-cyan-200">Vacuna Anual + Desparasitación</div>
                <div className="text-2xl font-black text-white">$35</div>
                <div className="text-[10px] text-cyan-100 mt-1">Con certificado oficial</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/20">
                <div className="text-xs text-cyan-200">Limpieza Dental Profilaxis</div>
                <div className="text-2xl font-black text-white">$60</div>
                <div className="text-[10px] text-cyan-100 mt-1">Con ultrasonido seguro</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Especialistas Médicos (Doctores) */}
      <section id="doctores" className="py-16 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-700">Equipo Profesional</span>
          <h2 className="text-3xl font-black text-slate-900 mt-1">Nuestros Especialistas</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {doctors.map((doc) => (
            <div key={doc.id} className="bg-white rounded-3xl p-6 border border-cyan-100 shadow-xs flex items-center gap-5">
              <img 
                src={doc.photo} 
                alt={doc.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-cyan-100 shadow-sm shrink-0"
              />
              <div className="space-y-1.5">
                <h4 className="text-base font-black text-slate-900">{doc.name}</h4>
                <div className="text-xs font-bold text-cyan-700">{doc.role}</div>
                <p className="text-xs text-slate-500 leading-relaxed">{doc.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Acordeón de Preguntas Frecuentes (FAQs) */}
      <section id="faqs" className="py-16 bg-white border-y border-cyan-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-700">Resolviendo Dudas</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Preguntas Frecuentes</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden transition-colors">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-5 py-4 text-left font-bold text-xs sm:text-sm text-slate-900 flex items-center justify-between gap-4 hover:bg-cyan-50/50"
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-cyan-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-cyan-50/20">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulario de Contacto & Footer */}
      <footer id="contacto" className="bg-[#EBF5F8] text-slate-700 pt-16 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-[36px] p-8 sm:p-10 border border-cyan-200 shadow-lg mb-12">
            <div className="text-center max-w-md mx-auto mb-6">
              <h3 className="text-2xl font-black text-slate-900">¿Tienes dudas o deseas una cita?</h3>
              <p className="text-xs text-slate-500 mt-1">Escríbenos y te responderemos a la brevedad.</p>
            </div>

            {messageSent ? (
              <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-2xl text-center text-xs font-bold text-cyan-800">
                ✓ ¡Mensaje recibido con éxito! Nos comunicaremos contigo en minutos.
              </div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); setMessageSent(true); }} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="text" required placeholder="Tu Nombre" className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-cyan-600" />
                <input type="tel" required placeholder="Teléfono / WhatsApp" className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-cyan-600" />
                <button type="submit" className="py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-sm">
                  Enviar Mensaje
                </button>
              </form>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div>© {new Date().getFullYear()} {clinicName}. Atención veterinaria con corazón.</div>
            <div>{ct.address || "Clínica Veterinaria Central"}</div>
          </div>
        </div>
      </footer>

    </div>
  );
}
