import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServicioFormDialog } from "@/components/servicio-form-dialog";
import { Can } from "@/lib/rbac";
import {
  SERVICIO_ESTADOS,
  addServicio,
  deleteServicio,
  formatDuracion,
  updateServicio,
  useServicios,
  type Servicio,
  type ServicioDraft,
  type ServicioEstado,
} from "@/lib/servicios-store";
import { formatMoney, useCurrency } from "@/lib/config-store";
import {
  Banknote,
  Clock,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/servicios")({ component: ServiciosPage });

function estadoColor(s: ServicioEstado) {
  return s === "Activo" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700";
}

function ServiciosPage() {
  const servicios = useServicios();
  const currency = useCurrency();

  const [query, setQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Servicio | null>(null);

  const stats = useMemo(() => {
    const total = servicios.length;
    const activos = servicios.filter((s) => s.estado === "Activo").length;
    const inactivos = servicios.filter((s) => s.estado !== "Activo").length;
    const totalPrecio = servicios.reduce((acc, s) => acc + s.precio, 0);
    const promedio = total ? totalPrecio / total : 0;
    return { total, activos, inactivos, promedio };
  }, [servicios]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return servicios.filter((s) => {
      if (estadoFilter !== "todos" && s.estado !== estadoFilter) return false;
      if (q && ![s.nombre, s.descripcion].some((x) => (x || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [servicios, query, estadoFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const fromIndex = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const toIndex = Math.min(safePage * pageSize, filtered.length);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (s: Servicio) => {
    setEditing(s);
    setDialogOpen(true);
  };

  const handleSave = (data: ServicioDraft) => {
    if (editing) {
      updateServicio(editing.id, data);
      toast.success("Servicio actualizado");
    } else {
      addServicio(data);
      toast.success("Servicio creado");
    }
    setDialogOpen(false);
  };

  const handleDelete = (s: Servicio) => {
    deleteServicio(s.id);
    toast.success(`${s.nombre} eliminado`);
  };

  const clearFilters = () => {
    setQuery("");
    setEstadoFilter("todos");
    setPage(1);
  };

  const acciones = (s: Servicio) => (
    <div className="flex gap-1">
      <Can module="servicios" action="edit">
        <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
          <Pencil className="h-4 w-4 mr-1" /> Editar
        </Button>
      </Can>
      <Can module="servicios" action="delete">
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDelete(s)}>
          <Trash2 className="h-4 w-4 mr-1" /> Eliminar
        </Button>
      </Can>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" /> Gestión de Servicios
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Administra los servicios que ofrece la veterinaria.</p>
          </div>
          <Can module="servicios" action="create">
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Nuevo Servicio</Button>
          </Can>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Total servicios</div>
            <div className="text-3xl font-bold mt-1">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Activos</div>
            <div className="text-3xl font-bold mt-1 text-emerald-600">{stats.activos}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Promedio precio</div>
            <div className="text-3xl font-bold mt-1 text-teal-600">{formatMoney(stats.promedio, currency)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Inactivos</div>
            <div className="text-3xl font-bold mt-1 text-slate-500">{stats.inactivos}</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Filtros y Búsqueda</span>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Buscar por nombre o descripción..."
                className="pl-9"
              />
            </div>
            <Select value={estadoFilter} onValueChange={(v) => { setEstadoFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {SERVICIO_ESTADOS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" /> Limpiar Filtros
            </Button>
          </div>
        </Card>

        {/* List */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <List className="h-5 w-5 text-primary" /> Lista de Servicios
            </h2>
            <div className="flex gap-1">
              <Button size="sm" variant={view === "grid" ? "default" : "ghost"} onClick={() => setView("grid")} aria-label="Vista cuadrícula">
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button size="sm" variant={view === "list" ? "default" : "ghost"} onClick={() => setView("list")} aria-label="Vista lista">
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              No se encontraron servicios con los filtros actuales.
            </div>
          ) : view === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pageItems.map((s) => (
                <Card key={s.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold truncate">{s.nombre}</div>
                    <Badge className={estadoColor(s.estado)}>{s.estado}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground min-h-[2.5rem]">{s.descripcion || "—"}</div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Banknote className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{formatMoney(s.precio, currency)}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-teal-500" />
                      <span className="font-semibold text-teal-600">Duración: {formatDuracion(s.duracionMin)}</span>
                    </span>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {s.gravaImpuestos ? "Grava impuestos" : "No grava impuestos"}
                    </span>
                    {acciones(s)}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Servicio</th>
                    <th className="pb-2 pr-4 font-medium">Descripción</th>
                    <th className="pb-2 pr-4 font-medium">Precio</th>
                    <th className="pb-2 pr-4 font-medium">Duración</th>
                    <th className="pb-2 pr-4 font-medium">Estado</th>
                    <th className="pb-2 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{s.nombre}</td>
                      <td className="py-3 pr-4 text-muted-foreground max-w-md truncate">{s.descripcion || "—"}</td>
                      <td className="py-3 pr-4 font-semibold whitespace-nowrap">{formatMoney(s.precio, currency)}</td>
                      <td className="py-3 pr-4 whitespace-nowrap text-teal-600">{formatDuracion(s.duracionMin)}</td>
                      <td className="py-3 pr-4"><Badge className={estadoColor(s.estado)}>{s.estado}</Badge></td>
                      <td className="py-3 text-right whitespace-nowrap">{acciones(s)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between gap-2 mt-4 flex-wrap">
            <div className="text-sm text-muted-foreground">
              Mostrando {fromIndex} a {toIndex} de {filtered.length} servicio{filtered.length === 1 ? "" : "s"}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Mostrar:</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 20, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground px-1">
                    {safePage}/{totalPages}
                  </span>
                  <Button size="sm" variant="outline" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <ServicioFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSave={handleSave}
      />
    </AppLayout>
  );
}
