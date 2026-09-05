import { createFileRoute } from "@tanstack/react-router";
import { Bell, Calendar, Syringe, FileText, Gift, Pill } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PortalLayout } from "@/components/portal-layout";
import { usePortalAuth } from "@/lib/portal-auth";
import { usePets } from "@/lib/pets-store";
import { useAppointments, useVaccines, useDewormings } from "@/lib/store";

export const Route = createFileRoute("/portal/notificaciones")({
  head: () => ({ meta: [{ title: "Notificaciones — Portal" }] }),
  component: () => (
    <PortalLayout>
      <PortalNotificationsPage />
    </PortalLayout>
  ),
});

type NotifType = "Cita" | "Vacuna" | "Desparasitación" | "Resultado" | "Promoción";
type Notif = { id: string; type: NotifType; title: string; desc: string; date: string; icon: typeof Bell; tint: string };

function PortalNotificationsPage() {
  const { owner } = usePortalAuth();
  const pets = usePets();
  const appointments = useAppointments();
  const vaccines = useVaccines();
  const dewormings = useDewormings();
  if (!owner) return null;

  const petIds = new Set(pets.filter((p) => p.clientId === owner.id).map((p) => p.id));
  const today = new Date().toISOString().split("T")[0];

  const items: Notif[] = [];

  appointments
    .filter((a) => petIds.has(a.petId) && a.date >= today && a.status !== "Cancelada")
    .forEach((a) =>
      items.push({
        id: `apt-${a.id}`, type: "Cita",
        title: a.date === today ? "Tienes una cita hoy" : "Próxima cita",
        desc: `${a.date} ${a.time} — ${a.reason}`,
        date: a.date, icon: Calendar, tint: "bg-sky-500/10 text-sky-600",
      })
    );

  vaccines
    .filter((v) => petIds.has(v.petId) && v.nextDueDate >= today)
    .forEach((v) =>
      items.push({
        id: `vac-${v.id}`, type: "Vacuna",
        title: "Recordatorio de vacuna",
        desc: `${v.vaccineName} — próxima aplicación ${v.nextDueDate}`,
        date: v.nextDueDate, icon: Syringe, tint: "bg-violet-500/10 text-violet-600",
      })
    );

  dewormings
    .filter((d) => petIds.has(d.petId) && d.nextApplicationDate >= today)
    .forEach((d) =>
      items.push({
        id: `des-${d.id}`, type: "Desparasitación",
        title: "Desparasitación próxima",
        desc: `${d.productName} — ${d.nextApplicationDate}`,
        date: d.nextApplicationDate, icon: Pill, tint: "bg-amber-500/10 text-amber-600",
      })
    );

  items.push({
    id: "promo-1", type: "Promoción",
    title: "20% de descuento en baño y peluquería",
    desc: "Válido este mes presentando este mensaje en recepción.",
    date: today, icon: Gift, tint: "bg-pink-500/10 text-pink-600",
  });

  items.push({
    id: "res-1", type: "Resultado",
    title: "Resultado de laboratorio disponible",
    desc: "Panel bioquímico completo — descarga desde el expediente.",
    date: today, icon: FileText, tint: "bg-emerald-500/10 text-emerald-600",
  });

  const sorted = items.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Notificaciones</h1>
        <p className="text-muted-foreground text-sm">Recordatorios, resultados y novedades para tus mascotas.</p>
      </div>

      <Card className="divide-y">
        {sorted.map((n) => (
          <div key={n.id} className="p-4 flex items-start gap-3">
            <div className={`h-10 w-10 rounded-lg grid place-items-center shrink-0 ${n.tint}`}>
              <n.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-medium text-sm">{n.title}</div>
                <Badge variant="outline" className="text-xs">{n.type}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{n.desc}</div>
            </div>
            <div className="text-xs text-muted-foreground shrink-0">{n.date}</div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <Bell className="h-6 w-6 mx-auto mb-2 opacity-60" />
            No tienes notificaciones.
          </div>
        )}
      </Card>
    </div>
  );
}
