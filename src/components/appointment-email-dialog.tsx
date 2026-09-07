import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, CheckCircle2, Eye, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";
import { sendAppointmentEmailFn } from "@/lib/email.functions";
import { renderAppointmentEmailHtml, type AppointmentEmailData } from "@/lib/email-templates";
import { useCurrentClinicId } from "@/lib/saas-store";
import { getClinicEmailConfig } from "@/lib/clinic-email-store";

export function AppointmentEmailDialog({
  open,
  onOpenChange,
  data,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: AppointmentEmailData | null;
}) {
  const clinicId = useCurrentClinicId();
  const [recipientEmail, setRecipientEmail] = useState(data?.clientEmail || "");
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    if (data?.clientEmail) {
      setRecipientEmail(data.clientEmail);
    }
  }, [data]);

  if (!data) return null;

  const currentEmailData: AppointmentEmailData = {
    ...data,
    clientEmail: recipientEmail.trim() || data.clientEmail || "tutor@gmail.com",
  };

  const htmlPreview = renderAppointmentEmailHtml(currentEmailData);

  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes("@")) {
      toast.error("Ingresa un correo electrónico válido");
      return;
    }

    const emailCfg = getClinicEmailConfig(clinicId);

    setSending(true);
    try {
      const res = await sendAppointmentEmailFn({
        data: {
          ...currentEmailData,
          apiKey: emailCfg.resendApiKey,
          fromName: emailCfg.senderName,
          fromEmail: emailCfg.senderEmail || "citas@go2vet.online",
        },
      });

      if (res.success) {
        if (res.mocked) {
          toast.warning(
            `Atención: No hay clave de correo configurada en el servidor. El correo no fue despachado a la bandeja de ${recipientEmail}. Usa el botón "Abrir en Gmail Web" para enviarlo de inmediato.`,
            { duration: 8000 }
          );
        } else {
          toast.success(`✓ Correo de cita enviado exitosamente a ${recipientEmail}`);
          onOpenChange(false);
        }
      } else {
        toast.error(res.error || "No se pudo despachar el correo");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error al enviar el correo");
    } finally {
      setSending(false);
    }
  };

  const handleOpenGmailWeb = () => {
    const clinic = data.clinicName || "VetCare Clínica Veterinaria";
    const subject = `📅 Cita Veterinaria Confirmada: ${data.petName} — ${clinic}`;
    const plainText = `Hola ${data.clientName},\n\nTe confirmamos tu cita veterinaria en ${clinic}:\n\n- Fecha: ${data.date}\n- Hora: ${data.time}\n- Paciente: ${data.petName} (${data.petSpecies || ""})\n- Motivo: ${data.reason || "Consulta médica"}\n- Médico: Dr(a). ${data.vetName || "Equipo Médico"}\n\nSi necesitas reprogramar o consultar tus citas, puedes ingresar a tu Portal de Clientes:\n${data.portalUrl || "https://app.go2vet.online/portal"}\n\n¡Te esperamos!`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      recipientEmail
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainText)}`;
    window.open(gmailUrl, "_blank");
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlPreview);
    toast.success("Código HTML copiado al portapapeles");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 grid place-items-center">
                <Mail className="h-4 w-4" />
              </div>
              Confirmación de Cita por Correo
            </DialogTitle>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-mono text-[11px]">
              {data.time} · {data.date}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
          {/* Email Recipient Configuration */}
          <div className="p-3 bg-muted/40 border rounded-xl space-y-2">
            <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Destinatario (Correo del Tutor):</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Paciente: <strong>{data.petName}</strong> · Tutor: <strong>{data.clientName}</strong>
              </span>
            </Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => {
                  setRecipientEmail(e.target.value);
                  setSentSuccess(false);
                }}
                placeholder="ejemplo@correo.com"
                className="h-9 text-xs bg-card"
              />
              <Button
                onClick={handleSendEmail}
                disabled={sending}
                className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4"
              >
                {sending ? (
                  "Enviando..."
                ) : sentSuccess ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Enviado
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-1" /> Enviar Correo
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Live Preview Container (Dark Nexus Theme) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Vista Previa Real del Correo:
              </span>
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" onClick={handleCopyHtml} className="h-7 text-xs gap-1">
                  <Copy className="h-3 w-3" /> Copiar HTML
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenGmailWeb}
                  className="h-7 text-xs gap-1 border-dashed text-primary hover:text-primary"
                >
                  <ExternalLink className="h-3 w-3" /> Abrir en Gmail Web
                </Button>
              </div>
            </div>

            <div className="border rounded-2xl overflow-hidden shadow-inner bg-[#0b111e] p-2">
              <iframe
                title="Preview"
                srcDoc={htmlPreview}
                className="w-full h-[380px] rounded-xl border-0 bg-transparent"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t flex flex-row items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Diseño corporativo con botón para añadir al calendario y acceso al Portal.
          </span>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
