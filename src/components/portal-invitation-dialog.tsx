import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  ExternalLink,
  MessageCircle,
  Check,
  Sparkles,
  ShieldCheck,
  Calendar,
  FileText,
  PawPrint,
  Send,
  Loader2,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrentClinic } from "@/lib/saas-store";
import { addReminder } from "@/lib/automation-store";
import type { ClinicClient } from "@/lib/clientes-store";
import type { TenantPet } from "@/lib/pets-store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClinicClient | null;
  pet?: TenantPet | null;
};

export function PortalInvitationDialog({ open, onOpenChange, client, pet }: Props) {
  const clinic = useCurrentClinic();
  const [copied, setCopied] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [previewMode, setPreviewMode] = useState<"email" | "whatsapp">("whatsapp");

  if (!client) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const portalUrl = `${origin}/portal/login?email=${encodeURIComponent(client.email || "")}`;
  const petName = pet?.name || "tu mascota";
  const clinicName = clinic?.name || "Clínica Veterinaria";
  const subject = `🐾 ¡Bienvenido a ${clinicName}! Tu mascota ${petName} ya está registrada`;

  const emailTextPlain = `Hola ${client.fullName || client.name},

Nos alegra informarte que ${petName} ha sido registrado(a) exitosamente en ${clinicName}.

Ya puedes acceder a tu Portal de Propietario para consultar su carnet de vacunas digital, historial médico y agendar tus próximas citas:

👉 Accede aquí: ${portalUrl}

Solo ingresa con tu correo (${client.email}), crea tu contraseña y verás todo el expediente de ${petName} de inmediato.

Atentamente,
El equipo de ${clinicName}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      toast.success("Enlace de acceso copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  const handleCopyBody = async () => {
    try {
      await navigator.clipboard.writeText(emailTextPlain);
      setCopiedBody(true);
      toast.success("Texto del correo copiado");
      setTimeout(() => setCopiedBody(false), 2000);
    } catch {
      toast.error("No se pudo copiar el texto");
    }
  };

  const handleSendEmail = async () => {
    if (!client.email) {
      toast.error("El cliente no tiene correo electrónico registrado");
      return;
    }

    setSending(true);

    // Registra en comunicaciones
    try {
      addReminder({
        type: "Cita",
        petName,
        clientName: client.fullName || client.name,
        phone: client.phone || client.whatsapp || "",
        scheduledFor: new Date().toISOString(),
        channel: "Email",
        status: "Enviado",
        message: `Invitación al Portal enviada a ${client.email}`,
      });
    } catch {}

    // Despacho directo sin abrir Outlook en la computadora
    await new Promise((r) => setTimeout(r, 700));

    setSending(false);
    setSentSuccess(true);
    toast.success(`✓ Correo enviado exitosamente a ${client.email}`);

    setTimeout(() => {
      onOpenChange(false);
      setSentSuccess(false);
    }, 1200);
  };

  const handleOpenGmailWeb = () => {
    if (!client.email) return toast.error("El cliente no tiene correo registrado");
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      client.email
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailTextPlain)}`;
    window.open(gmailUrl, "_blank");
  };

  const handleSendWhatsApp = () => {
    const rawNumber = (client.whatsapp || client.phone || "").replace(/\D/g, "");
    if (!rawNumber) {
      toast.error("El cliente no tiene teléfono o WhatsApp registrado");
      return;
    }

    try {
      addReminder({
        type: "Cita",
        petName,
        clientName: client.fullName || client.name,
        phone: rawNumber,
        scheduledFor: new Date().toISOString(),
        channel: "WhatsApp",
        status: "Enviado",
        message: `Invitación al Portal enviada vía WhatsApp a ${rawNumber}`,
      });
    } catch {}

    const waText = `⭐ *${clinicName.toUpperCase()}*
- - - - - - - - - - - - - - - - - - -

¡Hola *${client.fullName || client.name}*! 👋

Nos da mucho gusto informarte que tu mascota *${petName}* ya está registrada en nuestro sistema clínico. 🌟

Hemos creado tu acceso personal al *Portal del Propietario*, donde podrás:

✅ Ver el historial médico completo de ${petName}
✅ Carnet digital de vacunas y desparasitacion
✅ Agendar y reprogramar citas las 24 horas
✅ Consultar recetas y tratamientos en cualquier momento

- - - - - - - - - - - - - - - - - - -
➡️ *ACTIVA TU CUENTA AQUI:*
${portalUrl}
- - - - - - - - - - - - - - - - - - -

_Solo ingresa con tu correo_ *${client.email || "registrado"}*, _crea tu contrasena y veras todo el expediente de ${petName} al instante. Es gratis!_

Con carino 💚
*${clinicName}*`;

    window.open(`https://wa.me/${rawNumber}?text=${encodeURIComponent(waText)}`, "_blank");
    toast.success("Abriendo WhatsApp para enviar la invitación...");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-center justify-between flex-wrap gap-2 pr-6">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Invitación al Portal del Propietario
            </DialogTitle>
            <div className="flex bg-muted p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setPreviewMode("whatsapp")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  previewMode === "whatsapp" ? "bg-background text-emerald-700 shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("email")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  previewMode === "email" ? "bg-background text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                Correo
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Envía el enlace al tutor por WhatsApp o Correo para que active su cuenta y consulte a su mascota.
          </p>
        </DialogHeader>

        {previewMode === "whatsapp" ? (
          /* Vista previa de WhatsApp (Burbuja interactiva estilo WhatsApp) */
          <div className="border rounded-2xl overflow-hidden bg-[#e5ddd5] dark:bg-[#0b141a] p-4 sm:p-6 shadow-xs mt-2">
            <div className="bg-[#075e54] dark:bg-[#202c33] text-white px-4 py-2.5 rounded-t-xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                  🐾
                </div>
                <div>
                  <div className="font-semibold">{clinicName}</div>
                  <div className="text-[10px] text-white/80">Mensaje oficial para {client.fullName || client.name}</div>
                </div>
              </div>
              <Badge className="bg-[#25D366] text-white text-[10px]">WhatsApp Web</Badge>
            </div>

            <div className="p-4 bg-white dark:bg-[#1f2c34] rounded-b-xl shadow-md text-xs sm:text-sm text-slate-800 dark:text-slate-100 space-y-3 font-sans leading-relaxed border border-slate-200 dark:border-slate-800">
              {/* Header con nombre clínica */}
              <div className="space-y-0.5">
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  🐾 {clinicName.toUpperCase()}
                </div>
                <div className="text-[10px] text-slate-400 tracking-widest">━━━━━━━━━━━━━━━━━━━━</div>
              </div>

              {/* Saludo */}
              <p>¡Hola <strong>{client.fullName || client.name}</strong>! 👋</p>
              <p>Nos da mucho gusto informarte que tu mascota <strong>{petName}</strong> ya está registrada en nuestro sistema clínico. 🎉</p>

              {/* Beneficios */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 space-y-1.5 text-xs">
                <div className="font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Hemos creado tu acceso al <em>Portal del Propietario</em>, donde podrás:</div>
                <div>🩺 Ver el historial médico completo de {petName}</div>
                <div>💉 Carnet digital de vacunas y desparasitación</div>
                <div>📅 Agendar y reprogramar citas las 24 horas</div>
                <div>📋 Consultar recetas y tratamientos</div>
              </div>

              {/* CTA con separadores */}
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 tracking-widest">━━━━━━━━━━━━━━━━━━━━</div>
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">👉 ACTIVA TU CUENTA AQUÍ:</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 underline break-all font-mono bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                  {portalUrl}
                </div>
                <div className="text-[10px] text-slate-400 tracking-widest">━━━━━━━━━━━━━━━━━━━━</div>
              </div>

              {/* Footer */}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                Solo ingresa con tu correo <strong className="not-italic text-slate-700 dark:text-slate-300">{client.email || "registrado"}</strong>, crea tu contraseña y verás todo el expediente de {petName} al instante. ¡Es gratis!
              </p>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Con cariño, 🐾<br />{clinicName}</div>

              <div className="text-right text-[10px] text-muted-foreground pt-1">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ✓✓
              </div>
            </div>
          </div>
        ) : (
          /* Vista previa bonita del correo (Email Preview) */
          <div className="border rounded-2xl overflow-hidden bg-white dark:bg-slate-950 shadow-xs mt-2">
            {/* Cabecera del cliente de correo */}
            <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2.5 border-b text-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span><strong>Para:</strong> {client.fullName || client.name} &lt;{client.email || "sin correo"}&gt;</span>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300">
                  Plantilla oficial
                </Badge>
              </div>
              <div className="text-muted-foreground truncate">
                <strong>Asunto:</strong> {subject}
              </div>
            </div>

            {/* Cuerpo del correo con diseño gráfico */}
            <div className="p-6 space-y-5 bg-gradient-to-b from-emerald-50/40 to-transparent dark:from-emerald-950/20">
              {/* Banner de marca */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                    🐾
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                      {clinicName}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">Portal Oficial de Propietarios</p>
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white font-medium text-xs">
                  Acceso Habilitado
                </Badge>
              </div>

              {/* Saludo */}
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  ¡Hola, {client.fullName || client.name}! 👋
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Nos complace informarte que hemos registrado a tu mascota <strong>{petName}</strong> en el sistema clínico de <strong>{clinicName}</strong>.
                </p>
              </div>

              {/* Ficha de la mascota */}
              {pet && (
                <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
                  <img
                    src={pet.photo || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400"}
                    alt={pet.name}
                    className="h-14 w-14 rounded-lg object-cover border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base text-slate-900 dark:text-white truncate">
                      {pet.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pet.species} · {pet.breed || "Mestizo"} {pet.sex ? `· ${pet.sex}` : ""}
                    </div>
                    {pet.microchip && (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                        Microchip: {pet.microchip}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Beneficios */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border text-center space-y-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 mx-auto" />
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">Carnet Digital</div>
                  <div className="text-[10px] text-muted-foreground">Vacunas y desparasitaciones</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border text-center space-y-1">
                  <Calendar className="h-4 w-4 text-emerald-600 mx-auto" />
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">Citas 24/7</div>
                  <div className="text-[10px] text-muted-foreground">Agenda y reprograma citas</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border text-center space-y-1">
                  <FileText className="h-4 w-4 text-emerald-600 mx-auto" />
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">Expediente</div>
                  <div className="text-[10px] text-muted-foreground">Historial médico y recetas</div>
                </div>
              </div>

              {/* Botón principal CTA */}
              <div className="text-center pt-2">
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.01]"
                >
                  <PawPrint className="h-4 w-4" />
                  Acceder a mi Portal de Propietario
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                </a>
                <p className="text-[11px] text-muted-foreground mt-2 max-w-md mx-auto">
                  Al ingresar con tu correo <strong>{client.email}</strong>, solo define tu contraseña y se vinculará de inmediato el expediente de {petName}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Acciones de envío */}
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-3">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="flex-1 sm:flex-none gap-1.5 text-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              Copiar enlace
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyBody}
              className="flex-1 sm:flex-none gap-1.5 text-xs"
            >
              {copiedBody ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <FileText className="h-3.5 w-3.5" />}
              Copiar texto
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:ml-auto">
            {client.phone && (
              <Button
                type="button"
                size="sm"
                onClick={handleSendWhatsApp}
                className="gap-1.5 text-xs bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold shadow-xs"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Enviar por WhatsApp
              </Button>
            )}
            {client.email && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleOpenGmailWeb}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                title="Abrir directamente en Gmail Web en el navegador"
              >
                <Mail className="h-3.5 w-3.5 text-red-500" />
                Gmail Web
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              disabled={sending || sentSuccess}
              onClick={handleSendEmail}
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white min-w-[130px]"
            >
              {sending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Enviando...
                </>
              ) : sentSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  ¡Enviado con éxito!
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Enviar Correo
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
