import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  PawPrint,
  Calendar,
  Bell,
  User,
  LogOut,
  Menu,
  Heart,
  ShoppingBag,
  MessageCircle,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { usePortalAuth } from "@/lib/portal-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OfflineBanner } from "@/components/offline-banner";
import { DataHydrator } from "@/components/data-hydrator";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsMenu } from "@/components/notifications-menu";
import { PortalUserNavDropdown } from "@/components/portal-user-nav-dropdown";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { PortalAIAssistant } from "@/components/portal-ai-assistant";

const nav = [
  { to: "/portal/dashboard", label: "Inicio", icon: LayoutDashboard },
  { to: "/portal/agenda", label: "Citas Médicas", icon: Calendar },
  { to: "/tienda", label: "Tienda y Farmacia", icon: ShoppingBag },
] as const;

export function PortalLayout({ children }: { children?: ReactNode }) {
  const { owner, ready, logout } = usePortalAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ready && !owner) navigate({ to: "/portal/login", replace: true });
  }, [ready, owner, navigate]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/portal/login" });
  };

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-muted-foreground text-sm">Cargando portal...</div>
      </div>
    );
  }
  if (!owner) return null;

  return (
    <>
      <DataHydrator />
      <div className="min-h-screen flex w-full bg-background">
      <aside
        className={`${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static z-40 inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-200 flex flex-col safe-top safe-bottom`}
      >
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-xl bg-white text-emerald-600 grid place-items-center shadow-xs">
            <PawPrint className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-sidebar-foreground leading-none">VetCare</div>
            <div className="text-[11px] text-white/70 mt-1 font-medium">Portal Propietario</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
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
        </nav>

        {/* Contacto Directo y Urgencias */}
        <div className="p-3 border-t border-sidebar-border/60">
          <div className="p-3 rounded-xl bg-white/10 text-sidebar-foreground space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <MessageCircle className="h-4 w-4 text-emerald-300" />
              ¿Urgencia con tu mascota?
            </div>
            <p className="text-[11px] text-white/75 leading-tight">
              Comunícate directamente con la clínica o solicita atención prioritaria.
            </p>
            <a
              href="https://wa.me/593991112233?text=Hola%2C%20necesito%20atenci%C3%B3n%20para%20mi%20mascota"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center w-full px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs transition-colors gap-1.5 shadow-xs"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp Clínica
            </a>
          </div>
        </div>

        <div className="p-3 border-t border-sidebar-border space-y-3">
          <PwaInstallButton />

          <div className="pt-1">
            <div className="flex items-center gap-3 px-2 py-1.5">
              <Avatar className="h-9 w-9 ring-1 ring-white/20">
                {owner.avatarUrl && (
                  <AvatarImage src={owner.avatarUrl} alt={owner.fullName} className="object-cover" />
                )}
                <AvatarFallback className="bg-white/15 text-white text-sm font-semibold">
                  {owner.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-foreground truncate">{owner.fullName}</div>
                <div className="text-xs text-white/70 truncate">{owner.email}</div>
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="min-h-16 border-b bg-card flex items-center px-4 md:px-6 gap-3 sticky top-0 z-20 safe-top py-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1 font-semibold text-sm sm:text-base">Portal del Propietario</div>

          {/* Controles superiores derechos para el cliente */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <NotificationsMenu />
            <PortalUserNavDropdown />
          </div>
        </header>
        <OfflineBanner />
        <main className="flex-1 p-4 md:p-8 overflow-auto">{children ?? <Outlet />}</main>
      </div>
      <PortalAIAssistant />
      </div>
    </>
  );
}
