import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VeterinarioFormDialog } from "@/components/veterinario-form-dialog";
import { Can } from "@/lib/rbac";
import { usePlanCapabilities } from "@/lib/saas-store";
import {
  ESPECIALIDADES_VET,
  VET_ESTADOS,
  addVeterinario,
  deleteVeterinario,
  updateVeterinario,
  useVeterinarios,
  type Veterinario,
  type VeterinarioDraft,
  type VetEstado,
} from "@/lib/veterinarios-store";
import { BriefcaseMedical, Clock, Phone, Plus, Search, Trash2, Pencil, FilterX, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/veterinarios")({ component: VeterinariosPage });

function estadoColor(s: VetEstado) {
  return s === "Activo"
    ? "bg-emerald-100 text-emerald-700"
    : s === "Suspendido"
    ? "bg-rose-100 text-rose-700"
    : "bg-slate-100 text-slate-700";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function VeterinariosPage() {
  const vets = useVeterinarios();
  const caps = usePlanCapabilities();

  const [query, setQuery] = useState("");
  const [especialidadFilter, setEspecialidadFilter] = useState("todas");
  const [estadoFilter, setEstadoFilter] = useState("todos");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Veterinario | null>(null);

  const stats = useMemo(() => {
    const total = vets.length;
    const activos = vets.filter((v) => v.estado === "Activo").length;
    const inactivos = vets.filter((v) => v.estado !== "Activo").length;
    const todayIdx = (new Date().getDay() + 6) % 7;
    const activosHoy = vets.filter(
      (v) => v.estado === "Activo" && v.horario[todayIdx]?.disponible
    ).length;
    return { total, activos, inactivos, activosHoy };
  }, [vets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vets.filter((v) => {
      if (especialidadFilter !== "todas" && v.especialidad !== especialidadFilter) return false;
      if (estadoFilter !== "todos" && v.estado !== estadoFilter) return false;
      if (q && ![v.nombre, v.email, v.especialidad, v.telefono].some((x) => (x || "").toLowerCase().includes(q)))
        return false;
      return true;
    });
  }, [vets, query, especialidadFilter, estadoFilter]);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (v: Veterinario) => {
    setEditing(v);
    setDialogOpen(true);
  };

  const handleSave = (data: VeterinarioDraft) => {
    if (editing) {
      updateVeterinario(editing.id, data);
      toast.success("Veterinario actualizado");
    } else {
      if (vets.length >= caps.maxVeterinarios) {
        toast.error(`Alcanzaste el límite de ${caps.maxVeterinarios} veterinarios de tu plan ${caps.plan?.name}. Mejora tu plan.`);
        return;
      }
      addVeterinario(data);
      toast.success("Veterinario creado");
    }
    setDialogOpen(false);
  };

  const handleDelete = (v: Veterinario) => {
    deleteVeterinario(v.id);
    toast.success(`${v.nombre} eliminado`);
  };

  const clearFilters = () => {
    setQuery("");
    setEspecialidadFilter("todas");
    setEstadoFilter("todos");
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BriefcaseMedical className="h-6 w-6 text-primary" /> Gestión de Veterinarios
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Administra el equipo médico veterinario de la clínica.</p>
          </div>
          <Can module="veterinarios" action="create">
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Nuevo Veterinario</Button>
          </Can>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Total veterinarios</div>
            <div className="text-3xl font-bold mt-1">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Activos</div>
            <div className="text-3xl font-bold mt-1 text-emerald-600">{stats.activos}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Activos hoy</div>
            <div className="text-3xl font-bold mt-1 text-teal-600">{stats.activosHoy}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Inactivos</div>
            <div className="text-3xl font-bold mt-1 text-slate-500">{stats.inactivos}</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FilterX className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Filtros y Búsqueda</span>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, especialidad, email..."
                className="pl-9"
              />
            </div>
            <Select value={especialidadFilter} onValueChange={setEspecialidadFilter}>
              <SelectTrigger className="w-full md:w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las especialidades</SelectItem>
                {ESPECIALIDADES_VET.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {VET_ESTADOS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={clearFilters}>
              <FilterX className="h-4 w-4 mr-1" /> Limpiar
            </Button>
          </div>
        </Card>

        {/* List */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Lista de Veterinarios
          </h2>
          <Badge variant="secondary">{filtered.length} veterinario{filtered.length === 1 ? "" : "s"}</Badge>
        </div>

        {filtered.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            No se encontraron veterinarios con los filtros actuales.
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((v) => {
              const availableDays = v.horario.filter((h) => h.disponible).length;
              const first = v.horario.find((h) => h.disponible);
              return (
                <Card key={v.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {v.foto ? (
                        <AvatarImage src={v.foto} alt={v.nombre} className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-teal-100 text-teal-700">
                          {initials(v.nombre)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{v.nombre}</div>
                      <div className="text-xs text-muted-foreground truncate">{v.especialidad}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor(v.estado)}`}>
                      {v.estado}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> {v.telefono || "—"}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MessageCircle className="h-3.5 w-3.5" /> {v.whatsapp || "—"}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {availableDays === 7
                        ? "Todos los días"
                        : `${availableDays} día(s) · ${first ? `${first.entrada}–${first.salida}` : "—"}`}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Comisión <span className="font-semibold text-foreground">{v.comision}%</span>
                    </div>
                    <div className="flex gap-1">
                      <Can module="veterinarios" action="edit">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(v)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Can>
                      <Can module="veterinarios" action="delete">
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(v)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Can>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <VeterinarioFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSave={handleSave}
      />
    </AppLayout>
  );
}
