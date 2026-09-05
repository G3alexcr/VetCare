import { useState } from "react";
import { WebsiteSettings, saveWebsiteSettings } from "@/lib/website-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Phone, MessageCircle, Mail, MapPin, Clock, Facebook, 
  Instagram, AlertCircle, Compass, Navigation, Globe, 
  Share2, Type, CheckCircle2, ShieldCheck
} from "lucide-react";

export function ContactTab({ settings }: { settings: WebsiteSettings }) {
  const ct = settings.contact;
  
  // Canales directos
  const [phone, setPhone] = useState(ct.phone || "");
  const [phone2, setPhone2] = useState(ct.phone2 || "");
  const [whatsapp, setWhatsapp] = useState(ct.whatsapp || "");
  const [whatsappMsg, setWhatsappMsg] = useState(ct.whatsapp_message || "");
  const [email, setEmail] = useState(ct.email || "");
  const [address, setAddress] = useState(ct.address || "");
  const [schedule, setSchedule] = useState(ct.schedule || "");
  const [emergency24h, setEmergency24h] = useState(ct.emergency_24h || false);
  
  // GPS y Mapas
  const [googleMapsUrl, setGoogleMapsUrl] = useState(ct.google_maps_url || "");
  const [wazeUrl, setWazeUrl] = useState(ct.waze_url || "");
  const [mapsUrl, setMapsUrl] = useState(ct.maps_embed_url || "");
  
  // Redes sociales
  const [facebook, setFacebook] = useState(ct.social.facebook || "");
  const [instagram, setInstagram] = useState(ct.social.instagram || "");
  const [tiktok, setTiktok] = useState(ct.social.tiktok || "");
  const [youtube, setYoutube] = useState(ct.social.youtube || "");
  const [twitter, setTwitter] = useState(ct.social.twitter || "");
  const [linkedin, setLinkedin] = useState(ct.social.linkedin || "");

  // Textos y etiquetas editables de la sección de contacto
  const [contactBadge, setContactBadge] = useState(ct.contact_badge || "");
  const [contactTitle, setContactTitle] = useState(ct.contact_title || "");
  const [contactSubtitle, setContactSubtitle] = useState(ct.contact_subtitle || "");
  const [locationBadge, setLocationBadge] = useState(ct.location_badge || "");
  const [locationTitle, setLocationTitle] = useState(ct.location_title || "");
  const [perk1, setPerk1] = useState(ct.perk_1 || "");
  const [perk2, setPerk2] = useState(ct.perk_2 || "");
  const [perk3, setPerk3] = useState(ct.perk_3 || "");

  const save = () => {
    saveWebsiteSettings({
      contact: {
        phone,
        phone2,
        whatsapp,
        whatsapp_message: whatsappMsg,
        email,
        address,
        schedule,
        emergency_24h: emergency24h,
        google_maps_url: googleMapsUrl,
        waze_url: wazeUrl,
        maps_embed_url: mapsUrl,
        contact_badge: contactBadge,
        contact_title: contactTitle,
        contact_subtitle: contactSubtitle,
        location_badge: locationBadge,
        location_title: locationTitle,
        perk_1: perk1,
        perk_2: perk2,
        perk_3: perk3,
        social: { 
          facebook, 
          instagram, 
          tiktok, 
          youtube,
          twitter,
          linkedin,
        },
      },
    });
    toast.success("Información y enlaces de contacto guardados correctamente");
  };

  const field = (
    label: string, 
    value: string, 
    setter: (v: string) => void, 
    icon?: React.ReactNode, 
    placeholder?: string,
    help?: string
  ) => (
    <div>
      <Label className="text-slate-700 text-xs font-bold mb-1.5 block">{label}</Label>
      <div className="relative">
        {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
        <Input 
          value={value} 
          onChange={(e) => setter(e.target.value)} 
          placeholder={placeholder} 
          className={`bg-white border-slate-300 text-slate-900 text-sm rounded-xl focus:border-teal-500 ${icon ? "pl-10" : ""}`} 
        />
      </div>
      {help && <p className="text-[11px] text-slate-400 mt-1">{help}</p>}
    </div>
  );

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Canales de Contacto, GPS y Redes Sociales</h2>
        <p className="text-xs text-slate-500 mt-1">
          Configura tus enlaces directos a Google Maps, Waze, WhatsApp, teléfonos, correos, redes sociales y todos los textos de la sección.
        </p>
      </div>

      {/* 1. Navegación GPS y Rutas en Tiempo Real */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600" />
            <span>Navegación GPS: Google Maps & Waze</span>
          </h3>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Enlaces de Ruta
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Los clientes podrán tocar estos botones para abrir de inmediato su app de GPS favorita y llegar a la clínica sin perderse.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field(
            "Enlace Directo de Google Maps (URL)", 
            googleMapsUrl, 
            setGoogleMapsUrl, 
            <MapPin className="w-4 h-4 text-emerald-600" />, 
            "https://maps.app.goo.gl/tu-clinica",
            "Pega el enlace de compartir de tu ficha en Google Maps o déjalo en blanco para búsqueda automática."
          )}
          {field(
            "Enlace Directo de Waze (URL)", 
            wazeUrl, 
            setWazeUrl, 
            <Navigation className="w-4 h-4 text-teal-600" />, 
            "https://waze.com/ul?q=Govet+Hospital",
            "Pega el enlace directo a tu clínica en Waze o déjalo en blanco para generar la ruta con tu dirección."
          )}
        </div>

        {field(
          "Dirección Física Visible de la Clínica", 
          address, 
          setAddress, 
          <MapPin className="w-4 h-4 text-rose-500" />, 
          "Avenida Principal, Torre Médica Animal, San José, Costa Rica",
          "Esta dirección se muestra a los visitantes y sirve como respaldo para calcular las rutas GPS."
        )}

        <div>
          <Label className="text-slate-700 text-xs font-bold mb-1.5 block">URL Embed de Google Maps (Opcional para Iframe)</Label>
          <Input 
            value={mapsUrl} 
            onChange={(e) => setMapsUrl(e.target.value)} 
            placeholder="https://maps.google.com/maps?q=..." 
            className="bg-white border-slate-300 text-slate-900 text-xs font-mono rounded-xl focus:border-teal-500" 
          />
          <p className="text-[11px] text-slate-400 mt-1">
            En Google Maps → Compartir → Insertar mapa → copia el enlace de src="..."
          </p>
        </div>
      </Card>

      {/* 2. Canales de Comunicación Inmediata */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Phone className="w-5 h-5 text-teal-600" />
            <span>Líneas Telefónicas, WhatsApp y Correo</span>
          </h3>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            Atención Rápida
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field(
            "WhatsApp Oficial (con código de país)", 
            whatsapp, 
            setWhatsapp, 
            <MessageCircle className="w-4 h-4 text-emerald-600" />, 
            "+506 8304 2817",
            "Ejemplo: +50683042817 (sin espacios ni guiones para enlace wa.me)"
          )}
          {field(
            "Mensaje Inicial Predeterminado de WhatsApp", 
            whatsappMsg, 
            setWhatsappMsg, 
            <MessageCircle className="w-4 h-4 text-teal-600" />, 
            "Hola, me gustaría agendar una consulta médica veterinaria.",
            "Texto con el que se abrirá el chat del cliente automáticamente."
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field(
            "Teléfono Principal de Llamadas", 
            phone, 
            setPhone, 
            <Phone className="w-4 h-4 text-teal-600" />, 
            "+506 2222 3333"
          )}
          {field(
            "Teléfono Secundario / Emergencias", 
            phone2, 
            setPhone2, 
            <Phone className="w-4 h-4 text-teal-600" />, 
            "+506 2222 4444"
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field(
            "Correo Electrónico Institucional", 
            email, 
            setEmail, 
            <Mail className="w-4 h-4 text-sky-600" />, 
            "citas@govethospital.com"
          )}
          {field(
            "Horario Habitual de Atención", 
            schedule, 
            setSchedule, 
            <Clock className="w-4 h-4 text-amber-600" />, 
            "Lunes a Domingo • 24 Horas"
          )}
        </div>

        <div className="flex items-center justify-between p-4 bg-rose-50/60 border border-rose-100 rounded-2xl mt-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 grid place-items-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Servicio de Urgencias Médicas 24 Horas</div>
              <div className="text-xs text-slate-500">Muestra una insignia y botón de emergencia prioritario en la web</div>
            </div>
          </div>
          <Switch checked={emergency24h} onCheckedChange={setEmergency24h} />
        </div>
      </Card>

      {/* 3. Redes Sociales Oficiales */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600" />
            <span>Redes Sociales Oficiales</span>
          </h3>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
            Perfiles Públicos
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Los íconos aparecerán en la barra de contacto y pie de página enlazando a tus cuentas oficiales.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("Instagram", instagram, setInstagram, <Instagram className="w-4 h-4 text-pink-600" />, "https://instagram.com/govethospital")}
          {field("Facebook", facebook, setFacebook, <Facebook className="w-4 h-4 text-blue-600" />, "https://facebook.com/govethospital")}
          {field("TikTok", tiktok, setTiktok, <Globe className="w-4 h-4 text-slate-700" />, "https://tiktok.com/@govethospital")}
          {field("YouTube", youtube, setYoutube, <Globe className="w-4 h-4 text-red-600" />, "https://youtube.com/@govethospital")}
          {field("X / Twitter", twitter, setTwitter, <Globe className="w-4 h-4 text-slate-800" />, "https://x.com/govethospital")}
          {field("LinkedIn", linkedin, setLinkedin, <Globe className="w-4 h-4 text-blue-700" />, "https://linkedin.com/company/govethospital")}
        </div>
      </Card>

      {/* 4. Textos Personalizables de la Sección de Contacto */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Type className="w-5 h-5 text-amber-600" />
            <span>Textos y Puntos Clave de la Sección</span>
          </h3>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            Personalización de Textos
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Adapta los títulos, subtítulos e insignias que aparecen en la sección de Contáctanos.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field(
            "Insignia Superior (Badge)", 
            contactBadge, 
            setContactBadge, 
            undefined, 
            "Atención Médica & Ubicación"
          )}
          {field(
            "Título Principal de la Sección", 
            contactTitle, 
            setContactTitle, 
            undefined, 
            "Contáctanos y Cómo Llegar al Hospital"
          )}
        </div>

        <div>
          <Label className="text-slate-700 text-xs font-bold mb-1.5 block">Subtítulo Explicativo</Label>
          <Textarea 
            value={contactSubtitle} 
            onChange={(e) => setContactSubtitle(e.target.value)} 
            rows={2} 
            placeholder="Estamos a tu entera disposición las 24 horas del día. Inicia tu ruta con un clic en tu aplicación preferida..." 
            className="bg-white border-slate-300 text-slate-900 text-sm resize-none focus:border-teal-500 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          {field(
            "Título de Tarjeta Izquierda (Ubicación)", 
            locationTitle, 
            setLocationTitle, 
            undefined, 
            "Ubicación e Instalaciones"
          )}
          {field(
            "Insignia de Guardia", 
            locationBadge, 
            setLocationBadge, 
            undefined, 
            "Guardia Activa 24/7"
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-3">
          <Label className="text-slate-700 text-xs font-bold block">
            3 Puntos Clave de Instalaciones / Acceso (Checkmarks)
          </Label>
          <div className="grid grid-cols-1 gap-2.5">
            {field(
              "Punto Clave 1", 
              perk1, 
              setPerk1, 
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />, 
              "Aparcamiento gratuito y seguro para clientes"
            )}
            {field(
              "Punto Clave 2", 
              perk2, 
              setPerk2, 
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />, 
              "Rampa de ingreso directo para emergencias en camilla"
            )}
            {field(
              "Punto Clave 3", 
              perk3, 
              setPerk3, 
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />, 
              "Área de recepción con separación canina y felina"
            )}
          </div>
        </div>
      </Card>

      {/* Botón Flotante / Principal de Guardar */}
      <div className="sticky bottom-6 z-20">
        <Button 
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-sm rounded-2xl shadow-lg transition-all hover:scale-[1.01] flex items-center justify-center gap-2" 
          onClick={save}
        >
          <ShieldCheck className="w-5 h-5 text-emerald-100" />
          <span>Guardar Enlaces de Contacto, GPS y Redes Sociales</span>
        </Button>
      </div>
    </div>
  );
}
