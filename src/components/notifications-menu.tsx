import { useMemo } from "react";
import { Bell, Calendar, Syringe, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useVaccines, useDewormings } from "@/lib/store";
import { buildReminders, requestNotificationPermission, notificationsSupported } from "@/lib/notifications";
import { toast } from "sonner";

export function NotificationsMenu({ className }: { className?: string }) {
  const vaccines = useVaccines();
  const dewormings = useDewormings();

  const reminders = useMemo(() => {
    return buildReminders(vaccines, dewormings);
  }, [vaccines, dewormings]);

  const handleEnablePush = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast.success("Notificaciones del navegador activadas");
    } else {
      toast.error("Permiso denegado por el navegador");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative h-9 w-9 text-foreground/80 hover:text-foreground ${className ?? ""}`}
          title="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          {reminders.length > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-background animate-pulse" />
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-lg border-border" align="end">
        <div className="flex items-center justify-between p-3.5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notificaciones</span>
            {reminders.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                {reminders.length}
              </Badge>
            )}
          </div>
          {notificationsSupported() && typeof Notification !== "undefined" && Notification.permission !== "granted" && (
            <button
              onClick={handleEnablePush}
              className="text-[11px] text-primary hover:underline font-medium"
            >
              Activar alertas
            </button>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
          {reminders.length === 0 ? (
            <div className="py-8 text-center px-4 space-y-1.5">
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary mx-auto grid place-items-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium">Todo al día</p>
              <p className="text-[11px] text-muted-foreground">
                No tienes vacunas ni recordatorios vencidos o próximos.
              </p>
            </div>
          ) : (
            reminders.map((r) => (
              <div key={r.tag} className="p-3 text-xs hover:bg-muted/40 transition-colors space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-foreground">
                  <Syringe className="h-3.5 w-3.5 text-primary" />
                  {r.title}
                </div>
                <p className="text-muted-foreground leading-relaxed text-[11px]">{r.body}</p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
