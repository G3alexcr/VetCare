import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EspecieFormDialog } from "@/components/especie-form-dialog";
import {
  ESPECIE_ESTADOS,
  addEspecie,
  deleteEspecie,
  toggleEspecieEstado,
  updateEspecie,
  useEspecies,
  type Especie,
  type EspecieDraft,
  type EspecieEstado,
} from "@/lib/especies-store";
import { Bone, Pencil, Plus, Power, Search, Tags, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/especies")({ component: EspeciesPage });

function estadoColor(s: EspecieEstado) {
  return s === "Activo"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-slate-100 text-slate-700";
}

function EspeciesPage() {
  const especies = useEspecies();

  const [query, setQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Especie | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return especies.filter((s) => {
      if (estadoFilter !== "todos" && s.estado !== estadoFilter) return false;
      if (q && ![s.nombre, s.descripcion].some((x) => (x || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [especies, query, estadoFilter]);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (s: Especie) => {
    setEditing(s);
    setDialogOpen(true);
  };

  const handleSave = (data: EspecieDraft) => {
    if (editing) {
      updateEspecie(editing.id, data);
      toast.success("Especie actualizada");
    } else {
      addEspecie(data);
      toast.success("Especie creada");
    }
    setDialogOpen(false);
  };

  const handleDelete = (s: Especie) => {
    if (window.confirm(`¿Estás seguro de eliminar la especie "${s.nombre}" y sus razas asociadas?`)) {
      deleteEspecie(s.id);
      toast.success(`${s.nombre} eliminada`);
    }
  };

  const handleToggle = (s: Especie) => {
    toggleEspecieEstado(s.id);
    toast.success(s.estado === "Activo" ? `${s.nombre} desactivada` : `${s.nombre} activada`);
  };

  const clearFilters = () => {
    setQuery("");
    setEstadoFilter("todos");
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bone className="h-6 w-6 text-primary" /> Gestión de Especies y Razas
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Administra las especies y el catálogo de razas disponibles para tus pacientes.
            </p>
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" /> Nueva especie
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar especie..."
                className="pl-9"
              />
            </div>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESPECIE_ESTADOS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" /> Limpiar
            </Button>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Razas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{s.descripcion || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs gap-1.5 font-normal hover:bg-secondary/80"
                        onClick={() => openEdit(s)}
                        title="Haz clic para ver o editar las razas de esta especie"
                      >
                        <Tags className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold">{s.razas.length}</span> {s.razas.length === 1 ? "raza" : "razas"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => openEdit(s)}
                        title="Agregar o editar razas"
                      >
                        <Plus className="h-3 w-3 mr-0.5" /> Razas
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={estadoColor(s.estado)}>{s.estado}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-amber-600 border-amber-300 hover:bg-amber-50 gap-1"
                        onClick={() => openEdit(s)}
                        title="Editar especie y razas"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="hidden sm:inline text-xs">Editar</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggle(s)}
                        title={s.estado === "Activo" ? "Desactivar especie" : "Activar especie"}
                      >
                        <Power className={`h-4 w-4 ${s.estado === "Activo" ? "text-emerald-600" : "text-slate-400"}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-red-300 hover:bg-red-50"
                        onClick={() => handleDelete(s)}
                        title="Eliminar especie"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No se encontraron especies con los filtros actuales.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <EspecieFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSave={handleSave}
      />
    </AppLayout>
  );
}
