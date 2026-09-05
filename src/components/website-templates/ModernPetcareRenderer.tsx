'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/supabase';
import { 
  Menu, X, Phone, Mail, MapPin, Clock, ChevronDown, 
  Facebook, Instagram, Youtube, Star, ChevronLeft, ChevronRight
} from 'lucide-react';
import type { 
  WebsiteSettings, WebsiteService, WebsiteSlide, 
  WebsiteGroupItem, WebsiteTestimonial, WebsiteGalleryItem, WebsitePost 
} from '@/lib/website-store';

interface Props {
  settings: WebsiteSettings;
  services: WebsiteService[];
  slides: WebsiteSlide[];
  clinic: { name: string; logo_url: string } | null;
  team: WebsiteGroupItem[];
  testimonials: WebsiteTestimonial[];
  gallery: WebsiteGalleryItem[];
  posts: WebsitePost[];
}

const DEFAULT_FAQS = [
  { id: '1', question: '¿Atienden emergencias?', answer: 'Sí, contamos con servicio de urgencias 24/7. Por favor llame a nuestro número principal inmediatamente.', sort_order: 1 },
  { id: '2', question: '¿Con qué frecuencia debo vacunar a mi mascota?', answer: 'Recomendamos un chequeo anual donde nuestro veterinario evaluará el plan de vacunación ideal según la edad y estilo de vida de su mascota.', sort_order: 2 },
  { id: '3', question: '¿Ofrecen servicio de peluquería o grooming?', answer: 'Sí, ofrecemos servicios completos de estética y grooming para mantener a su mascota limpia y saludable.', sort_order: 3 },
  { id: '4', question: '¿Cómo puedo agendar una cita?', answer: 'Puede agendar una cita llenando el formulario en nuestra página web, llamándonos o enviándonos un mensaje por WhatsApp.', sort_order: 4 },
];

const DEFAULT_METRICS = [
  { id: 'm1', value: '1,200+', label: 'Mascotas atendidas', icon: '🐾' },
  { id: 'm2', value: '8+', label: 'Años de experiencia', icon: '⭐' },
  { id: 'm3', value: '4', label: 'Veterinarios especializados', icon: '👨‍⚕️' },
  { id: 'm4', value: '98%', label: 'Clientes satisfechos', icon: '💚' },
];

const DEFAULT_SERVICES = [
  { id: 's1', clinicId: '', title: 'Consulta Médica General', description: 'Revisión completa del estado de salud de su mascota.', icon: '🩺', image_url: null, price: null, price_from: false, badge: '', duration: '30min', sort_order: 1, is_active: true },
  { id: 's2', clinicId: '', title: 'Vacunación', description: 'Esquemas completos de vacunación y desparasitación.', icon: '💉', image_url: null, price: null, price_from: false, badge: 'ESENCIAL', duration: '15min', sort_order: 2, is_active: true },
  { id: 's3', clinicId: '', title: 'Cirugía', description: 'Procedimientos quirúrgicos con la más alta seguridad.', icon: '🔬', image_url: null, price: null, price_from: false, badge: '', duration: 'Variable', sort_order: 3, is_active: true },
  { id: 's4', clinicId: '', title: 'Estética / Grooming', description: 'Baño, corte de pelo y limpieza de uñas.', icon: '✂️', image_url: null, price: null, price_from: false, badge: 'MÁS POPULAR', duration: '1-2h', sort_order: 4, is_active: true },
  { id: 's5', clinicId: '', title: 'Odontología', description: 'Limpieza dental y tratamientos para una sonrisa sana.', icon: '🦷', image_url: null, price: null, price_from: false, badge: '', duration: '45min', sort_order: 5, is_active: true },
  { id: 's6', clinicId: '', title: 'Hospitalización 24h', description: 'Cuidados intensivos y monitoreo constante.', icon: '🏥', image_url: null, price: null, price_from: false, badge: 'URGENCIAS', duration: '24/7', sort_order: 6, is_active: true },
];

export function ModernPetcareRenderer({ settings, services, team, testimonials, clinic }: Props) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [formState, setFormState] = useState({ name: '', phone: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const displayFaqs = settings.faqs?.length > 0 ? settings.faqs : DEFAULT_FAQS;
  const displayMetrics = settings.metrics?.length > 0 ? settings.metrics : DEFAULT_METRICS;
  const displayServices = services?.length > 0 ? services : DEFAULT_SERVICES;
  const displayTestimonials = testimonials?.length > 0 ? testimonials : [
    { id: 't1', author: 'María García', pet_name: 'Luna', role: 'Cliente', content: 'Excelente servicio, salvaron la vida de mi perrita. Los doctores son muy amables y profesionales.', rating: 5, photo_url: null },
    { id: 't2', author: 'Carlos Pérez', pet_name: 'Simba', role: 'Cliente', content: 'Llevo a mi gato para sus vacunas y siempre lo tratan con mucho cariño. Muy recomendados.', rating: 5, photo_url: null }
  ];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await db.from('website_leads').insert({
        clinic_id: settings.clinicId,
        name: formState.name,
        phone: formState.phone,
        email: formState.email,
        message: formState.message,
        template: settings.template_id
      });
      if (error) throw error;
      setSubmitSuccess(true);
      setFormState({ name: '', phone: '', email: '', message: '' });
    } catch (err) {
      console.error(err);
      alert('Hubo un error al enviar su mensaje. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clinicName = settings.identity?.name || clinic?.name || 'Clínica Veterinaria';
  const logoUrl = settings.identity?.logo_url || clinic?.logo_url;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* 1. Navbar */}
      <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            <a href="#" className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt={clinicName} className="h-10 object-contain" />
              ) : (
                <span className={`text-2xl font-bold tracking-tight ${isScrolled ? 'text-slate-900' : 'text-slate-900'}`}>{clinicName}</span>
              )}
            </a>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {['Inicio', 'Servicios', 'Nosotros', 'Equipo', 'Contacto'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium hover:text-mint-600 transition-colors">
                  {item}
                </a>
              ))}
              <a href="#contacto" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-full font-medium transition-all transform hover:scale-105 shadow-md shadow-orange-500/20">
                Agendar Cita
              </a>
            </nav>

            {/* Mobile Toggle */}
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg py-4 px-4 flex flex-col gap-4">
            {['Inicio', 'Servicios', 'Nosotros', 'Equipo', 'Contacto'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-lg font-medium py-2 border-b border-slate-100" onClick={() => setIsMenuOpen(false)}>
                {item}
              </a>
            ))}
            <a href="#contacto" className="bg-orange-500 text-white px-6 py-3 rounded-full font-medium text-center mt-2" onClick={() => setIsMenuOpen(false)}>
              Agendar Cita
            </a>
          </div>
        )}
      </header>

      {/* 2. Hero Split */}
      <section id="inicio" className="relative pt-24 pb-12 md:pt-32 md:pb-24 lg:py-0 lg:min-h-screen flex items-center bg-emerald-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center relative z-10">
            {/* Left */}
            <div className="lg:w-1/2 lg:pr-12 xl:pr-24 pt-10 pb-16 lg:py-32 z-10">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-tight mb-6">
                {settings.identity?.name || clinicName}
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 mb-8 font-medium">
                {settings.identity?.tagline || 'Cuidamos de tu mascota como si fuera nuestra.'}
              </p>
              <p className="text-lg text-slate-500 mb-10 max-w-lg">
                {settings.identity?.description || 'Brindamos atención veterinaria integral de la más alta calidad para garantizar el bienestar y la felicidad de sus animales de compañía.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#contacto" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-xl shadow-orange-500/30 text-center">
                  Agendar Ahora
                </a>
                <a href="#servicios" className="border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 px-8 py-4 rounded-full font-bold text-lg transition-all text-center">
                  Ver Servicios
                </a>
              </div>
            </div>

            {/* Right */}
            <div className="lg:w-1/2 absolute top-0 right-0 h-full w-full lg:w-1/2 overflow-hidden hidden lg:block rounded-l-[100px] bg-gradient-to-br from-emerald-400 to-emerald-600">
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path fill="currentColor" d="M30 40 C 20 40, 10 30, 10 20 C 10 10, 20 0, 30 0 C 40 0, 50 10, 50 20 C 50 30, 40 40, 30 40 Z" />
                  <path fill="currentColor" d="M70 40 C 60 40, 50 30, 50 20 C 50 10, 60 0, 70 0 C 80 0, 90 10, 90 20 C 90 30, 80 40, 70 40 Z" />
                  <path fill="currentColor" d="M50 90 C 20 90, 0 70, 0 50 C 0 30, 20 45, 50 45 C 80 45, 100 30, 100 50 C 100 70, 80 90, 50 90 Z" />
                </svg>
              </div>
              
              {/* Floating elements */}
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/20 rounded-full animate-pulse backdrop-blur-md"></div>
              <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-orange-400/30 rounded-full animate-pulse delay-700 backdrop-blur-md"></div>
              <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-emerald-300/40 rounded-full animate-pulse delay-1000 backdrop-blur-md"></div>

              {settings.identity?.cover_image_url && (
                <img 
                  src={settings.identity.cover_image_url} 
                  alt="Clínica" 
                  className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Metrics */}
      <section className="bg-white py-12 shadow-sm relative z-20 -mt-10 md:-mt-20 mx-4 md:mx-auto container rounded-2xl md:max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-6">
          {displayMetrics.map((metric, idx) => (
            <div key={metric.id || idx} className="text-center p-4">
              <div className="text-4xl mb-2">{metric.icon}</div>
              <div className="text-3xl font-extrabold text-emerald-600 mb-1">{metric.value}</div>
              <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">{metric.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Services */}
      <section id="servicios" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Nuestros Servicios</h2>
            <p className="text-lg text-slate-600">Ofrecemos una amplia gama de servicios veterinarios para cubrir todas las necesidades de su mascota.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayServices.map(service => (
              <div key={service.id} className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 transform hover:-translate-y-1 relative group">
                {service.badge && (
                  <span className="absolute top-6 right-6 bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {service.badge}
                  </span>
                )}
                <div className="text-6xl mb-6 bg-emerald-50 w-20 h-20 flex items-center justify-center rounded-2xl group-hover:bg-emerald-100 transition-colors">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                <p className="text-slate-600 mb-6 line-clamp-3">{service.description}</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <div className="flex items-center text-slate-500 text-sm">
                    <Clock className="w-4 h-4 mr-1" /> {service.duration}
                  </div>
                  {service.price && (
                    <div className="font-bold text-emerald-600">
                      {service.price_from && 'desde '}
                      ${service.price}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. About Us */}
      <section id="nosotros" className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Nuestra Misión</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                {settings.identity?.mision || 'Proveer servicios médicos veterinarios de excelencia, combinando tecnología avanzada con un trato humano y compasivo, para mejorar la calidad de vida de las mascotas y fortalecer el vínculo con sus familias.'}
              </p>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Nuestra Visión</h3>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                {settings.identity?.vision || 'Ser reconocidos como el centro veterinario líder en la región, destacando por nuestra innovación médica, ética profesional y compromiso genuino con el bienestar animal.'}
              </p>
              
              {settings.identity?.founded_year && (
                <div className="inline-flex items-center bg-emerald-50 text-emerald-700 px-6 py-3 rounded-full font-semibold">
                  <Star className="w-5 h-5 mr-2" />
                  Sirviendo a la comunidad desde {settings.identity.founded_year}
                </div>
              )}
            </div>
            <div className="lg:w-1/2 relative w-full h-[500px]">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-[3rem] transform rotate-3 scale-105 opacity-20"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-300 to-emerald-500 rounded-[3rem] shadow-2xl overflow-hidden flex items-center justify-center">
                {settings.identity?.cover_image_url ? (
                  <img src={settings.identity.cover_image_url} alt="Nosotros" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-white text-9xl opacity-50">🏥</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Team */}
      {team && team.length > 0 && (
        <section id="equipo" className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Nuestro Equipo Médico</h2>
              <p className="text-lg text-slate-600">Profesionales altamente capacitados y apasionados por el cuidado animal.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map(member => (
                <div key={member.id} className="text-center group">
                  <div className="relative w-48 h-48 mx-auto mb-6">
                    <div className="absolute inset-0 bg-emerald-500 rounded-full scale-105 group-hover:scale-110 transition-transform duration-300 opacity-20"></div>
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-full h-full object-cover rounded-full ring-4 ring-white shadow-lg relative z-10" />
                    ) : (
                      <div className="w-full h-full bg-emerald-100 rounded-full ring-4 ring-white shadow-lg relative z-10 flex items-center justify-center text-4xl font-bold text-emerald-600">
                        {member.name.substring(0, 2)}
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{member.name}</h3>
                  <p className="text-emerald-600 font-medium mb-3">{member.role}</p>
                  {member.specialties && member.specialties.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {member.specialties.map(spec => (
                        <span key={spec} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md">{spec}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. Testimonials */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Lo que dicen de nosotros</h2>
          </div>
          
          <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out" 
                style={{ transform: `translateX(-${testimonialIndex * 100}%)` }}
              >
                {displayTestimonials.map((testimonial) => (
                  <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                    <div className="bg-slate-50 rounded-3xl p-8 md:p-12 text-center relative border border-slate-100">
                      <div className="absolute top-8 left-8 text-emerald-200 opacity-50">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                        </svg>
                      </div>
                      <div className="flex justify-center mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-6 h-6 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                        ))}
                      </div>
                      <p className="text-xl md:text-2xl text-slate-700 italic mb-8 relative z-10 leading-relaxed">
                        "{testimonial.content}"
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        {testimonial.photo_url ? (
                          <img src={testimonial.photo_url} alt={testimonial.author} className="w-14 h-14 rounded-full object-cover" />
                        ) : (
                          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl font-bold">
                            {testimonial.author.charAt(0)}
                          </div>
                        )}
                        <div className="text-left">
                          <h4 className="font-bold text-slate-900">{testimonial.author}</h4>
                          {testimonial.pet_name && (
                            <p className="text-orange-500 font-medium text-sm">Dueño(a) de {testimonial.pet_name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {displayTestimonials.length > 1 && (
              <div className="flex justify-center gap-4 mt-8">
                <button 
                  onClick={() => setTestimonialIndex(prev => (prev === 0 ? displayTestimonials.length - 1 : prev - 1))}
                  className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                  {displayTestimonials.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setTestimonialIndex(idx)}
                      className={`w-3 h-3 rounded-full transition-colors ${idx === testimonialIndex ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    />
                  ))}
                </div>
                <button 
                  onClick={() => setTestimonialIndex(prev => (prev === displayTestimonials.length - 1 ? 0 : prev + 1))}
                  className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors shadow-sm"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 8. FAQs */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Preguntas Frecuentes</h2>
          </div>
          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm">
            {displayFaqs.map((faq) => (
              <div key={faq.id} className="border-b border-slate-100 last:border-0">
                <button 
                  className="w-full flex items-center justify-between py-6 text-left focus:outline-none"
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                >
                  <span className={`text-lg font-bold pr-8 transition-colors ${openFaq === faq.id ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {faq.question}
                  </span>
                  <ChevronDown className={`w-6 h-6 flex-shrink-0 transition-transform duration-300 text-emerald-500 ${openFaq === faq.id ? 'transform rotate-180' : ''}`} />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === faq.id ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-slate-600 leading-relaxed text-lg">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Contact */}
      <section id="contacto" className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Contáctanos</h2>
              <p className="text-lg text-slate-600 mb-10">Estamos aquí para ayudarle. Contáctenos por cualquiera de estos medios o visítenos en nuestra clínica.</p>
              
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 mr-6">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">Dirección</h4>
                    <p className="text-slate-600">{settings.contact?.address || 'Av. Principal 123, Ciudad'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 mr-6">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">Teléfono</h4>
                    <p className="text-slate-600">{settings.contact?.phone || '+1 234 567 8900'}</p>
                    {settings.contact?.phone2 && <p className="text-slate-600">{settings.contact.phone2}</p>}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 mr-6">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">Correo Electrónico</h4>
                    <p className="text-slate-600">{settings.contact?.email || 'contacto@veterinaria.com'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 mr-6">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">Horario</h4>
                    <p className="text-slate-600 whitespace-pre-line">{settings.contact?.schedule || 'Lun - Vie: 9:00 - 20:00\nSáb: 9:00 - 15:00'}</p>
                    {settings.contact?.emergency_24h && (
                      <span className="inline-block mt-2 bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">URGENCIAS 24/7</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
              <h3 className="text-2xl font-bold text-slate-900 mb-8">Envíenos un mensaje</h3>
              {submitSuccess ? (
                <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-2xl p-6 text-center">
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h4 className="text-xl font-bold mb-2">¡Mensaje enviado!</h4>
                  <p>Nos pondremos en contacto con usted lo más pronto posible.</p>
                  <button onClick={() => setSubmitSuccess(false)} className="mt-6 text-emerald-600 font-bold hover:underline">
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">Nombre completo</label>
                    <input 
                      type="text" id="name" required
                      value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">Teléfono</label>
                      <input 
                        type="tel" id="phone" required
                        value={formState.phone} onChange={e => setFormState({...formState, phone: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        placeholder="555-123-4567"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Correo (opcional)</label>
                      <input 
                        type="email" id="email"
                        value={formState.email} onChange={e => setFormState({...formState, email: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        placeholder="juan@ejemplo.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">Mensaje</label>
                    <textarea 
                      id="message" required rows={4}
                      value={formState.message} onChange={e => setFormState({...formState, message: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                      placeholder="¿En qué podemos ayudarle?"
                    ></textarea>
                  </div>
                  <button 
                    type="submit" disabled={isSubmitting}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="bg-[#064e3b] text-emerald-50 pt-20 pb-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div>
              <div className="mb-6 flex items-center">
                {logoUrl ? (
                  <img src={logoUrl} alt={clinicName} className="h-12 object-contain brightness-0 invert" />
                ) : (
                  <span className="text-3xl font-bold text-white">{clinicName}</span>
                )}
              </div>
              <p className="text-emerald-200 mb-6 leading-relaxed">
                {settings.identity?.tagline || 'Cuidamos de tu mascota como si fuera nuestra.'}
              </p>
              <div className="flex space-x-4">
                {settings.contact?.social?.facebook && (
                  <a href={settings.contact.social.facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center hover:bg-emerald-600 transition-colors">
                    <Facebook className="w-5 h-5 text-white" />
                  </a>
                )}
                {settings.contact?.social?.instagram && (
                  <a href={settings.contact.social.instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center hover:bg-emerald-600 transition-colors">
                    <Instagram className="w-5 h-5 text-white" />
                  </a>
                )}
                {settings.contact?.social?.youtube && (
                  <a href={settings.contact.social.youtube} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center hover:bg-emerald-600 transition-colors">
                    <Youtube className="w-5 h-5 text-white" />
                  </a>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-white text-lg font-bold mb-6">Enlaces Rápidos</h4>
              <ul className="space-y-3">
                {['Inicio', 'Servicios', 'Nosotros', 'Equipo', 'Contacto'].map(item => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase()}`} className="text-emerald-200 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-white text-lg font-bold mb-6">Servicios Principales</h4>
              <ul className="space-y-3">
                {displayServices.slice(0, 5).map(service => (
                  <li key={service.id}>
                    <a href="#servicios" className="text-emerald-200 hover:text-white transition-colors">{service.title}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-white text-lg font-bold mb-6">Contacto</h4>
              <ul className="space-y-4 text-emerald-200">
                <li className="flex items-start">
                  <MapPin className="w-5 h-5 mr-3 flex-shrink-0 text-emerald-400 mt-1" />
                  <span>{settings.contact?.address || 'Av. Principal 123, Ciudad'}</span>
                </li>
                <li className="flex items-center">
                  <Phone className="w-5 h-5 mr-3 flex-shrink-0 text-emerald-400" />
                  <span>{settings.contact?.phone || '+1 234 567 8900'}</span>
                </li>
                <li className="flex items-center">
                  <Mail className="w-5 h-5 mr-3 flex-shrink-0 text-emerald-400" />
                  <span>{settings.contact?.email || 'contacto@veterinaria.com'}</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-emerald-800 flex flex-col md:flex-row items-center justify-between text-emerald-300 text-sm">
            <p>&copy; {new Date().getFullYear()} {clinicName}. Todos los derechos reservados.</p>
            <p className="mt-4 md:mt-0">Desarrollado por PawsPatients Pro</p>
          </div>
        </div>
      </footer>

      {/* 11. WhatsApp FAB */}
      {(settings.contact?.whatsapp || settings.contact?.phone) && (
        <a 
          href={`https://wa.me/${(settings.contact?.whatsapp || settings.contact?.phone || '').replace(/[^0-9]/g, '')}`} 
          target="_blank" 
          rel="noreferrer"
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/50 hover:scale-110 transition-transform animate-bounce"
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </a>
      )}
    </div>
  );
}
