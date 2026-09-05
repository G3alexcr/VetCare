// Notificaciones del navegador (push local) + recordatorios de vacunas/desparasitación.
// Para push real en segundo plano (app cerrada) se necesita un proveedor push con VAPID;
// el service worker /sw.js ya tiene el listener `push`, dejándolo listo para eso.

import type { Vaccine, Deworming } from "./store";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const res = await Notification.requestPermission();
  return res === "granted";
}

export function notify(title: string, body: string, tag?: string) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, tag, icon: "/icons/icon-192.png" });
  } catch {
    /* noop */
  }
}

export type Reminder = { title: string; body: string; tag: string };

// Devuelve recordatorios para vacunas/desparasitaciones próximas o vencidas.
export function buildReminders(vaccines: Vaccine[], dewormings: Deworming[]): Reminder[] {
  const out: Reminder[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const v of vaccines) {
    if (!v.nextDueDate) continue;
    const due = new Date(v.nextDueDate);
    const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    if (days > 15) continue; // solo próximas a vencer (<=15 días) o vencidas
    const vencida = days < 0;
    out.push({
      tag: `vac-${v.id}`,
      title: vencida ? "💉 Vacuna vencida" : "💉 Vacuna próxima",
      body: `${v.vaccineName} ${vencida ? `vencida hace ${Math.abs(days)} día(s)` : `en ${days} día(s)`}. Próxima dosis: ${v.nextDueDate}${v.veterinarian ? ` · ${v.veterinarian}` : ""}`,
    });
  }

  for (const d of dewormings) {
    if (!d.nextApplicationDate) continue;
    const due = new Date(d.nextApplicationDate);
    const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    if (days > 15) continue;
    const vencida = days < 0;
    out.push({
      tag: `dew-${d.id}`,
      title: vencida ? "🪱 Desparasitación vencida" : "🪱 Desparasitación próxima",
      body: `${d.productName} · ${vencida ? `vencida hace ${Math.abs(days)} día(s)` : `en ${days} día(s)`}. Próxima: ${d.nextApplicationDate}`,
    });
  }

  return out;
}

export function reminderText(r: Reminder): string {
  return `${r.title}\n${r.body}`;
}
