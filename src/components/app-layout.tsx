import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  PawPrint,
  Calendar,
  Stethoscope,
  Settings,
  LogOut,
  Menu,
  Bell,
  Search,
  Wallet,
  MessageCircle,
  Building2,
  Receipt,
  Boxes,
  Shield,
  Hospital,
  BriefcaseMedical,
  Sparkles,
  Bone,
  ShoppingCart,
  Store,
  LayoutGrid,
  ArrowLeft,
  Globe,
  UserCog,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserProfile } from "@/lib/user-profile-store";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCan, useCurrentRoleId } from "@/lib/rbac";
import type { RbacModule } from "@/lib/rbac-store";
import { useCurrentClinicId, setCurrentClinic, usePlanCapabilities, useActingClinicId, setActingClinic } from "@/lib/saas-store";
import { useMyClinics } from "@/hooks/use-my-clinics";
import { useVaccineReminders } from "@/hooks/use-vaccine-reminders";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { VetCareAIFloating } from "@/components/vetcare-ai";
import { OfflineBanner } from "@/components/offline-banner";
import { SubscriptionBanner, SubscriptionGate } from "@/components/subscription-status";
import { DataHydrator } from "@/components/data-hydrator";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsMenu } from "@/components/notifications-menu";
import { UserNavDropdown } from "@/components/user-nav-dropdown";
import { PwaInstallButton } from "@/components/pwa-install-button";

const nav: Array<{ to: string; label: string; icon: typeof LayoutDashboard; module: RbacModule; planKey?: "pos" | "tienda"; configureOnly?: boolean }> = [
  { to: "/admin", label: "Centro de Mando", icon: LayoutGrid, module: "clinicas", configureOnly: true },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
  { to: "/clientes", label: "Clientes", icon: Users, module: "clientes" },
  { to: "/mascotas", label: "Mascotas", icon: PawPrint, module: "mascotas" },
  { to: "/agenda", label: "Agenda", icon: Calendar, module: "agenda" },
  { to: "/consultas", label: "Consultas", icon: Stethoscope, module: "consultas" },
  { to: "/hospitalizacion", label: "Hospital", icon: Hospital, module: "hospitalizacion" },
  { to: "/caja", label: "Caja", icon: Wallet, module: "caja" },
  { to: "/facturacion", label: "Facturación", icon: Receipt, module: "facturacion" },
  { to: "/punto-venta", label: "Punto de Venta", icon: ShoppingCart, module: "punto_venta", planKey: "pos" },
  { to: "/pos-online", label: "Tienda Online", icon: Store, module: "punto_venta", planKey: "tienda" },
  { to: "/inventario", label: "Inventario", icon: Boxes, module: "inventario" },
  { to: "/automatizacion", label: "Automatización", icon: MessageCircle, module: "automatizacion" },
  { to: "/veterinarios", label: "Veterinarios", icon: BriefcaseMedical, module: "veterinarios" },
  { to: "/servicios", label: "Servicios", icon: Sparkles, module: "servicios" },
  { to: "/especies", label: "Especies", icon: Bone, module: "especies" },
  { to: "/clinicas", label: "Multi-Clínica", icon: Building2, module: "clinicas" },
  { to: "/usuarios", label: "Usuarios", icon: UserCog, module: "roles" },
  { to: "/roles", label: "Roles y Permisos", icon: Shield, module: "roles" },
  { to: "/configuracion", label: "Configuración", icon: Settings, module: "configuracion" },
  { to: "/website", label: "Sitio Web", icon: Globe, module: "configuracion" },
];

const roleLabel: Record<string, string> = {
  super: "Super Admin",
  admin: "Administrador",
  vet: "Veterinario",
  reception: "Recepción",
};

export function AppLayout({ children }: { children?: ReactNode }) {
  const { user, ready, logout, simulatedRole, setSimulatedRole } = useAuth();
  const profile = useUserProfile();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const can = useCan();
  const roleId = useCurrentRoleId();
  const isSuper = roleId === "role_super";
  const actingClinicId = useActingClinicId();
  const caps = usePlanCapabilities();
  const myClinics = useMyClinics();
  const currentClinicId = useCurrentClinicId();
  const activeClinic = myClinics.find((c) => c.id === currentClinicId);

  // Notifica (push) cuando hay vacunas/desparasitaciones próximas o vencidas.
  useVaccineReminders();

  const visibleNav = useMemo(
    () =>
      nav.filter(
        (item) =>
          can(item.module, "view") &&
          (!item.planKey || (item.planKey === "pos" ? caps.posEnabled : caps.tiendaOnlineEnabled)) &&
          // En modo clínica nunca se muestran los ítems de plataforma (Centro de Mando).
          !item.configureOnly,
      ),
    [can, caps.posEnabled, caps.tiendaOnlineEnabled],
  );
  const currentModule = useMemo(
    () => nav.find((n) => pathname === n.to || pathname.startsWith(n.to + "/"))?.module,
    [pathname]
  );
  const allowed = !currentModule || can(currentModule, "view");

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login", replace: true });
  }, [navigate, ready, user]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-muted-foreground text-sm">Cargando VetCare...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <DataHydrator />
      <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static z-40 inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-200 flex flex-col safe-top safe-bottom`}
      >
        <div className="flex flex-col items-center justify-center gap-2.5 px-4 py-6 border-b border-sidebar-border">
          {activeClinic ? (
            activeClinic.logoUrl ? (
              <div className="h-28 w-28 rounded-3xl overflow-hidden bg-white grid place-items-center shadow-lg">
                <img src={activeClinic.logoUrl} alt={activeClinic.name} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="h-28 w-28 rounded-3xl bg-white text-primary grid place-items-center font-bold text-5xl shadow-lg">{activeClinic.name.charAt(0).toUpperCase()}</div>
            )
          ) : (
            <div className="h-28 w-28 rounded-3xl bg-white text-primary grid place-items-center font-bold text-5xl shadow-lg">SA</div>
          )}
          <div className="text-white font-extrabold text-2xl text-center leading-tight w-full whitespace-normal break-words px-2">{activeClinic?.name ?? "VetCare Plataforma"}</div>
          <div className="text-white/70 text-sm text-center">{activeClinic ? "Clínica veterinaria" : "Administración de clínicas"}</div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          {visibleNav.length === 0 && (
            <div className="text-xs text-muted-foreground px-3 py-4">
              Tu rol no tiene módulos habilitados.
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-3">
          <PwaInstallButton />

          <div className="pt-1">
            <div className="flex items-center gap-3 px-2 py-1.5">
              <Avatar className="h-9 w-9 ring-1 ring-white/20">
                {profile.avatarUrl && (
                  <AvatarImage src={profile.avatarUrl} alt={profile.fullName || user?.name} className="object-cover" />
                )}
                <AvatarFallback className="bg-white/15 text-white text-sm font-semibold">
                  {(profile.fullName || user?.name || "U").split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile.fullName || user?.name}
                </div>
                <div className="text-xs text-white/70 truncate">
                  {profile.specialty || (user ? roleLabel[user.role] : "")}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start mt-1 text-white hover:bg-white/10 hover:text-white">
              <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
            </Button>
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="min-h-16 border-b bg-card flex items-center px-4 md:px-6 gap-3 sm:gap-4 sticky top-0 z-20 safe-top py-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1 max-w-md relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar clientes, mascotas..." className="pl-9 bg-muted/50 border-0" />
          </div>

          {/* Controles superiores derechos para todos los usuarios */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {inClinicMode && (
              <div className="hidden lg:block">
                <Select value={currentClinicId} onValueChange={(v) => { setCurrentClinic(v); toast.success("Clínica activa actualizada"); }}>
                  <SelectTrigger className="w-[180px] h-9 text-xs">
                    <Building2 className="h-3.5 w-3.5 mr-1 text-primary" />
                    <SelectValue placeholder="Clínica" />
                  </SelectTrigger>
                  <SelectContent>
                    {myClinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <ThemeToggle />
            <NotificationsMenu />
            <UserNavDropdown />
          </div>
        </header>
        {simulatedRole && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-2 text-xs flex items-center justify-between text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/20 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold">
                Vista de Demostración
              </Badge>
              <span>
                Estás visualizando la app con la vista del <strong>{roleLabel[simulatedRole] ?? simulatedRole}</strong> ({user?.name}). Las opciones administrativas están restringidas.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-900 dark:text-emerald-100"
                onClick={() => {
                  setSimulatedRole(null);
                  toast.success("Has regresado a la vista de Super Administrador");
                }}
              >
                Volver a Super Admin
              </Button>
            </div>
          </div>
        )}
        {isSuper && actingClinicId && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs flex items-center justify-between text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-amber-500/20 border-amber-500/40 text-amber-800 dark:text-amber-300 text-[10px] font-medium">
                Modo Soporte
              </Badge>
              <span>Estás gestionando la clínica: <strong>{activeClinic?.name ?? "Clínica"}</strong></span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-amber-500/40 hover:bg-amber-500/20"
              onClick={() => { setActingClinic(null); navigate({ to: "/admin" }); }}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Volver al Centro de Mando
            </Button>
          </div>
        )}
        <OfflineBanner />
        <SubscriptionBanner />
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {allowed ? (
            <SubscriptionGate>{children ?? <Outlet />}</SubscriptionGate>
          ) : (
            <div className="min-h-[60vh] grid place-items-center">
              <div className="max-w-md text-center space-y-3 p-8 rounded-xl border bg-card">
                <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 text-destructive grid place-items-center">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold">Acceso restringido</h2>
                <p className="text-sm text-muted-foreground">
                  Tu rol no tiene permiso para ver este módulo. Contacta al administrador si necesitas acceso.
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
                  Volver al Dashboard
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
      <VetCareAIFloating />
      </div>
    </>
  );
}
