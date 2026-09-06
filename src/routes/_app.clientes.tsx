import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus, Search, Pencil, Trash2, PawPrint, Phone, Mail, Eye,
  MessageCircle, MapPin, Calendar, FileText, User as UserIcon,
  Users, UserCheck, LayoutGrid, List, Sparkles, Building2
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
import { usePets, type TenantPet } from "@/lib/pets-store";
import { toLocalDateStr } from "@/lib/utils";
import { PortalInvitationDialog } from "@/components/portal-invitation-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/clientes")({
  head: () => ({ meta: [{ title: "Clientes y Tutores — Go2Vet" }] }),
  component: () => <AppLayout><ClientsPage /></AppLayout>,
});

function ClientsPage() {
  const clients = useClientes();
  const pets = usePets();
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [editing, setEditing] = useState<ClinicClient | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<ClinicClient | null>(null);
  const [toDelete, setToDelete] = useState<ClinicClient | null>(null);
  const [invitationOpen, setInvitationOpen] = useState(false);
  const [invitationClient, setInvitationClient] = useState<ClinicClient | null>(null);
  const [invitationPet, setInvitationPet] = useState<TenantPet | null>(null);

  const openInvitation = (c: ClinicClient) => {
    const clientPets = pets.filter((p) => p.clientId === c.id);
    setInvitationClient(c);
    setInvitationPet((clientPets[0] as unknown as TenantPet) || null);
    setInvitationOpen(true);
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.fullName, c.identification, c.phone, c.whatsapp, c.email, c.address]
        .join(" ").toLowerCase().includes(q)
    );
  }, [clients, query]);

  // Client KPI Metrics
  const metrics = useMemo(() => {
    const total = clients.length;
    const withPets = clients.filter((c) => pets.some((p) => p.clientId === c.id)).length;
    const withWa = clients.filter((c) => !!c.whatsapp || !!c.phone).length;
    const totalPets = pets.length;
    return { total, withPets, withWa, totalPets };
  }, [clients, pets]);

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
      registeredAt: data.registeredAt ?? toLocalDateStr(new Date()),
      notes: data.notes ?? "",
    };
    if (editing) {
      updateCliente(editing.id, draft);
      toast.success("Tutor actualizado");
    } else {
      const created = addCliente(draft);
      toast.success("Tutor registrado");
      if (draft.email) {
        setInvitationClient(created);
        setInvitationPet(null);
        setInvitationOpen(true);
      }
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
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Directorio de Tutores y Clientes</h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              {clients.length} registrados
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ficha completa de propietarios, canales de comunicación directa y pacientes asociados.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo cliente
        </Button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 flex items-center gap-3 border shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight">{metrics.total}</div>
            <div className="text-xs text-muted-foreground">Tutores registrados</div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3 border shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
              {metrics.withPets}
            </div>
            <div className="text-xs text-muted-foreground">Con mascotas activas</div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3 border shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <PawPrint className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-purple-700 dark:text-purple-400">
              {metrics.totalPets}
            </div>
            <div className="text-xs text-muted-foreground">Mascotas vinculadas</div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3 border shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
              {metrics.withWa}
            </div>
            <div className="text-xs text-muted-foreground">Canales de contacto directo</div>
          </div>
        </Card>
      </div>

      {/* Main Filter & View Toggle Bar */}
      <Card className="p-4 md:p-6 shadow-xs border">
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div className="relative w-full max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, cédula, teléfono..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="border rounded-lg p-0.5 flex bg-muted/40">
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2.5 text-xs gap-1"
                onClick={() => setViewMode("cards")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Tarjetas
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2.5 text-xs gap-1"
                onClick={() => setViewMode("table")}
              >
                <List className="h-3.5 w-3.5" />
                Tabla
              </Button>
            </div>
            <Badge variant="outline" className="text-xs">
              {filtered.length} de {clients.length}
            </Badge>
          </div>
        </div>

        {/* View: Cards / Grid */}
        {viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((c) => {
              const clientPets = pets.filter((p) => p.clientId === c.id);
              const waNumber = (c.whatsapp || c.phone || "").replace(/\D/g, "");
              const waUrl = waNumber
                ? `https://wa.me/${waNumber}`
                : null;

              return (
                <div
                  key={c.id}
                  className="rounded-xl border bg-card p-4 transition-all hover:shadow-sm hover:border-primary/40 flex flex-col justify-between"
                >
                  <div>
                    {/* Header with avatar & actions */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm shrink-0">
                          {c.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setViewing(c)}
                            className="font-semibold text-sm hover:underline text-left truncate block max-w-[180px]"
                          >
                            {c.fullName}
                          </button>
                          <div className="text-xs text-muted-foreground">
                            {c.identification || "Sin identificación"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => openInvitation(c)}
                          title="Enviar invitación al Portal Propietarios"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewing(c)} title="Ver ficha">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)} title="Editar">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setToDelete(c)} title="Eliminar">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-1 text-xs text-muted-foreground mb-3 bg-muted/30 p-2.5 rounded-lg border border-muted/60">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 truncate">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{c.phone || "Sin teléfono"}</span>
                        </span>
                        {waUrl && (
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[11px] px-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1"
                          >
                            <a href={waUrl} target="_blank" rel="noreferrer">
                              <MessageCircle className="h-3 w-3 text-emerald-600" /> WhatsApp
                            </a>
                          </Button>
                        )}
                      </div>
                      {c.email && (
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="flex items-center gap-1.5 truncate min-w-0">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{c.email}</span>
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openInvitation(c)}
                            className="h-6 text-[11px] px-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1 shrink-0"
                            title="Enviar acceso al Portal Propietario"
                          >
                            <Mail className="h-3 w-3 text-emerald-600" /> Invitar Portal
                          </Button>
                        </div>
                      )}
                      {c.address && (
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{c.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pets associated */}
                  <div className="pt-2 border-t mt-2">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                      <span className="font-medium">Mascotas ({clientPets.length})</span>
                      <span className="text-[10px]">Alta: {c.registeredAt}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {clientPets.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                          <img src={p.photo} alt={p.name} className="h-3.5 w-3.5 rounded-full object-cover" />
                          <span>{p.name}</span>
                          <span className="text-[10px] opacity-70">({p.species})</span>
                        </span>
                      ))}
                      {clientPets.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">Sin mascotas asociadas</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
                No se encontraron tutores coincidentes con &quot;{query}&quot;.
              </div>
            )}
          </div>
        ) : (
          /* View: Table */
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tutor / Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Mascotas</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const clientPets = pets.filter((p) => p.clientId === c.id);
                  const waNumber = (c.whatsapp || c.phone || "").replace(/\D/g, "");
                  const waUrl = waNumber
                    ? `https://wa.me/${waNumber}`
                    : null;

                  return (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setViewing(c)}>
                      <TableCell>
                        <div className="font-semibold text-sm">{c.fullName}</div>
                        <div className="text-xs text-muted-foreground">{c.identification || "Sin identificación"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs flex items-center gap-2">
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</span>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-emerald-600 hover:text-emerald-700"
                              title="Chat WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        {c.email && (
                          <div className="text-xs flex items-center gap-1 text-muted-foreground truncate max-w-[200px]">
                            <Mail className="h-3 w-3" /> {c.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {clientPets.map((p) => (
                            <Badge key={p.id} variant="secondary" className="gap-1 py-0.5 text-xs font-normal">
                              <img src={p.photo} alt={p.name} className="h-3 w-3 rounded-full object-cover" />
                              {p.name}
                            </Badge>
                          ))}
                          {clientPets.length === 0 && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.registeredAt}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => openInvitation(c)}
                          title="Enviar invitación al Portal Propietarios"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewing(c)} title="Ver">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)} title="Editar">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setToDelete(c)} title="Eliminar">
                          <Trash2 className="h-3.5 w-3.5" />
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
        )}
      </Card>

      {/* Crear / Editar Modal */}
      <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
            <Field label="Nombre completo" name="fullName" defaultValue={editing?.fullName} required className="col-span-2" />
            <Field label="Identificación / Cédula" name="identification" defaultValue={editing?.identification} />
            <Field label="Teléfono principal" name="phone" defaultValue={editing?.phone} />
            <Field label="WhatsApp directo" name="whatsapp" defaultValue={editing?.whatsapp} />
            <Field label="Correo electrónico" name="email" type="email" defaultValue={editing?.email} />
            <Field label="Dirección de residencia" name="address" defaultValue={editing?.address} className="col-span-2" />
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Observaciones clínicas o de contacto</Label>
              <Textarea id="notes" name="notes" defaultValue={editing?.notes} rows={3} placeholder="Notas especiales sobre el tutor..." />
            </div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button type="submit">{editing ? "Guardar cambios" : "Crear cliente"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detalle Sheet */}
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
                <SheetDescription>{viewing.identification || "Sin identificación registrada"}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <InfoRow icon={Phone} label="Teléfono" value={viewing.phone} />
                <InfoRow icon={MessageCircle} label="WhatsApp" value={viewing.whatsapp} />
                <InfoRow icon={Mail} label="Correo" value={viewing.email} />
                <InfoRow icon={MapPin} label="Dirección" value={viewing.address} />
                <InfoRow icon={Calendar} label="Registro" value={viewing.registeredAt} />
                <InfoRow icon={FileText} label="Observaciones" value={viewing.notes || "—"} />

                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <PawPrint className="h-3.5 w-3.5 text-primary" /> PACIENTES VINCULADOS
                  </div>
                  <div className="space-y-2">
                    {pets.filter((p) => p.clientId === viewing.id).map((p) => (
                      <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl border bg-card">
                        <img src={p.photo} alt={p.name} className="h-10 w-10 rounded-full object-cover border" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.species} · {p.breed}</div>
                        </div>
                      </div>
                    ))}
                    {pets.filter((p) => p.clientId === viewing.id).length === 0 && (
                      <div className="text-xs text-muted-foreground py-2">Sin mascotas registradas actualmente.</div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <Button
                    type="button"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs"
                    onClick={() => openInvitation(viewing)}
                  >
                    <Mail className="h-4 w-4" /> Enviar Invitación al Portal Propietario
                  </Button>
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
              Las mascotas asociadas quedarán sin propietario asignado.
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

      <PortalInvitationDialog
        open={invitationOpen}
        onOpenChange={setInvitationOpen}
        client={invitationClient}
        pet={invitationPet}
      />
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
        <div className="text-sm break-words font-medium">{value || "—"}</div>
      </div>
    </div>
  );
}

