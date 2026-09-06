import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useUserProfile } from "@/lib/user-profile-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, Stethoscope, ExternalLink, Heart, Shield } from "lucide-react";
import { toast } from "sonner";

export function UserNavDropdown({ className }: { className?: string }) {
  const { user, logout, simulatedRole, setSimulatedRole } = useAuth();
  const navigate = useNavigate();
  const profile = useUserProfile();

  if (!user) return null;

  const roleDisplay =
    user.role === "super"
      ? "SUPER ADMIN"
      : user.role === "admin"
      ? "ADMINISTRADOR"
      : user.role === "vet"
      ? "VETERINARIO"
      : "RECEPCIÓN";

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  const displayName = profile.nombre ? `${profile.nombre} ${profile.apellidos}`.trim() : user.name;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`relative rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer ${className ?? ""}`}
          title={displayName}
        >
          <Avatar className="h-9 w-9 border border-border/60 overflow-hidden bg-primary/10">
            {profile.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : null}
            <AvatarFallback className="bg-primary/15 text-primary font-semibold text-xs">
              {displayName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("") || "U"}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56 p-2 shadow-xl border-border rounded-2xl" align="end">
        {/* Cabecera del Usuario */}
        <div className="flex items-center gap-3 p-2.5">
          <Avatar className="h-10 w-10 border border-primary/20 shadow-xs overflow-hidden bg-primary/10">
            {profile.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : null}
            <AvatarFallback className="bg-primary/15 text-primary font-bold text-sm">
              {displayName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("") || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm text-foreground truncate leading-tight">
              {displayName}
            </div>
            {user.email && (
              <div className="text-[11px] text-muted-foreground truncate" title={user.email}>
                {user.email}
              </div>
            )}
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
              {roleDisplay}
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="my-1.5" />

        {/* Acciones principales */}
        <DropdownMenuItem
          onClick={() => navigate({ to: "/perfil" })}
          className="cursor-pointer py-2 px-2.5 text-xs font-medium rounded-lg"
        >
          <User className="h-4 w-4 mr-2 text-muted-foreground" />
          Perfil
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => navigate({ to: "/ajustes" })}
          className="cursor-pointer py-2 px-2.5 text-xs font-medium rounded-lg"
        >
          <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
          Configuración
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1.5" />

        {/* Alternar vistas para pruebas y demostración */}
        <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Vistas del Sistema
        </div>

        <DropdownMenuItem
          onClick={() => {
            if (simulatedRole === "vet") {
              setSimulatedRole(null);
              toast.success("Vista: Super Administrador restaurada");
            } else {
              setSimulatedRole("vet");
              toast.success("Vista: Doctor Veterinario activada");
              navigate({ to: "/dashboard" });
            }
          }}
          className="cursor-pointer py-2 px-2.5 text-xs font-medium rounded-lg"
        >
          {simulatedRole === "vet" ? (
            <>
              <Shield className="h-4 w-4 mr-2 text-indigo-500" />
              Volver a Super Admin
            </>
          ) : (
            <>
              <Stethoscope className="h-4 w-4 mr-2 text-emerald-500" />
              Ver como Dr. Veterinario
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            const saved = localStorage.getItem("vetcare_portal_owner");
            if (!saved) {
              const defaultOwner = {
                id: "cl_1",
                fullName: "María Rodríguez",
                identification: "1712345678",
                phone: "+593 99 111 2233",
                whatsapp: "+593 99 111 2233",
                email: "maria@gmail.com",
                address: "Av. Principal 123",
                registeredAt: new Date().toISOString(),
                notes: "",
              };
              localStorage.setItem("vetcare_portal_owner", JSON.stringify(defaultOwner));
            }
            window.open("/portal/dashboard", "_blank");
          }}
          className="cursor-pointer py-2 px-2.5 text-xs font-medium rounded-lg text-emerald-700 dark:text-emerald-400"
        >
          <Heart className="h-4 w-4 mr-2 text-rose-500" />
          Ver Portal del Cliente
          <ExternalLink className="h-3 w-3 ml-auto opacity-60" />
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
