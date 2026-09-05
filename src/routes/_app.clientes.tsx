import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus, Search, Pencil, Trash2, PawPrint, Phone, Mail, Eye,
  MessageCircle, MapPin, Calendar, FileText, User as UserIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppLayout } from "@/components/app-layout";
import { useClientes, addCliente, updateCliente, deleteCliente, type ClinicClient, type ClinicClientDraft } from "@/lib/clientes-store";
import { usePets } from "@/lib/pets-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/clientes")({
  head: () => ({ meta: [{ title: "Clientes — VetCare" }] }),
  component: () => <AppLayout><ClientsPage /></AppLayout>,
});

function ClientsPage() {
  const clients = useClientes();
  const pets = usePets();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ClinicClient | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<ClinicClient | null>(null);
  const [toDelete, setToDelete] = useState<ClinicClient | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.fullName, c.identification, c.phone, c.whatsapp, c.email, c.address]
        .join(" ").toLowerCase().includes(q)
    );
  }, [clients, query]);

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (c: ClinicClient) => { setEditing(c); setFormOpen(true); };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries()) as Record<string, string>;
    const draft: ClinicClientDraft = {
      name: data.fullName ?? "",
      identification: data.identification ?? "",
      phone: data.phone ?? "",
      whatsapp: data.whatsapp ?? "",
      email: data.email ?? "",
      address: data.address ?? "",
      registeredAt: data.registeredAt ?? new Date().toISOString().split("T")[0],
      notes: data.notes ?? "",
    };
    if (editing) {
      updateCliente(editing.id, draft);
      toast.success("Cliente actualizado");
    } else {
      addCliente(draft);
      toast.success("Cliente creado");
    }
    setFormOpen(false);
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteCliente(toDelete.id);
    toast.success(`${toDelete.fullName} fue eliminado`);
    setToDelete(null);
    if (viewing?.id === toDelete.id) setViewing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona los propietarios registrados y sus mascotas.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo cliente
        </Button>
      </div>

      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="relative w-full max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, identificación, teléfono..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Badge variant="secondary">{filtered.length} de {clients.length}</Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Mascotas</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const petCount = pets.filter((p) => p.clientId === c.id).length;
                return (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => setViewing(c)}>
                    <TableCell>
                      <div className="font-medium">{c.fullName}</div>
                      <div className="text-xs text-muted-foreground">{c.identification}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> {c.phone}
                      </div>
                      <div className="text-xs flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3 w-3" /> {c.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <PawPrint className="h-3 w-3" /> {petCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.registeredAt}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => setViewing(c)} title="Ver">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setToDelete(c)} title="Eliminar">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    No se encontraron clientes.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Crear / Editar */}
      <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
            <Field label="Nombre completo" name="fullName" defaultValue={editing?.fullName} required className="col-span-2" />
            <Field label="Identificación" name="identification" defaultValue={editing?.identification} />
            <Field label="Teléfono" name="phone" defaultValue={editing?.phone} />
            <Field label="WhatsApp" name="whatsapp" defaultValue={editing?.whatsapp} />
            <Field label="Correo electrónico" name="email" type="email" defaultValue={editing?.email} />
            <Field label="Dirección" name="address" defaultValue={editing?.address} className="col-span-2" />
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Observaciones</Label>
              <Textarea id="notes" name="notes" defaultValue={editing?.notes} rows={3} />
            </div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button type="submit">{editing ? "Guardar cambios" : "Crear cliente"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detalle */}
      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {viewing && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  {viewing.fullName}
                </SheetTitle>
                <SheetDescription>{viewing.identification || "Sin identificación"}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <InfoRow icon={Phone} label="Teléfono" value={viewing.phone} />
                <InfoRow icon={MessageCircle} label="WhatsApp" value={viewing.whatsapp} />
                <InfoRow icon={Mail} label="Correo" value={viewing.email} />
                <InfoRow icon={MapPin} label="Dirección" value={viewing.address} />
                <InfoRow icon={Calendar} label="Registro" value={viewing.registeredAt} />
                <InfoRow icon={FileText} label="Observaciones" value={viewing.notes || "—"} />

                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <PawPrint className="h-3.5 w-3.5" /> MASCOTAS
                  </div>
                  <div className="space-y-2">
                    {pets.filter((p) => p.clientId === viewing.id).map((p) => (
                      <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg border">
                        <img src={p.photo} alt={p.name} className="h-10 w-10 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.species} · {p.breed}</div>
                        </div>
                      </div>
                    ))}
                    {pets.filter((p) => p.clientId === viewing.id).length === 0 && (
                      <div className="text-xs text-muted-foreground py-2">Sin mascotas registradas.</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => { openEdit(viewing); setViewing(null); }}>
                    <Pencil className="h-4 w-4 mr-2" /> Editar
                  </Button>
                  <Button variant="outline" className="flex-1 text-destructive hover:text-destructive" onClick={() => setToDelete(viewing)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirmar eliminación */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{toDelete?.fullName}</strong> y no se podrá recuperar.
              Las mascotas asociadas quedarán sin propietario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({
  label, className, ...props
}: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={props.name}>{label}</Label>
      <Input id={props.name} {...props} />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm break-words">{value || "—"}</div>
      </div>
    </div>
  );
}
