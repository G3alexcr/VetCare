import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { QuickActionBar } from "@/components/dashboard/QuickActionBar";
import { DashboardKpis } from "@/components/dashboard/DashboardKpis";
import { LiveClinicBoard } from "@/components/dashboard/LiveClinicBoard";
import { DashboardAnalyticsCharts } from "@/components/dashboard/DashboardAnalyticsCharts";
import { ClinicalAlertsTray } from "@/components/dashboard/ClinicalAlertsTray";
import { useCurrentClinicId } from "@/lib/saas-store";
import { useMyClinics } from "@/hooks/use-my-clinics";
import { Stethoscope, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard Clínico — Go2Vet" }] }),
  component: () => (
    <AppLayout>
      <DashboardPage />
    </AppLayout>
  ),
});

function DashboardPage() {
  const currentClinicId = useCurrentClinicId();
  const myClinics = useMyClinics();
  const activeClinic = myClinics.find((c) => c.id === currentClinicId);
  const clinicName = activeClinic?.name || "Paws Pattient";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Encabezado Clínico y Bienvenida */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Centro de Mando Clínico</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              En Vivo
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gestión médica, flujo de pacientes y alertas operativas de <strong>{clinicName}</strong>
          </p>
        </div>
      </div>

      {/* 2. Barra de Acciones Rápidas & Buscador Universal */}
      <QuickActionBar />

      {/* 3. Fila Superior de KPIs (Conservada y Potenciada con Semáforo y Caja) */}
      <DashboardKpis />

      {/* 4. Flujo Operativo en Tiempo Real (Agenda, Hospitalización con Semáforo y Quirófano) */}
      <LiveClinicBoard />

      {/* 5. Estadísticas Gráficas Interactivas (Recharts: Tendencia Semanal y Distribución por Especies) */}
      <DashboardAnalyticsCharts />

      {/* 6. Bandeja de Urgencias, Alertas Sanitarias (WhatsApp) & Notificaciones */}
      <ClinicalAlertsTray />
    </div>
  );
}
