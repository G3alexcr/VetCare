import React from "react";
import { Link } from "@tanstack/react-router";
import {
  PawPrint,
  CalendarDays,
  Hospital,
  DollarSign,
  TrendingUp,
  Activity,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePets } from "@/lib/pets-store";
import { useClientes } from "@/lib/clientes-store";
import { useAppointments } from "@/lib/store";
import { useHospitalRooms } from "@/lib/hospital-store";
import { useInvoices, useCashSessions } from "@/lib/billing-store";

export function DashboardKpis() {
  const pets = usePets();
  const clientes = useClientes();
  const appointments = useAppointments();
  const rooms = useHospitalRooms();
  const invoices = useInvoices();
  const sessions = useCashSessions();

  const today = new Date().toISOString().split("T")[0];

  // Citas de hoy
  const todayAppts = appointments.filter((a) => a.date === today);
  const confirmedCount = todayAppts.filter((a) => a.status === "Confirmada").length;
  const inProgressCount = todayAppts.filter((a) => a.status === "En atención").length;
  const finishedCount = todayAppts.filter((a) => a.status === "Finalizada").length;
  const upcomingCount = appointments.filter((a) => a.date > today).length;

  // Hospitalización y semáforo
  const occupiedRooms = rooms.filter((r) => r.status === "Ocupada");
  const totalRooms = rooms.length || 1;
  const occupancyPercent = Math.round((occupiedRooms.length / totalRooms) * 100);

  // Estimación de semáforo de criticidad de hospitalizados
  const criticalCount = occupiedRooms.filter((r) => r.type === "UCI" || r.notes.toLowerCase().includes("crítico")).length;
  const careCount = occupiedRooms.filter((r) => r.type === "Aislamiento" || r.notes.toLowerCase().includes("observación")).length;
  const stableCount = Math.max(0, occupiedRooms.length - criticalCount - careCount);

  // Facturación de hoy
  const todayInvoices = invoices.filter((i) => i.date === today && i.status === "Emitida");
  const todayTotal = todayInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
  const openSession = sessions.find((s) => !s.closedAt);

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      {/* KPI 1: Mascotas y Clientes Activos */}
      <Card className="p-4 sm:p-4.5 bg-card border-border/80 hover:shadow-md transition-all">
        <div className="flex items-start justify-between">
          <div className="h-9.5 w-9.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 grid place-items-center">
            <PawPrint className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <TrendingUp className="h-3 w-3" />
            <span>+12% mes</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{pets.length}</span>
            <span className="text-xs text-muted-foreground font-medium">pacientes</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span>{clientes.length} tutores registrados</span>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Población activa</span>
            <Link to="/mascotas" className="text-primary hover:underline font-medium">
              Ver lista →
            </Link>
          </div>
        </div>
      </Card>

      {/* KPI 2: Citas y Consultas de Hoy */}
      <Card className="p-4 sm:p-4.5 bg-card border-border/80 hover:shadow-md transition-all">
        <div className="flex items-start justify-between">
          <div className="h-9.5 w-9.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 grid place-items-center">
            <CalendarDays className="h-5 w-5" />
          </div>
          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
            Hoy
          </Badge>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{todayAppts.length}</span>
            <span className="text-xs text-muted-foreground font-medium">agendadas</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{confirmedCount} confirmadas</span>
            <span>•</span>
            <span>{inProgressCount} en atención</span>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{upcomingCount} próximos 7 días</span>
            <Link to="/agenda" className="text-primary hover:underline font-medium">
              Ver agenda →
            </Link>
          </div>
        </div>
      </Card>

      {/* KPI 3: Hospitalización y Semáforo de Ocupación */}
      <Card className="p-4 sm:p-4.5 bg-card border-border/80 hover:shadow-md transition-all">
        <div className="flex items-start justify-between">
          <div className="h-9.5 w-9.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 grid place-items-center">
            <Hospital className="h-5 w-5" />
          </div>
          <div className="text-[11px] font-semibold text-violet-700 dark:text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-full">
            {occupancyPercent}% ocupado
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {occupiedRooms.length} <span className="text-base text-muted-foreground font-normal">/ {rooms.length}</span>
            </span>
            <span className="text-xs text-muted-foreground font-medium">jaulas</span>
          </div>

          {/* Semáforo visual */}
          <div className="mt-1 flex items-center gap-2 text-[10px]">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {stableCount} Estables
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {careCount} Cuidado
            </span>
            {criticalCount > 0 && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  {criticalCount} UCI
                </span>
              </>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Camas disponibles: {rooms.length - occupiedRooms.length}</span>
            <Link to="/hospitalizacion" className="text-primary hover:underline font-medium">
              Gestión jaulas →
            </Link>
          </div>
        </div>
      </Card>

      {/* KPI 4: Facturación & Caja del Día */}
      <Card className="p-4 sm:p-4.5 bg-card border-border/80 hover:shadow-md transition-all">
        <div className="flex items-start justify-between">
          <div className="h-9.5 w-9.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 grid place-items-center">
            <DollarSign className="h-5 w-5" />
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] ${
              openSession
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
            }`}
          >
            {openSession ? "Caja Abierta" : "Caja Cerrada"}
          </Badge>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              ${todayTotal.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-muted-foreground font-medium">hoy</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {todayInvoices.length} comprobantes emitidos hoy
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Cierre disponible</span>
            <Link to="/facturacion" className="text-primary hover:underline font-medium">
              Ir a caja →
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
