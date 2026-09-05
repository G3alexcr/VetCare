'use client';

import React, { useState } from 'react';
import { Phone, Mail, Clock, MapPin, ChevronDown, CheckCircle, Shield, Menu, X, MessageCircle, Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
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
  { id: 'm1', value: '1,200+', label: 'Mascotas atendidas', icon: '🐾' },
  { id: 'm2', value: '8+', label: 'Años de experiencia', icon: '⭐' },
  { id: 'm3', value: '4', label: 'Veterinarios especializados', icon: '👨⚕️' },
  { id: 'm4', value: '98%', label: 'Clientes satisfechos', icon: '💚' }
];

const defaultFaqs = [
  { id: 'f1', question: '¿Qué hacer en caso de emergencia?', answer: 'Llámenos inmediatamente a nuestro número de urgencias. Estamos disponibles 24/7 para atender casos críticos.', sort_order: 1 },
  { id: 'f2', question: '¿Cuándo debo vacunar a mi cachorro?', answer: 'Las vacunas comienzan generalmente a las 6-8 semanas de edad. Recomendamos agendar una consulta para crear un plan de vacunación personalizado.', sort_order: 2 },
  { id: 'f3', question: '¿Ofrecen servicio de estética?', answer: 'Sí, contamos con servicio completo de baño y corte para perros y gatos de todas las razas.', sort_order: 3 },
  { id: 'f4', question: '¿Cómo puedo agendar una cita?', answer: 'Puede agendar llamando a nuestros teléfonos, enviando un WhatsApp o llenando el formulario en esta página.', sort_order: 4 }
];

const defaultServices: WebsiteService[] = [
  { id: 's1', clinicId: '', title: 'Consulta General', description: 'Evaluación completa de la salud de su mascota.', icon: '🩺', image_url: null, price: null, price_from: false, badge: '', duration: '30min', sort_order: 1, is_active: true },
  { id: 's2', clinicId: '', title: 'Vacunación', description: 'Aplicación de vacunas y refuerzos anuales.', icon: '💉', image_url: null, price: null, price_from: false, badge: 'ESENCIAL', duration: '15min', sort_order: 2, is_active: true },
  { id: 's3', clinicId: '', title: 'Cirugía', description: 'Procedimientos quirúrgicos con la mejor tecnología.', icon: '🔬', image_url: null, price: null, price_from: false, badge: '', duration: 'Variable', sort_order: 3, is_active: true },
  { id: 's4', clinicId: '', title: 'Estética', description: 'Baño, corte y cuidado del pelaje.', icon: '✂️', image_url: null, price: null, price_from: false, badge: 'MÁS POPULAR', duration: '1-2h', sort_order: 4, is_active: true },
  { id: 's5', clinicId: '', title: 'Odontología', description: 'Limpieza dental y tratamientos periodontales.', icon: '🦷', image_url: null, price: null, price_from: false, badge: '', duration: '45min', sort_order: 5, is_active: true },
  { id: 's6', clinicId: '', title: 'Hospitalización', description: 'Cuidados intensivos y monitoreo constante.', icon: '🏥', image_url: null, price: null, price_from: false, badge: 'URGENCIAS', duration: '24/7', sort_order: 6, is_active: true },
];

export default function VeterinaryMedicalRenderer({ settings, services, team, testimonials }: RendererProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const displayMetrics = settings.metrics?.length > 0 ? settings.metrics : defaultMetrics;
  const displayFaqs = settings.faqs?.length > 0 ? settings.faqs : defaultFaqs;
  const displayServices = services?.length > 0 ? services : defaultServices;
  const displayTestimonials = testimonials?.length > 0 ? testimonials : [
    { id: 't1', author: 'María García', pet_name: 'Luna', role: 'Cliente', content: 'Excelente servicio, muy profesionales y amables con mi perrita. Los recomiendo al 100%.', rating: 5, photo_url: null },
    { id: 't2', author: 'Carlos Pérez', pet_name: 'Max', role: 'Cliente', content: 'Salvaron la vida de mi gato. Estaré eternamente agradecido con todo el equipo médico.', rating: 5, photo_url: null }
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
        email: formData.get('email'),
        message: formData.get('message'),
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

  const nextTestimonial = () => setCurrentTestimonialIndex((prev) => (prev + 1) % displayTestimonials.length);
  const prevTestimonial = () => setCurrentTestimonialIndex((prev) => (prev - 1 + displayTestimonials.length) % displayTestimonials.length);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Top bar */}
      <div className="bg-[#1e3a5f] text-white py-2 px-4 text-sm hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex space-x-6">
            <div className="flex items-center space-x-2">
              <Phone size={14} className="text-[#c9a93c]" />
              <span>{settings.contact.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail size={14} className="text-[#c9a93c]" />
              <span>{settings.contact.email}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Clock size={14} className="text-[#c9a93c]" />
            <span>{settings.contact.schedule}</span>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex-shrink-0 flex items-center">
              {settings.identity.logo_url ? (
                <img src={settings.identity.logo_url} alt={settings.identity.name} className="h-12 w-auto" />
              ) : (
                <span className="text-[#1e3a5f] text-2xl font-bold">{settings.identity.name}</span>
              )}
            </div>
            <div className="hidden md:flex space-x-8 items-center">
              <a href="#servicios" className="text-slate-600 hover:text-[#1e3a5f] font-medium">Servicios</a>
              <a href="#nosotros" className="text-slate-600 hover:text-[#1e3a5f] font-medium">Nosotros</a>
              <a href="#equipo" className="text-slate-600 hover:text-[#1e3a5f] font-medium">Equipo</a>
              <a href="#contacto" className="bg-[#c9a93c] text-white px-6 py-2 rounded font-medium hover:bg-[#b09332] transition-colors">Agendar Cita</a>
            </div>
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t p-4">
            <div className="flex flex-col space-y-4">
              <a href="#servicios" className="text-slate-600 font-medium" onClick={() => setIsMenuOpen(false)}>Servicios</a>
              <a href="#nosotros" className="text-slate-600 font-medium" onClick={() => setIsMenuOpen(false)}>Nosotros</a>
              <a href="#equipo" className="text-slate-600 font-medium" onClick={() => setIsMenuOpen(false)}>Equipo</a>
              <a href="#contacto" className="bg-[#c9a93c] text-white px-6 py-2 rounded font-medium text-center" onClick={() => setIsMenuOpen(false)}>Agendar Cita</a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] to-[#0f172a] z-0" />
        {settings.identity.cover_image_url && (
          <div className="absolute inset-0 z-0">
            <img src={settings.identity.cover_image_url} alt="Cover" className="w-full h-full object-cover opacity-30" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 z-10" />
        
        {/* Decorative elements */}
        <Heart className="absolute top-1/4 left-1/4 text-white opacity-10 w-24 h-24 z-10" />
        <Shield className="absolute bottom-1/4 right-1/4 text-white opacity-10 w-32 h-32 z-10" />

        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            {settings.identity.name}
          </h1>
          <p className="text-xl md:text-2xl text-slate-200 mb-10 max-w-2xl mx-auto">
            {settings.identity.tagline || 'Cuidado veterinario excepcional para su mejor amigo'}
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <a href="#contacto" className="w-full sm:w-auto bg-[#c9a93c] text-white px-8 py-4 rounded font-bold text-lg hover:bg-[#b09332] transition-colors shadow-lg">
              Agendar Cita
            </a>
            <a href={`https://wa.me/${settings.contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto border-2 border-white text-white px-8 py-4 rounded font-bold text-lg hover:bg-white hover:text-[#1e3a5f] transition-colors">
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {displayMetrics.map((metric, idx) => (
              <div key={metric.id || idx} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center text-[#1e3a5f] mb-3">
                  <Shield size={24} />
                </div>
                <div className="text-3xl font-bold text-[#1e3a5f]">{metric.value}</div>
                <div className="text-sm text-slate-500 uppercase tracking-wide mt-1">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="servicios" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] mb-4">Servicios Médicos</h2>
            <div className="w-24 h-1 bg-[#c9a93c] mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayServices.map(service => (
              <div key={service.id} className="bg-white p-6 rounded shadow-sm border-l-4 border-[#1e3a5f] hover:shadow-md transition-shadow relative">
                {service.badge && (
                  <div className="absolute top-4 right-4 bg-[#c9a93c]/10 text-[#c9a93c] text-xs font-bold px-2 py-1 rounded">
                    {service.badge}
                  </div>
                )}
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold text-[#1e3a5f] mb-2">{service.title}</h3>
                <p className="text-slate-600 mb-4 line-clamp-3">{service.description}</p>
                <div className="flex items-center text-sm text-slate-500 font-medium">
                  <Clock size={14} className="mr-1" /> {service.duration}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="nosotros" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6">Nuestra Institución</h2>
              <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
                <p>{settings.identity.historia || settings.identity.description}</p>
                {settings.identity.mision && (
                  <div>
                    <strong className="text-[#1e3a5f]">Misión:</strong> {settings.identity.mision}
                  </div>
                )}
                {settings.identity.vision && (
                  <div>
                    <strong className="text-[#1e3a5f]">Visión:</strong> {settings.identity.vision}
                  </div>
                )}
              </div>
            </div>
            <div className="bg-[#1e3a5f] p-10 rounded-lg text-white shadow-xl relative overflow-hidden">
              <Award className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5" />
              <h3 className="text-2xl font-bold text-[#c9a93c] mb-6">Certificaciones y Garantías</h3>
              <ul className="space-y-4">
                {settings.identity.certifications?.length > 0 ? settings.identity.certifications.map((cert, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="text-[#c9a93c] mr-3 mt-1 flex-shrink-0" size={20} />
                    <span>{cert}</span>
                  </li>
                )) : (
                  <>
                    <li className="flex items-start"><CheckCircle className="text-[#c9a93c] mr-3 mt-1 flex-shrink-0" size={20} /><span>Clínica Veterinaria Certificada</span></li>
                    <li className="flex items-start"><CheckCircle className="text-[#c9a93c] mr-3 mt-1 flex-shrink-0" size={20} /><span>Personal Médico Titulado</span></li>
                    <li className="flex items-start"><CheckCircle className="text-[#c9a93c] mr-3 mt-1 flex-shrink-0" size={20} /><span>Instalaciones de Primer Nivel</span></li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      {team && team.length > 0 && (
        <section id="equipo" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] mb-4">Cuerpo Médico</h2>
              <div className="w-24 h-1 bg-[#c9a93c] mx-auto"></div>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {team.map(member => (
                <div key={member.id} className="bg-white rounded shadow-sm overflow-hidden text-center">
                  <div className="aspect-square bg-slate-200 relative">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#1e3a5f]/10 text-[#1e3a5f] text-4xl font-bold">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-[#1e3a5f] text-lg">{member.name}</h3>
                    <p className="text-[#c9a93c] font-medium text-sm mb-3">{member.role}</p>
                    <p className="text-slate-500 text-sm italic">{member.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-20 bg-[#1e3a5f] text-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">Lo que dicen nuestros clientes</h2>
          <div className="relative bg-[#2a4a7f] p-8 md:p-12 rounded-lg shadow-xl">
            <span className="absolute top-4 left-4 text-6xl text-[#c9a93c] opacity-50 font-serif leading-none">"</span>
            <div className="mb-6 flex justify-center">
              {[...Array(displayTestimonials[currentTestimonialIndex].rating || 5)].map((_, i) => (
                <Star key={i} className="text-[#c9a93c] fill-current" size={20} />
              ))}
            </div>
            <p className="text-xl md:text-2xl font-light italic mb-8 relative z-10">
              {displayTestimonials[currentTestimonialIndex].content}
            </p>
            <div>
              <div className="font-bold text-lg">{displayTestimonials[currentTestimonialIndex].author}</div>
              {displayTestimonials[currentTestimonialIndex].pet_name && (
                <div className="text-[#c9a93c] text-sm">Dueño de {displayTestimonials[currentTestimonialIndex].pet_name}</div>
              )}
            </div>
            
            <button onClick={prevTestimonial} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 md:-translate-x-12 w-10 h-10 bg-[#c9a93c] rounded-full flex items-center justify-center text-white hover:bg-[#b09332]">
              <ChevronLeft size={24} />
            </button>
            <button onClick={nextTestimonial} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 md:translate-x-12 w-10 h-10 bg-[#c9a93c] rounded-full flex items-center justify-center text-white hover:bg-[#b09332]">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#1e3a5f] mb-10 text-center">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            {displayFaqs.map(faq => (
              <div key={faq.id} className={`border rounded transition-colors ${activeFaq === faq.id ? 'border-[#1e3a5f] bg-[#1e3a5f]/5' : 'border-slate-200'}`}>
                <button
                  className="w-full flex justify-between items-center p-5 text-left font-bold text-[#1e3a5f]"
                  onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`transform transition-transform ${activeFaq === faq.id ? 'rotate-180' : ''}`} />
                </button>
                {activeFaq === faq.id && (
                  <div className="p-5 pt-0 text-slate-600 border-t border-slate-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6">Información de Contacto</h2>
              <div className="space-y-6 mb-8">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-white rounded shadow-sm flex items-center justify-center text-[#1e3a5f] mr-4 flex-shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1e3a5f]">Dirección</h4>
                    <p className="text-slate-600">{settings.contact.address}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-white rounded shadow-sm flex items-center justify-center text-[#1e3a5f] mr-4 flex-shrink-0">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1e3a5f]">Teléfono</h4>
                    <p className="text-slate-600">{settings.contact.phone}</p>
                    {settings.contact.phone2 && <p className="text-slate-600">{settings.contact.phone2}</p>}
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-white rounded shadow-sm flex items-center justify-center text-[#1e3a5f] mr-4 flex-shrink-0">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1e3a5f]">Horario de Atención</h4>
                    <p className="text-slate-600 whitespace-pre-line">{settings.contact.schedule}</p>
                  </div>
                </div>
              </div>
              {settings.contact.maps_embed_url ? (
                <div className="w-full h-64 bg-slate-200 rounded overflow-hidden shadow-inner">
                  <iframe src={settings.contact.maps_embed_url} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"></iframe>
                </div>
              ) : (
                <div className="w-full h-64 bg-slate-200 rounded flex items-center justify-center text-slate-400">
                  <MapPin size={48} />
                </div>
              )}
            </div>

            <div className="bg-white p-8 rounded shadow-lg border-t-4 border-[#c9a93c]">
              <h3 className="text-2xl font-bold text-[#1e3a5f] mb-6">Agendar una Cita</h3>
              {submitSuccess ? (
                <div className="bg-green-50 text-green-700 p-4 rounded flex items-center">
                  <CheckCircle className="mr-2" />
                  ¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                    <input type="text" name="name" required className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                      <input type="tel" name="phone" required className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input type="email" name="email" required className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Motivo de la consulta</label>
                    <textarea name="message" rows={4} required className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none"></textarea>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full bg-[#1e3a5f] text-white py-3 rounded font-bold hover:bg-[#152a45] transition-colors disabled:opacity-50">
                    {isSubmitting ? 'Enviando...' : 'Solicitar Cita'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1e3a5f] text-white pt-16 pb-8 border-t-4 border-[#c9a93c]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-1">
              {settings.identity.logo_url ? (
                <img src={settings.identity.logo_url} alt={settings.identity.name} className="h-12 w-auto mb-4 bg-white/10 p-1 rounded" />
              ) : (
                <h3 className="text-2xl font-bold mb-4">{settings.identity.name}</h3>
              )}
              <p className="text-slate-300 text-sm mb-4">{settings.identity.description || settings.identity.tagline}</p>
            </div>
            
            <div>
              <h4 className="font-bold text-[#c9a93c] mb-4 uppercase text-sm tracking-wider">Enlaces Rápidos</h4>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#servicios" className="hover:text-white transition-colors">Servicios Médicos</a></li>
                <li><a href="#nosotros" className="hover:text-white transition-colors">Nuestra Institución</a></li>
                <li><a href="#equipo" className="hover:text-white transition-colors">Cuerpo Médico</a></li>
                <li><a href="#contacto" className="hover:text-white transition-colors">Contacto</a></li>
              </ul>
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <h4 className="font-bold text-[#c9a93c] mb-4 uppercase text-sm tracking-wider">Contacto Directo</h4>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start"><MapPin size={18} className="mr-2 mt-0.5 text-[#c9a93c]" /> <span>{settings.contact.address}</span></li>
                <li className="flex items-center"><Phone size={18} className="mr-2 text-[#c9a93c]" /> <span>{settings.contact.phone}</span></li>
                <li className="flex items-center"><Mail size={18} className="mr-2 text-[#c9a93c]" /> <span>{settings.contact.email}</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-400 text-sm">
            <p>&copy; {new Date().getFullYear()} {settings.identity.name}. Todos los derechos reservados.</p>
            <p className="mt-2 md:mt-0">Powered by Paws & Patients Pro</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      {settings.contact.whatsapp && (
        <a 
          href={`https://wa.me/${settings.contact.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-green-600 transition-colors animate-pulse"
        >
          <MessageCircle size={32} />
        </a>
      )}
    </div>
  );
}
