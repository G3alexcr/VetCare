import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online";

/**
 * Banner visible solo cuando el dispositivo pierde conexión.
 * La app sigue funcionando con los datos sincronizados localmente.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      className="bg-muted border-b px-4 py-2 flex items-center justify-center gap-2 text-xs md:text-sm text-muted-foreground"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>
        Sin conexión — estás viendo la información sincronizada. Los cambios se
        guardarán y sincronizarán al volver internet.
      </span>
    </div>
  );
}
