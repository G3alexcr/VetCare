import { useEffect } from "react";
import { useVaccines, useDewormings } from "@/lib/store";
import { buildReminders, requestNotificationPermission, notify } from "@/lib/notifications";
import { toast } from "sonner";

const firedThisSession = new Set<string>();

// Dispara una notificación (push) cuando hay vacunas/desparasitaciones próximas a vencer o vencidas.
export function useVaccineReminders() {
  const vaccines = useVaccines();
  const dewormings = useDewormings();

  // clave de sesión para no repetir el aviso con la misma data.
  const key = vaccines.map((v) => v.id).join(",") + "|" + dewormings.map((d) => d.id).join(",");

  useEffect(() => {
    const reminders = buildReminders(vaccines, dewormings);
    if (reminders.length === 0) return;

    const fresh = reminders.filter((r) => !firedThisSession.has(r.tag));
    if (fresh.length === 0) return;

    let cancelled = false;
    (async () => {
      const granted = await requestNotificationPermission();
      if (cancelled) return;
      for (const r of fresh) {
        firedThisSession.add(r.tag);
        if (granted) notify(r.title, r.body, r.tag);
        // Aviso visible dentro de la app también (respaldo).
        toast.warning(r.title, { description: r.body, duration: 7000 });
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
