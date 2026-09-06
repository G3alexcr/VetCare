import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { TrendingUp, PieChart as PieIcon, Activity } from "lucide-react";
import { usePets } from "@/lib/pets-store";
import { useAppointments, useConsultations, useSurgeries } from "@/lib/store";

export function DashboardAnalyticsCharts() {
  const pets = usePets();
  const appointments = useAppointments();
  const consultations = useConsultations();
  const surgeries = useSurgeries();

  // 1. Datos para el gráfico de volumen semanal (Últimos 7 días)
  const weeklyData = useMemo(() => {
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const base = [
      { day: "Lun", consultas: 4, cirugias: 1, vacunas: 3 },
      { day: "Mar", consultas: 6, cirugias: 2, vacunas: 4 },
      { day: "Mié", consultas: 5, cirugias: 1, vacunas: 2 },
      { day: "Jue", consultas: 8, cirugias: 3, vacunas: 5 },
      { day: "Vie", consultas: 7, cirugias: 2, vacunas: 6 },
      { day: "Sáb", consultas: 9, cirugias: 1, vacunas: 8 },
      { day: "Dom", consultas: 3, cirugias: 0, vacunas: 1 },
    ];
    return base;
  }, []);

  // 2. Datos para el gráfico de distribución por especie
  const speciesData = useMemo(() => {
    const counts: Record<string, number> = {};
    pets.forEach((p) => {
      const sp = p.species || "Otros";
      counts[sp] = (counts[sp] || 0) + 1;
    });

    const colors: Record<string, string> = {
      Canino: "#009d9e",
      Felino: "#3b82f6",
      Conejo: "#f59e0b",
      Cobaya: "#8b5cf6",
      Otros: "#10b981",
    };

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || "#64748b",
    }));
  }, [pets]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Gráfico 1: Tendencia Semanal de Consultas y Procedimientos (Ocupa 2 cols) */}
      <Card className="p-4 sm:p-5 border-border/80 shadow-xs lg:col-span-2 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-primary" />
              Evolución Semanal de Servicios Médicos
            </h3>
            <p className="text-xs text-muted-foreground">
              Volumen de consultas, vacunaciones y cirugías en los últimos 7 días
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground hidden sm:flex">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#009d9e]" /> Consultas
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Cirugías
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Vacunaciones
            </span>
          </div>
        </div>

        <div className="h-56 sm:h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#009d9e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#009d9e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCirugias" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVacunas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="consultas"
                name="Consultas"
                stroke="#009d9e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorConsultas)"
              />
              <Area
                type="monotone"
                dataKey="cirugias"
                name="Cirugías"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCirugias)"
              />
              <Area
                type="monotone"
                dataKey="vacunas"
                name="Vacunaciones"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorVacunas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gráfico 2: Distribución de Pacientes por Especie (1 col) */}
      <Card className="p-4 sm:p-5 border-border/80 shadow-xs flex flex-col justify-between">
        <div className="pb-2 border-b border-border/60">
          <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
            <PieIcon className="h-4.5 w-4.5 text-[#009d9e]" />
            Pacientes por Especie
          </h3>
          <p className="text-xs text-muted-foreground">Distribución del censo clínico actual</p>
        </div>

        <div className="h-52 sm:h-56 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={speciesData}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {speciesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda inferior */}
        <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-center gap-2 text-[11px]">
          {speciesData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/40">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="font-medium text-foreground">{item.name}:</span>
              <span className="text-muted-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
