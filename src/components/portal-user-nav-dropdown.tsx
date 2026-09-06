import { useNavigate } from "@tanstack/react-router";
import { usePortalAuth } from "@/lib/portal-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, PawPrint, Calendar, LogOut } from "lucide-react";

export function PortalUserNavDropdown({ className }: { className?: string }) {
  const { owner, logout } = usePortalAuth();
  const navigate = useNavigate();

  if (!owner) return null;

  const initials = owner.fullName
    ? owner.fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "CL";

  const handleLogout = () => {
    logout();
    navigate({ to: "/portal/login" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`relative rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-transform active:scale-95 ${
            className ?? ""
          }`}
          aria-label="Menú del cliente"
        >
          <Avatar className="h-9 w-9 border border-border/80 shadow-xs cursor-pointer">
            {owner.avatarUrl && (
              <AvatarImage src={owner.avatarUrl} alt={owner.fullName} className="object-cover" />
            )}
            <AvatarFallback className="bg-emerald-600 text-white font-semibold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 p-2 shadow-xl border-border rounded-xl" align="end">
        {/* Cabecera del Usuario Cliente */}
        <div className="flex items-center gap-3 p-2 bg-muted/40 rounded-lg">
          <Avatar className="h-10 w-10 border border-border shadow-xs">
            {owner.avatarUrl && (
              <AvatarImage src={owner.avatarUrl} alt={owner.fullName} className="object-cover" />
            )}
            <AvatarFallback className="bg-emerald-600 text-white font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm text-foreground truncate leading-tight">
              {owner.fullName}
            </div>
            {owner.email && (
              <div className="text-[11px] text-muted-foreground truncate" title={owner.email}>
                {owner.email}
              </div>
            )}
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-0.5">
              PROPIETARIO DE MASCOTA
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="my-1.5" />

        {/* Acciones del Cliente */}
        <DropdownMenuItem
          onClick={() => navigate({ to: "/portal/perfil" })}
          className="cursor-pointer py-2 px-2.5 text-xs font-medium rounded-lg"
        >
          <User className="h-4 w-4 mr-2 text-muted-foreground" />
          Mi Perfil
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => navigate({ to: "/portal/mascotas" })}
          className="cursor-pointer py-2 px-2.5 text-xs font-medium rounded-lg"
        >
          <PawPrint className="h-4 w-4 mr-2 text-muted-foreground" />
          Mis Mascotas
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => navigate({ to: "/portal/agenda" })}
          className="cursor-pointer py-2 px-2.5 text-xs font-medium rounded-lg"
        >
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          Mis Citas Médicas
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1.5" />

        {/* Cerrar Sesión */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer py-2 px-2.5 text-xs font-medium text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
