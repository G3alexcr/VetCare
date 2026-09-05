'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Phone, Mail, Clock, MapPin, ChevronDown, CheckCircle, ArrowRight, Activity, Calendar, Menu, X, MessageCircle, Star } from 'lucide-react';
import { db } from '@/lib/supabase';

export interface WebsiteSettings { id: string; clinicId: string; is_published: boolean; template_id: string; slug: string; identity: { name: string; tagline: string; description: string; logo_url: string | null; primary_color: string; secondary_color: string; accent_color: string; font_family: string; mision: string; vision: string; historia: string; founded_year: string; certifications: string[]; cover_image_url: string | null; }; contact: { phone: string; phone2: string; whatsapp: string; email: string; address: string; schedule: string; emergency_24h: boolean; maps_embed_url: string; social: { facebook: string; instagram: string; tiktok: string; youtube: string; }; }; seo: { meta_title: string; meta_description: string; og_image: string | null; keywords: string[]; canonical_url: string; }; sections_config: Record<string, { enabled: boolean; order: number }>; faqs: { id: string; question: string; answer: string; sort_order: number; }[]; metrics: { id: string; value: string; label: string; icon: string; }[]; }
export interface WebsiteService { id: string; clinicId: string; title: string; description: string; icon: string; image_url: string | null; price: number | null; price_from: boolean; badge: string; duration: string; sort_order: number; is_active: boolean; }
export interface WebsiteSlide { id: string; clinicId: string; title: string; subtitle: string; image_url: string; cta_text: string; cta_link: string; sort_order: number; }
export interface WebsiteGroupItem { id: string; name: string; role: string; photo: string; description: string; specialties?: string[]; }
export interface WebsiteTestimonial { id: string; author: string; pet_name?: string; role: string; content: string; rating: number; photo_url: string | null; }
export interface WebsiteGalleryItem { id: string; title: string; image_url: string; }
export interface WebsitePost { id: string; title: string; slug: string; summary: string; content: string; cover_image: string | null; published_at: string; }

interface RendererProps {
  settings: WebsiteSettings;
  services: WebsiteService[];
  slides: WebsiteSlide[];
  clinic: { name: string; logo_url: string } | null;
  team: WebsiteGroupItem[];
  testimonials: WebsiteTestimonial[];
  gallery: WebsiteGalleryItem[];
  posts: WebsitePost[];
}

const defaultMetrics = [
  { id: 'm1', value: '1200', label: 'Mascotas', icon: '🐾' },
  { id: 'm2', value: '8', label: 'Años Exp.', icon: '⭐' },
  { id: 'm3', value: '4', label: 'Especialistas', icon: '👨⚕️' },
  { id: 'm4', value: '98', label: 'Satisfacción %', icon: '💚' }
];

const defaultServices: WebsiteService[] = [
  { id: 's1', clinicId: '', title: 'Consulta', description: 'Evaluación de salud', icon: '🩺', image_url: null, price: null, price_from: false, badge: '', duration: '30m', sort_order: 1, is_active: true },
  { id: 's2', clinicId: '', title: 'Vacunas', description: 'Prevención anual', icon: '💉', image_url: null, price: null, price_from: false, badge: 'TOP', duration: '15m', sort_order: 2, is_active: true },
  { id: 's3', clinicId: '', title: 'Cirugía', description: 'Intervenciones', icon: '🔬', image_url: null, price: null, price_from: false, badge: '', duration: 'Var', sort_order: 3, is_active: true },
  { id: 's4', clinicId: '', title: 'Estética', description: 'Baño y corte', icon: '✂️', image_url: null, price: null, price_from: false, badge: '', duration: '2h', sort_order: 4, is_active: true },
];

function AnimatedCounter({ value, duration = 2000 }: { value: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const target = parseInt(value.replace(/\D/g, '')) || 0;
  const suffix = value.replace(/[0-9]/g, '');

  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const end = target;
    const incrementTime = Math.abs(Math.floor(duration / end));
    
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, incrementTime > 0 ? incrementTime : 10);

    return () => clearInterval(timer);
  }, [target, duration]);

  return <>{count}{suffix}</>;
}

export default function BentoVetRenderer({ settings, services, team, testimonials }: RendererProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const isOpen = currentHour >= 8 && currentHour < 20; // Simplified open logic

  const displayMetrics = settings.metrics?.length > 0 ? settings.metrics : defaultMetrics;
  const displayServices = services?.length > 0 ? services : defaultServices;
  const displayTestimonials = testimonials?.length > 0 ? testimonials : [
    { id: 't1', author: 'Ana R.', pet_name: 'Thor', role: 'Cliente', content: 'Excelente tecnología, el diagnóstico fue súper rápido.', rating: 5, photo_url: null },
    { id: 't2', author: 'Luis M.', pet_name: 'Misha', role: 'Cliente', content: 'Las instalaciones parecen del futuro. Muy profesionales.', rating: 5, photo_url: null }
  ];

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      await db.from('website_leads').insert({
        clinic_id: settings.clinicId,
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email') || '',
        message: 'Contacto desde BentoExpress',
        template: settings.template_id
      });
      setSubmitSuccess(true);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0f] font-sans text-gray-200 selection:bg-purple-500/30">
      
      {/* Decorative ambient glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] -z-10 pointer-events-none"></div>
      <div className="fixed bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[128px] -z-10 pointer-events-none"></div>
      <div className="fixed top-1/2 left-1/2 w-64 h-64 bg-blue-600/20 rounded-full blur-[128px] -z-10 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"></div>

      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex-shrink-0">
              {settings.identity.logo_url ? (
                <img src={settings.identity.logo_url} alt={settings.identity.name} className="h-10 w-auto" />
              ) : (
                <span className="text-2xl font-black bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent tracking-tight">
                  {settings.identity.name}
                </span>
              )}
            </div>
            <div className="hidden md:flex space-x-8 items-center">
              <a href="#bento" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Inicio</a>
              <a href="#equipo" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Especialistas</a>
              <a href="#contacto" className="text-sm font-medium px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white">
                Contacto
              </a>
              <a href="#bento" className="text-sm font-bold px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.5)] transition-all">
                Agendar
              </a>
            </div>
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-300">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <section className="text-center mb-20 pt-10">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium backdrop-blur-sm">
            ✨ Tecnología Veterinaria Avanzada
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight">
            Cuidado Animal <br/>
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Reimaginado.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-light">
            {settings.identity.tagline || 'Diagnóstico preciso, trato humano y la mejor tecnología para la salud de tu mascota.'}
          </p>
        </section>

        {/* BENTO GRID */}
        <section id="bento" className="mb-32">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[160px]">
            
            {/* Widget A - Urgencias (Large) */}
            <div className="md:col-span-2 md:row-span-2 rounded-3xl bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 p-8 flex flex-col justify-between group overflow-hidden relative backdrop-blur-sm">
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-500">
                <Activity size={120} className="text-red-500" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-red-400 font-bold uppercase tracking-wider text-sm">Urgencias 24/7</span>
                </div>
                <h3 className="text-2xl text-white font-medium mb-1">Línea Directa</h3>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">
                  {settings.contact.phone}
                </div>
                <a href={`tel:${settings.contact.phone}`} className="inline-flex items-center space-x-2 bg-red-500 text-white px-6 py-3 rounded-full font-bold hover:bg-red-600 transition-colors">
                  <Phone size={18} />
                  <span>Llamar ahora</span>
                </a>
              </div>
            </div>

            {/* Widget B - Express Form */}
            <div className="md:col-span-2 md:row-span-1 rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm flex flex-col justify-center">
              <h3 className="text-white font-bold mb-4 flex items-center"><Calendar className="mr-2 text-purple-400" size={18} /> Cita Express</h3>
              {submitSuccess ? (
                <div className="text-green-400 text-sm font-medium flex items-center"><CheckCircle className="mr-2" size={16}/> Recibido. Te llamaremos pronto.</div>
              ) : (
                <form onSubmit={handleFormSubmit} className="flex space-x-2">
                  <input type="text" name="name" placeholder="Tu nombre" required className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                  <input type="tel" name="phone" placeholder="Teléfono" required className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                  <button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-500 text-white p-2 px-4 rounded-xl transition-colors">
                    <ArrowRight size={18} />
                  </button>
                </form>
              )}
            </div>

            {/* Widget C - Status */}
            <div className="md:col-span-1 md:row-span-1 rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm flex flex-col items-center justify-center text-center">
              <Clock className="text-gray-400 mb-3" size={24} />
              <div className="text-sm text-gray-400 mb-1">Estado actual</div>
              {isOpen ? (
                <div className="text-xl font-bold text-green-400 flex items-center justify-center">ABIERTO <span className="w-2 h-2 rounded-full bg-green-400 ml-2"></span></div>
              ) : (
                <div className="text-xl font-bold text-red-400 flex items-center justify-center">CERRADO <span className="w-2 h-2 rounded-full bg-red-400 ml-2"></span></div>
              )}
            </div>

            {/* Widget D - WhatsApp */}
            <a href={`https://wa.me/${settings.contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="md:col-span-1 md:row-span-1 rounded-3xl bg-[#25D366]/10 border border-[#25D366]/20 p-6 backdrop-blur-sm flex flex-col items-center justify-center text-center hover:bg-[#25D366]/20 transition-colors group">
              <MessageCircle className="text-[#25D366] mb-3 group-hover:scale-110 transition-transform" size={32} />
              <div className="text-white font-bold">WhatsApp</div>
              <div className="text-sm text-[#25D366]">Chat directo</div>
            </a>

            {/* Widget E - Services List */}
            <div className="md:col-span-4 md:row-span-1 rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm overflow-hidden flex flex-col justify-center">
              <div className="flex flex-wrap gap-4 items-center justify-center">
                {displayServices.slice(0, 5).map(service => (
                  <div key={service.id} className="flex items-center space-x-2 bg-black/40 rounded-full pr-4 pl-1 py-1 border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-lg">{service.icon}</div>
                    <span className="text-sm font-medium text-gray-200">{service.title}</span>
                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{service.duration}</span>
                  </div>
                ))}
                {displayServices.length > 5 && (
                  <div className="text-sm text-purple-400 font-medium cursor-pointer hover:text-purple-300">
                    + Ver todos
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* Metrics Glass Cards */}
        <section className="mb-32">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {displayMetrics.map((metric, idx) => (
              <div key={metric.id || idx} className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm text-center hover:bg-white/10 transition-colors">
                <div className="text-3xl mb-4 opacity-80">{metric.icon}</div>
                <div className="text-4xl font-black text-white mb-1">
                  <AnimatedCounter value={metric.value} />
                </div>
                <div className="text-sm text-gray-400 font-medium">{metric.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Team Hexagons */}
        {team && team.length > 0 && (
          <section id="equipo" className="mb-32">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">Nuestros Especialistas</h2>
            <div className="flex flex-wrap justify-center gap-12">
              {team.map(member => (
                <div key={member.id} className="flex flex-col items-center">
                  <div className="relative w-40 h-40 mb-6 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full blur opacity-40 group-hover:opacity-70 transition-opacity"></div>
                    <div 
                      className="relative w-full h-full bg-gray-800 flex items-center justify-center text-4xl font-bold text-gray-500 overflow-hidden border-[3px] border-purple-500/50"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                    >
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        member.name.charAt(0)
                      )}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                  <p className="text-purple-400 text-sm font-medium">{member.role}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Testimonials */}
        <section className="mb-32">
          <div className="grid md:grid-cols-2 gap-8">
            {displayTestimonials.map(t => (
              <div key={t.id} className="bg-white/5 border-l-4 border-purple-500 rounded-r-3xl p-8 backdrop-blur-sm relative">
                <div className="flex mb-4">
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-300 text-lg mb-6 leading-relaxed">"{t.content}"</p>
                <div>
                  <span className="font-bold text-white block">{t.author}</span>
                  {t.pet_name && <span className="text-sm text-purple-400 italic">Mascota: {t.pet_name}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-white/5 bg-black/40 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <div className="mb-4 md:mb-0 flex items-center">
              {settings.identity.logo_url ? (
                 <img src={settings.identity.logo_url} alt="Logo" className="h-6 w-auto grayscale opacity-50 mr-4" />
              ) : (
                <span className="font-bold text-gray-400 mr-4">{settings.identity.name}</span>
              )}
              <span>&copy; {new Date().getFullYear()}</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-gray-300 transition-colors">Privacidad</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Términos</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Contacto</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
