import { createFileRoute } from "@tanstack/react-router";
import { Users, PawPrint, CalendarDays, Clock, TrendingUp, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/app-layout";
import { type AppointmentStatus } from "@/lib/mock-data";
import { useClientes } from "@/lib/clientes-store";
import { usePets } from "@/lib/pets-store";
import { useVeterinarios } from "@/lib/veterinarios-store";
import { useAppointments } from "@/lib/store";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — VetCare" }] }),
  component: () => <AppLayout><DashboardPage /></AppLayout>,
});

const statusColors: Record<AppointmentStatus, string> = {
  "Pendiente": "bg-amber-100 text-amber-700 border-amber-200",
  "Confirmada": "bg-sky-100 text-sky-700 border-sky-200",
  "En atención": "bg-violet-100 text-violet-700 border-violet-200",
  "Finalizada": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Cancelada": "bg-rose-100 text-rose-700 border-rose-200",
};

function DashboardPage() {
  const pets = usePets();
  const clientes = useClientes();
  const vets = useVeterinarios();
  const appointments = useAppointments();
  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments
    .filter((a) => a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));
  const upcoming = appointments.filter((a) => a.date > today).length;

  const stats = [
    { label: "Mascotas registradas", value: pets.length, icon: PawPrint, accent: "bg-primary/10 text-primary", delta: "+12% este mes" },
    { label: "Clientes registrados", value: clientes.length, icon: Users, accent: "bg-sky-100 text-sky-700", delta: "+8% este mes" },
    { label: "Citas de hoy", value: todayAppts.length, icon: CalendarDays, accent: "bg-amber-100 text-amber-700", delta: `${todayAppts.filter(a => a.status==="Confirmada").length} confirmadas` },
    { label: "Próximas citas", value: upcoming, icon: Clock, accent: "bg-violet-100 text-violet-700", delta: "Próximos 7 días" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen general de la actividad de tu clínica.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-start justify-between">
                <div className={`h-10 w-10 rounded-lg grid place-items-center ${s.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                <div className="text-xs text-muted-foreground mt-2">{s.delta}</div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Agenda de hoy</h2>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <Badge variant="secondary">{todayAppts.length} citas</Badge>
          </div>
          <div className="space-y-2">
            {todayAppts.length === 0 && (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No hay citas programadas para hoy.
              </div>
            )}
            {todayAppts.map((a) => {
              const pet = pets.find((p) => p.id === a.petId);
              const client = clientes.find((c) => c.id === a.clientId);
              const vet = vets.find((v) => v.id === a.vetId);
              return (
                <div key={a.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors">
                  <div className="text-center w-14">
                    <div className="text-lg font-semibold leading-tight">{a.time}</div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                    {pet && <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{pet?.name} • {client?.fullName}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.reason} · {vet?.nombre}</div>
                  </div>
                  <Badge variant="outline" className={statusColors[a.status]}>{a.status}</Badge>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Actividad reciente</h2>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5" />
              <div>
                <div className="font-medium">Consulta finalizada</div>
                <div className="text-xs text-muted-foreground">Luna · hace 12 min</div>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="h-2 w-2 rounded-full bg-sky-500 mt-1.5" />
              <div>
                <div className="font-medium">Nueva cita confirmada</div>
                <div className="text-xs text-muted-foreground">Max · hace 1 h</div>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              <div>
                <div className="font-medium">Cliente registrado</div>
                <div className="text-xs text-muted-foreground">Lucía Vega · hoy</div>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5" />
              <div>
                <div className="font-medium">Vacunación pendiente</div>
                <div className="text-xs text-muted-foreground">Bella · mañana</div>
              </div>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
