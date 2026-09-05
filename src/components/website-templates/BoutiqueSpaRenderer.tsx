'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/supabase';
import {
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Instagram,
  Youtube,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Star,
  Quote,
  CheckCircle,
} from 'lucide-react';

export interface WebsiteSettings {
  id: string;
  clinicId: string;
  is_published: boolean;
  template_id: string;
  slug: string;
  identity: {
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
  };
  contact: {
    phone: string;
    phone2: string;
    whatsapp: string;
    email: string;
    address: string;
    schedule: string;
    emergency_24h: boolean;
    maps_embed_url: string;
    social: { facebook: string; instagram: string; tiktok: string; youtube: string };
  };
  seo: {
    meta_title: string;
    meta_description: string;
    og_image: string | null;
    keywords: string[];
    canonical_url: string;
  };
  sections_config: Record<string, { enabled: boolean; order: number }>;
  faqs: { id: string; question: string; answer: string; sort_order: number }[];
  metrics: { id: string; value: string; label: string; icon: string }[];
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

export interface WebsitePost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  cover_image: string | null;
  published_at: string;
}

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

const DEFAULT_METRICS = [
  { id: 'm1', value: '1,200+', label: 'Mascotas atendidas', icon: '🐾' },
  { id: 'm2', value: '8+', label: 'Años de experiencia', icon: '⭐' },
  { id: 'm3', value: '4', label: 'Estilistas especializadas', icon: '✂️' },
  { id: 'm4', value: '98%', label: 'Clientes satisfechos', icon: '💛' },
];

const DEFAULT_FAQS = [
  {
    id: 'f1',
    question: '¿Qué incluye el Baño Premium?',
    answer: 'Nuestro servicio de Baño Premium incluye doble baño con shampoo especializado, acondicionador, secado a mano, limpieza de oídos, corte de uñas y un toque de fragancia.',
    sort_order: 1,
  },
  {
    id: 'f2',
    question: '¿Con cuánto tiempo de anticipación debo reservar?',
    answer: 'Recomendamos agendar su cita con al menos 3 días de anticipación para garantizar disponibilidad de horarios, especialmente fines de semana.',
    sort_order: 2,
  },
  {
    id: 'f3',
    question: '¿Puedo quedarme durante la sesión de mi mascota?',
    answer: 'Contamos con una sala de espera con ventanales desde donde podrá observar a su mascota. Sin embargo, no permitimos el ingreso al área de trabajo por seguridad y concentración.',
    sort_order: 3,
  },
  {
    id: 'f4',
    question: '¿Qué productos utilizan?',
    answer: 'Trabajamos exclusivamente con líneas cosméticas de grado profesional, hipoalergénicas y cruelty-free, seleccionadas según el tipo de manto y piel de cada mascota.',
    sort_order: 4,
  },
];

const DEFAULT_SERVICES: WebsiteService[] = [
  {
    id: 's1',
    clinicId: '',
    title: 'Baño & Secado Premium',
    description: 'Tratamiento completo que revitaliza el manto, elimina nudos superficiales y aporta brillo.',
    icon: '✨',
    image_url: null,
    price: 35,
    price_from: true,
    badge: 'PREMIUM',
    duration: '2h',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 's2',
    clinicId: '',
    title: 'Corte de Pelo a Tijera',
    description: 'Corte artesanal personalizado según la raza, estilo de vida y preferencias del propietario.',
    icon: '✂️',
    image_url: null,
    price: 45,
    price_from: true,
    badge: '',
    duration: '1.5-2h',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 's3',
    clinicId: '',
    title: 'Spa Completo',
    description: 'La experiencia definitiva: baño premium, corte de raza, mascarilla hidratante y masaje relajante.',
    icon: '🛁',
    image_url: null,
    price: 75,
    price_from: true,
    badge: 'EXCLUSIVO',
    duration: '3h',
    sort_order: 3,
    is_active: true,
  },
  {
    id: 's4',
    clinicId: '',
    title: 'Limpieza Dental',
    description: 'Cepillado dental profundo con productos enzimáticos para refrescar el aliento y cuidar sus dientes.',
    icon: '🦷',
    image_url: null,
    price: 15,
    price_from: false,
    badge: '',
    duration: '30min',
    sort_order: 4,
    is_active: true,
  },
  {
    id: 's5',
    clinicId: '',
    title: 'Manicure & Pedicure',
    description: 'Corte y limado de uñas cuidadoso, seguido de hidratación de almohadillas plantares.',
    icon: '💅',
    image_url: null,
    price: 20,
    price_from: false,
    badge: '',
    duration: '30min',
    sort_order: 5,
    is_active: true,
  },
  {
    id: 's6',
    clinicId: '',
    title: 'Tratamiento de Pelaje',
    description: 'Mascarilla intensiva reparadora para mantos secos o dañados con aceites esenciales.',
    icon: '🌿',
    image_url: null,
    price: 30,
    price_from: false,
    badge: 'NUEVO',
    duration: '1h',
    sort_order: 6,
    is_active: true,
  },
];

export default function BoutiqueSpaRenderer({
  settings,
  services,
  slides,
  clinic,
  team,
  testimonials,
  gallery,
}: RendererProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  // Form State
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const displayServices = services && services.length > 0 ? services : DEFAULT_SERVICES;
  const displayFaqs = settings.faqs && settings.faqs.length > 0 ? settings.faqs : DEFAULT_FAQS;
  const displayMetrics = settings.metrics && settings.metrics.length > 0 ? settings.metrics : DEFAULT_METRICS;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');
    try {
      const { error } = await db.from('website_leads').insert({
        clinic_id: settings.clinicId,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        message: formData.message,
        template: settings.template_id,
      });
      if (error) throw error;
      setFormStatus('success');
      setFormData({ name: '', phone: '', email: '', message: '' });
      setTimeout(() => setFormStatus('idle'), 3000);
    } catch (err) {
      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 3000);
    }
  };

  const navLinks = [
    { label: 'Servicios', href: '#servicios' },
    { label: 'Nosotros', href: '#nosotros' },
    { label: 'Testimonios', href: '#testimonios' },
    { label: 'Contacto', href: '#contacto' },
  ];

  return (
    <div className="font-sans text-[#3d2b1f] bg-[#fdf8f0] min-h-screen relative selection:bg-[#c9a84c]/30">
      {/* Pattern Background SVG */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='2' fill='%23c9a84c' fill-opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Floating WhatsApp */}
      {settings.contact?.whatsapp && (
        <a
          href={`https://wa.me/${settings.contact.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 animate-pulse"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-[#fdf8f0]/90 backdrop-blur-md border-b border-[#c9a84c]/30 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              {settings.identity?.logo_url ? (
                <img src={settings.identity.logo_url} alt={settings.identity?.name} className="h-14 w-auto" />
              ) : (
                <span className="font-serif text-3xl font-light text-[#3d2b1f] tracking-wide">
                  {settings.identity?.name || clinic?.name || 'Boutique Spa'}
                </span>
              )}
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-10">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-[#c9a84c] hover:text-[#a07a30] transition-colors text-sm uppercase tracking-widest font-medium"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contacto"
                className="inline-flex items-center justify-center px-6 py-2 border border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c] hover:text-white rounded-full transition-all duration-300 text-sm uppercase tracking-widest font-medium"
              >
                Reservar
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-[#c9a84c] hover:text-[#a07a30]"
              >
                {isMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#fdf8f0] border-t border-[#c9a84c]/20 absolute w-full shadow-lg">
            <div className="px-4 pt-2 pb-6 space-y-2 flex flex-col">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-4 text-[#c9a84c] hover:text-[#a07a30] text-sm uppercase tracking-widest text-center border-b border-[#c9a84c]/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content relative for z-index above pattern */}
      <main className="relative z-10">
        
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden min-h-[90vh] flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              
              {/* Text Content */}
              <div className="text-center md:text-left z-10">
                <div className="inline-block mb-4">
                  <div className="h-px w-16 bg-[#c9a84c] mx-auto md:mx-0 mb-4"></div>
                  <span className="text-[#c9a84c] uppercase tracking-[0.3em] text-xs font-semibold">
                    Experiencia Premium
                  </span>
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#3d2b1f] leading-tight mb-6">
                  {settings.identity?.tagline || 'Cuidado excepcional para su mejor amigo'}
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-lg mx-auto md:mx-0 font-light leading-relaxed">
                  {settings.identity?.description || 'Donde el arte del estilismo canino se encuentra con el bienestar y la relajación.'}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <a
                    href="#servicios"
                    className="inline-flex items-center justify-center px-8 py-4 bg-[#c9a84c] text-white rounded-full hover:bg-[#b08f36] transition-all duration-300 uppercase tracking-widest text-sm font-medium shadow-lg shadow-[#c9a84c]/30"
                  >
                    Ver Menú de Spa
                  </a>
                  <a
                    href="#contacto"
                    className="inline-flex items-center justify-center px-8 py-4 border border-[#c9a84c] text-[#c9a84c] rounded-full hover:bg-[#c9a84c]/5 transition-all duration-300 uppercase tracking-widest text-sm font-medium"
                  >
                    Agendar Cita
                  </a>
                </div>
              </div>

              {/* Decorative Circle & Image area */}
              <div className="relative h-[400px] md:h-[600px] w-full flex justify-center items-center">
                {/* Background Gradient Circle */}
                <div className="absolute w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full bg-gradient-to-tr from-[#fce7f3] to-[#fdf8f0] border border-[#c9a84c]/20 shadow-2xl flex items-center justify-center">
                   {slides?.[0]?.image_url ? (
                     <img src={slides[0].image_url} alt="Spa" className="w-full h-full object-cover rounded-full p-2 opacity-90 mix-blend-multiply" />
                   ) : (
                     <div className="text-9xl opacity-40">🐕</div>
                   )}
                </div>
                
                {/* Floating Elements */}
                <div className="absolute top-10 right-10 md:top-20 md:right-20 animate-bounce" style={{ animationDuration: '3s' }}>
                  <Star className="text-[#c9a84c] w-6 h-6" fill="#c9a84c" />
                </div>
                <div className="absolute bottom-20 left-10 md:bottom-32 md:left-20 animate-bounce" style={{ animationDuration: '4s' }}>
                  <Star className="text-[#c9a84c]/60 w-4 h-4" fill="#c9a84c" />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Services - Menú de Spa */}
        <section id="servicios" className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-[#c9a84c] uppercase tracking-[0.2em] text-xs font-semibold mb-2 block">Nuestros Servicios</span>
              <h2 className="text-4xl md:text-5xl font-serif text-[#3d2b1f]">Menú de Spa</h2>
              <div className="h-px w-24 bg-[#c9a84c] mx-auto mt-6"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayServices.map((service) => (
                <div 
                  key={service.id} 
                  className="bg-white border border-[#c9a84c]/30 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:shadow-[#c9a84c]/10 hover:scale-[1.02] transition-all duration-300 relative group"
                >
                  {service.badge && (
                    <div className="absolute top-4 right-4 bg-[#fce7f3] text-[#c9a84c] text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border border-[#c9a84c]/20">
                      {service.badge}
                    </div>
                  )}
                  
                  <div className="text-5xl mb-6 bg-[#fdf8f0] w-20 h-20 rounded-full flex items-center justify-center border border-[#c9a84c]/20 group-hover:bg-[#c9a84c] group-hover:text-white transition-colors duration-300">
                    {service.icon || '🐾'}
                  </div>
                  
                  <h3 className="text-2xl font-serif text-[#3d2b1f] mb-3">{service.title}</h3>
                  <p className="text-gray-500 text-sm font-light mb-6 line-clamp-3 leading-relaxed">
                    {service.description}
                  </p>
                  
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-[#c9a84c]/30 to-transparent mb-6"></div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-[#3d2b1f] font-serif">
                      {service.price ? (
                        <>
                          <span className="text-sm text-gray-400 font-sans mr-1">{service.price_from ? 'Desde' : ''}</span>
                          <span className="text-xl">${service.price}</span>
                        </>
                      ) : (
                        <span className="text-sm uppercase tracking-wider text-[#c9a84c]">Consultar</span>
                      )}
                    </div>
                    {service.duration && (
                      <div className="flex items-center text-xs text-[#c9a84c] border border-[#c9a84c]/30 rounded-full px-3 py-1 bg-[#fdf8f0]">
                        <Clock className="w-3 h-3 mr-1" />
                        {service.duration}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="nosotros" className="py-24 bg-[#fdf8f0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1 flex justify-center">
                {/* Elegant Floral SVG Placeholder */}
                <svg width="300" height="400" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#c9a84c]/20">
                  <path d="M150 400C150 400 130 250 150 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="150" cy="50" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M150 250C100 220 50 200 50 200" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="50" cy="200" r="6" stroke="currentColor" strokeWidth="2"/>
                  <path d="M150 150C200 120 250 100 250 100" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="250" cy="100" r="8" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="order-1 md:order-2">
                <span className="text-[#c9a84c] uppercase tracking-[0.2em] text-xs font-semibold mb-4 block">Nuestra Esencia</span>
                <h2 className="text-4xl md:text-5xl font-serif text-[#3d2b1f] mb-8 leading-tight">
                  Un Santuario para el <span className="italic text-[#c9a84c]">Bienestar</span> de su Mascota
                </h2>
                <div className="prose prose-lg text-gray-600 font-light leading-relaxed">
                  <p className="mb-6">
                    {settings.identity?.historia || 'Fundado con la visión de elevar los estándares del cuidado animal, nuestro espacio ha sido diseñado meticulosamente para ofrecer una experiencia de spa auténtica y libre de estrés.'}
                  </p>
                  <p>
                    {settings.identity?.mision || 'Cada tratamiento, cada producto y cada detalle ha sido seleccionado con un profundo respeto por la naturaleza y la individualidad de su compañero.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="py-16 bg-white border-y border-[#c9a84c]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {displayMetrics.map((metric) => (
                <div key={metric.id} className="text-center p-6 bg-[#fdf8f0] rounded-2xl border border-[#c9a84c]/10">
                  <div className="text-4xl mb-4 opacity-80">{metric.icon}</div>
                  <div className="text-4xl font-bold text-[#c9a84c] mb-2">{metric.value}</div>
                  <div className="font-serif text-[#3d2b1f]">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery Masonry */}
        {gallery && gallery.length > 0 && (
          <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-serif text-[#3d2b1f]">Nuestra Galería</h2>
                <div className="h-px w-24 bg-[#c9a84c] mx-auto mt-6"></div>
              </div>
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                {gallery.map((item) => (
                  <div key={item.id} className="break-inside-avoid relative group rounded-2xl overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-gradient-to-b from-[#fdf8f0] to-[#fce7f3] flex items-center justify-center">
                        <span className="text-6xl opacity-30">✨</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <p className="text-white font-serif text-lg px-4 text-center">{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Team */}
        {team && team.length > 0 && (
          <section className="py-24 bg-[#fdf8f0]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-serif text-[#3d2b1f]">Artistas del Estilismo</h2>
                <div className="h-px w-24 bg-[#c9a84c] mx-auto mt-6"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                {team.map((member) => (
                  <div key={member.id} className="text-center group">
                    <div className="relative inline-block mb-6">
                      <div className="w-40 h-40 rounded-full overflow-hidden ring-4 ring-[#c9a84c] ring-offset-4 ring-offset-[#fdf8f0] mx-auto relative z-10 bg-[#fce7f3]">
                        {member.photo ? (
                          <img src={member.photo} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl text-[#c9a84c] font-serif">
                            {member.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                    <h3 className="text-2xl font-serif text-[#3d2b1f] mb-1">{member.name}</h3>
                    <p className="text-[#c9a84c] text-sm uppercase tracking-widest font-medium mb-3">{member.role}</p>
                    <p className="text-gray-500 text-sm font-light">{member.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Testimonials */}
        {testimonials && testimonials.length > 0 && (
          <section id="testimonios" className="py-24 bg-white relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
              <Quote className="w-20 h-20 text-[#c9a84c]/20 mx-auto mb-8 rotate-180" />
              
              <div className="min-h-[250px] flex flex-col justify-center">
                <p className="text-2xl md:text-3xl font-serif text-[#3d2b1f] italic leading-relaxed mb-10">
                  "{testimonials[testimonialIndex].content}"
                </p>
                <div>
                  <h4 className="font-serif text-xl font-bold text-[#3d2b1f]">
                    {testimonials[testimonialIndex].author}
                  </h4>
                  {testimonials[testimonialIndex].pet_name && (
                    <p className="text-[#c9a84c] italic mt-1">
                      para {testimonials[testimonialIndex].pet_name}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Carousel Dots */}
              <div className="flex justify-center space-x-3 mt-12">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTestimonialIndex(idx)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      idx === testimonialIndex ? 'bg-[#c9a84c] scale-125' : 'bg-[#c9a84c]/30 hover:bg-[#c9a84c]/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQs */}
        <section className="py-24 bg-[#fdf8f0]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif text-[#3d2b1f]">Preguntas Frecuentes</h2>
              <div className="h-px w-16 bg-[#c9a84c] mx-auto mt-6"></div>
            </div>
            <div className="space-y-4">
              {displayFaqs.map((faq) => (
                <div 
                  key={faq.id} 
                  className="bg-white border border-[#c9a84c]/30 rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
                    className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                  >
                    <span className="font-serif text-lg text-[#3d2b1f]">{faq.question}</span>
                    {activeFaq === faq.id ? (
                      <ChevronUp className="w-5 h-5 text-[#c9a84c]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#c9a84c]" />
                    )}
                  </button>
                  <div 
                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                      activeFaq === faq.id ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-gray-600 font-light leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contacto" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16">
              
              {/* Contact Info */}
              <div>
                <span className="text-[#c9a84c] uppercase tracking-[0.2em] text-xs font-semibold mb-4 block">Contacto</span>
                <h2 className="text-4xl font-serif text-[#3d2b1f] mb-10">Visite Nuestro Santuario</h2>
                
                <div className="space-y-8">
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-[#fdf8f0] border border-[#c9a84c]/20 flex items-center justify-center flex-shrink-0 mr-6">
                      <MapPin className="w-5 h-5 text-[#c9a84c]" />
                    </div>
                    <div>
                      <h4 className="font-serif text-lg mb-1 text-[#3d2b1f]">Ubicación</h4>
                      <p className="text-gray-500 font-light">{settings.contact?.address || 'Av. Principal 123, Ciudad'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-[#fdf8f0] border border-[#c9a84c]/20 flex items-center justify-center flex-shrink-0 mr-6">
                      <Phone className="w-5 h-5 text-[#c9a84c]" />
                    </div>
                    <div>
                      <h4 className="font-serif text-lg mb-1 text-[#3d2b1f]">Teléfono</h4>
                      <p className="text-gray-500 font-light">{settings.contact?.phone || '+1 234 567 890'}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-[#fdf8f0] border border-[#c9a84c]/20 flex items-center justify-center flex-shrink-0 mr-6">
                      <Clock className="w-5 h-5 text-[#c9a84c]" />
                    </div>
                    <div>
                      <h4 className="font-serif text-lg mb-1 text-[#3d2b1f]">Horario</h4>
                      <p className="text-gray-500 font-light whitespace-pre-line">
                        {settings.contact?.schedule || 'Lun - Sáb: 9:00 AM - 6:00 PM\nDom: Cerrado'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-[#fdf8f0] p-10 rounded-3xl border border-[#c9a84c]/20">
                <h3 className="font-serif text-2xl text-[#3d2b1f] mb-8">Solicitar una Cita</h3>
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Su nombre"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white border border-[#c9a84c]/30 px-5 py-4 rounded-xl focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] transition-colors placeholder-gray-400 font-light"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <input
                      type="tel"
                      required
                      placeholder="Teléfono"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white border border-[#c9a84c]/30 px-5 py-4 rounded-xl focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] transition-colors placeholder-gray-400 font-light"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Correo electrónico"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white border border-[#c9a84c]/30 px-5 py-4 rounded-xl focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] transition-colors placeholder-gray-400 font-light"
                    />
                  </div>
                  <div>
                    <textarea
                      required
                      rows={4}
                      placeholder="Detalles sobre su mascota y el servicio deseado..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-white border border-[#c9a84c]/30 px-5 py-4 rounded-xl focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] transition-colors placeholder-gray-400 font-light resize-none"
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={formStatus === 'loading' || formStatus === 'success'}
                    className="w-full bg-[#c9a84c] hover:bg-[#b08f36] text-white py-4 rounded-xl transition-colors duration-300 uppercase tracking-widest text-sm font-medium flex justify-center items-center"
                  >
                    {formStatus === 'loading' ? (
                      <span className="animate-pulse">Enviando...</span>
                    ) : formStatus === 'success' ? (
                      <span className="flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> Recibido</span>
                    ) : (
                      'Enviar Solicitud'
                    )}
                  </button>
                  {formStatus === 'error' && (
                    <p className="text-red-500 text-sm text-center">Hubo un error al enviar el mensaje. Intente nuevamente.</p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-[#3d2b1f] relative overflow-hidden pt-20 pb-10">
        {/* Subtle Paw Pattern Overlay */}
        <div 
          className="absolute inset-0 z-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 15c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-8.5 2c-2.48 0-4.5-2.02-4.5-4.5S9.02 8 11.5 8s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5zm17 0c-2.48 0-4.5-2.02-4.5-4.5S26.02 8 28.5 8s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5zm-8.5 5c-6.08 0-11 4.92-11 11h22c0-6.08-4.92-11-11-11z' fill='%23c9a84c'/%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <h3 className="font-serif text-3xl text-[#c9a84c] mb-6">
                {settings.identity?.name || clinic?.name || 'Boutique Spa'}
              </h3>
              <p className="text-[#fdf8f0]/60 font-light max-w-sm leading-relaxed">
                {settings.identity?.tagline || 'Donde el cuidado se convierte en arte. Brindando bienestar y belleza a quienes más amamos.'}
              </p>
            </div>
            
            <div>
              <h4 className="font-serif text-lg text-white mb-6">Enlaces</h4>
              <ul className="space-y-4">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-[#fdf8f0]/60 hover:text-[#c9a84c] transition-colors text-sm uppercase tracking-wider">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-serif text-lg text-white mb-6">Social</h4>
              <div className="flex space-x-4">
                {settings.contact?.social?.facebook && (
                  <a href={settings.contact.social.facebook} className="w-10 h-10 rounded-full border border-[#c9a84c]/30 flex items-center justify-center text-[#c9a84c] hover:bg-[#c9a84c] hover:text-[#3d2b1f] transition-all">
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {settings.contact?.social?.instagram && (
                  <a href={settings.contact.social.instagram} className="w-10 h-10 rounded-full border border-[#c9a84c]/30 flex items-center justify-center text-[#c9a84c] hover:bg-[#c9a84c] hover:text-[#3d2b1f] transition-all">
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {settings.contact?.social?.youtube && (
                  <a href={settings.contact.social.youtube} className="w-10 h-10 rounded-full border border-[#c9a84c]/30 flex items-center justify-center text-[#c9a84c] hover:bg-[#c9a84c] hover:text-[#3d2b1f] transition-all">
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
          
          <div className="border-t border-[#c9a84c]/20 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-[#fdf8f0]/40 text-sm font-light">
              &copy; {new Date().getFullYear()} {settings.identity?.name || clinic?.name || 'Boutique Spa'}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
