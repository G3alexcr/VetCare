import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Cake, Weight, LayoutGrid, Table as TableIcon, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppLayout } from "@/components/app-layout";
import { usePets, addPet, updatePet, deletePet, type TenantPet } from "@/lib/pets-store";
import { useClientes, type ClinicClient } from "@/lib/clientes-store";
import { getRazasDeEspecie, useEspecies } from "@/lib/especies-store";
import { ImageInput } from "@/components/image-input";
import { PetRecordDialog } from "@/components/pet-record-dialog";
import { PortalInvitationDialog } from "@/components/portal-invitation-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/mascotas")({
  head: () => ({ meta: [{ title: "Mascotas — VetCare" }] }),
  component: () => <AppLayout><PetsPage /></AppLayout>,
});

function calcAge(birthDate: string): string {
  if (!birthDate) return "—";
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return "—";
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  let months = now.getMonth() - b.getMonth();
  if (now.getDate() < b.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  if (years <= 0 && months <= 0) return "Recién nacido";
  if (years <= 0) return `${months} mes${months === 1 ? "" : "es"}`;
  if (months === 0) return `${years} año${years === 1 ? "" : "s"}`;
  return `${years} año${years === 1 ? "" : "s"} ${months} m`;
}

function PetsPage() {
  const pets = usePets();
  const clientes = useClientes();
  const [query, setQuery] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TenantPet | null>(null);
  const [detail, setDetail] = useState<TenantPet | null>(null);
  const [invitationOpen, setInvitationOpen] = useState(false);
  const [invitationClient, setInvitationClient] = useState<ClinicClient | null>(null);
  const [invitationPet, setInvitationPet] = useState<TenantPet | null>(null);

  const especies = useEspecies();
  const especiesActivas = useMemo(
    () => especies.filter((s) => s.estado === "Activo").sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [especies]
  );
  const especieOptions = useMemo(() => {
    const list = new Set(especiesActivas.map((s) => s.nombre));
    if (editing?.species) list.add(editing.species); // conserva la especie del registro aunque esté inactiva
    return Array.from(list).map((nombre) => ({ value: nombre, label: nombre }));
  }, [especiesActivas, editing]);

  const [speciesSel, setSpeciesSel] = useState<string>(() => editing?.species ?? especiesActivas[0]?.nombre ?? "");
  const [breedSel, setBreedSel] = useState<string>(() => editing?.breed ?? "");
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSpeciesSel(editing?.species ?? especiesActivas[0]?.nombre ?? "");
    setBreedSel(editing?.breed ?? "");
    setPhoto(editing?.photo ?? null);
  }, [open, editing?.id, editing?.species, editing?.breed, editing?.photo]); // eslint-disable-line react-hooks/exhaustive-deps

  const breedOptions = useMemo(() => {
    const razas = getRazasDeEspecie(speciesSel);
    const list = new Set(razas);
    if (breedSel) list.add(breedSel); // conserva la raza actual aunque no esté en el catálogo
    return Array.from(list).map((nombre) => ({ value: nombre, label: nombre }));
  }, [speciesSel, breedSel]);

  const speciesList = useMemo(
    () => Array.from(new Set([...especiesActivas.map((s) => s.nombre), ...pets.map((p) => p.species)])).filter(Boolean),
    [especiesActivas, pets]
  );

  const filtered = useMemo(
    () => pets.filter((p) => {
      const matchesQuery = [p.name, p.species, p.breed].join(" ").toLowerCase().includes(query.toLowerCase());
      const matchesSpecies = speciesFilter === "all" || p.species === speciesFilter;
      const matchesOwner = ownerFilter === "all" || p.clientId === ownerFilter;
      return matchesQuery && matchesSpecies && matchesOwner;
    }),
    [pets, query, speciesFilter, ownerFilter]
  );

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries()) as Record<string, string>;
    const base = {
      name: data.name,
      species: data.species,
      breed: data.breed,
      sex: data.sex as TenantPet["sex"],
      color: data.color,
      birthDate: data.birthDate,
      weight: Number(data.weight) || 0,
      microchip: data.microchip,
      sterilized: data.sterilized === "on",
      allergies: data.allergies,
      notes: data.notes,
      clientId: data.clientId,
      photo: photo ?? "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400",
    };
    if (editing) {
      updatePet(editing.id, base);
      toast.success("Mascota actualizada");
    } else {
      const created = addPet(base);
      toast.success("Mascota registrada exitosamente");
      const clientObj = clientes.find((c) => c.id === base.clientId);
      if (clientObj) {
        setInvitationClient(clientObj);
        setInvitationPet(created);
        setInvitationOpen(true);
      }
    }
    setOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mascotas</h1>
          <p className="text-sm text-muted-foreground mt-1">Pacientes activos en la clínica.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nueva mascota</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar mascota" : "Nueva mascota"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
              <TextField label="Nombre" name="name" defaultValue={editing?.name} required />
              <SelectField label="Cliente propietario" name="clientId" defaultValue={editing?.clientId ?? clientes[0]?.id ?? ""}
                options={clientes.map((c) => ({ value: c.id, label: c.name }))} />
              <div className="space-y-2">
                <Label>Especie</Label>
                <Select name="species" value={speciesSel} onValueChange={(v) => { setSpeciesSel(v); setBreedSel(""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {especieOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Raza</Label>
                <Select name="breed" value={breedSel} onValueChange={setBreedSel}>
                  <SelectTrigger><SelectValue placeholder="Selecciona raza" /></SelectTrigger>
                  <SelectContent>
                    {breedOptions.length === 0 ? (
                      <SelectItem value="__sin_razas" disabled>Sin razas para esta especie</SelectItem>
                    ) : breedOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <SelectField label="Sexo" name="sex" defaultValue={editing?.sex ?? "Macho"} options={[
                { value: "Macho", label: "Macho" }, { value: "Hembra", label: "Hembra" },
              ]} />
              <TextField label="Color" name="color" defaultValue={editing?.color} />
              <TextField label="Fecha de nacimiento" name="birthDate" type="date" defaultValue={editing?.birthDate} />
              <TextField label="Peso (kg)" name="weight" type="number" step="0.1" defaultValue={editing?.weight?.toString()} />
              <TextField label="Microchip" name="microchip" defaultValue={editing?.microchip} />
              <div className="col-span-2"><ImageInput label="Fotografía" value={photo} onChange={setPhoto} /></div>
              <div className="flex items-center gap-3 col-span-2">
                <Switch id="sterilized" name="sterilized" defaultChecked={editing?.sterilized} />
                <Label htmlFor="sterilized">Esterilizado</Label>
              </div>
              <TextField label="Alergias" name="allergies" defaultValue={editing?.allergies} className="col-span-2" />
              <div className="col-span-2 space-y-2">
                <Label>Observaciones</Label>
                <Textarea name="notes" defaultValue={editing?.notes} rows={3} />
              </div>
              <DialogFooter className="col-span-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit">{editing ? "Guardar" : "Registrar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, especie o raza..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 bg-card" />
        </div>
        <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
          <SelectTrigger className="w-[170px] bg-card"><SelectValue placeholder="Especie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las especies</SelectItem>
            {speciesList.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-[210px] bg-card"><SelectValue placeholder="Propietario" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los propietarios</SelectItem>
            {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto inline-flex rounded-md border bg-card p-0.5">
          <Button variant={view === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setView("grid")}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={view === "table" ? "secondary" : "ghost"} size="sm" onClick={() => setView("table")}>
            <TableIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const owner = clientes.find((c) => c.id === p.clientId);
            return (
              <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetail(p)}>
                <div className="aspect-square bg-muted overflow-hidden">
                  <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.breed} · {p.sex}</div>
                    </div>
                    <Badge variant="secondary">{p.species}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Cake className="h-3 w-3" /> {calcAge(p.birthDate)}</span>
                    <span className="flex items-center gap-1"><Weight className="h-3 w-3" /> {p.weight}kg</span>
                  </div>
                  <div className="text-xs text-muted-foreground border-t pt-2">{owner?.name}</div>
                  <div className="flex gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => { setEditing(p); setOpen(true); }}>
                      <Pencil className="h-3 w-3 mr-1" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Enviar acceso al Portal"
                      onClick={() => {
                        if (owner) {
                          setInvitationClient(owner);
                          setInvitationPet(p);
                          setInvitationOpen(true);
                        } else {
                          toast.error("Esta mascota no tiene un tutor asignado");
                        }
                      }}
                    >
                      <Mail className="h-3.5 w-3.5 text-emerald-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { deletePet(p.id); toast.success("Eliminada"); }}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mascota</TableHead>
                <TableHead>Especie</TableHead>
                <TableHead>Raza</TableHead>
                <TableHead>Sexo</TableHead>
                <TableHead>Edad</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>Propietario</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const owner = clientes.find((c) => c.id === p.clientId);
                return (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => setDetail(p)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img src={p.photo} alt={p.name} className="h-9 w-9 rounded-full object-cover" />
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{p.species}</Badge></TableCell>
                    <TableCell>{p.breed}</TableCell>
                    <TableCell>{p.sex}</TableCell>
                    <TableCell>{calcAge(p.birthDate)}</TableCell>
                    <TableCell>{p.weight} kg</TableCell>
                    <TableCell>{owner?.name ?? "—"}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Enviar acceso al Portal Propietario"
                          onClick={() => {
                            if (owner) {
                              setInvitationClient(owner);
                              setInvitationPet(p);
                              setInvitationOpen(true);
                            } else {
                              toast.error("Esta mascota no tiene un tutor asignado");
                            }
                          }}
                        >
                          <Mail className="h-3.5 w-3.5 text-emerald-600" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditing(p); setOpen(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { deletePet(p.id); toast.success("Eliminada"); }}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">Sin resultados.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <PetRecordDialog
        pet={detail}
        onClose={() => setDetail(null)}
        onEdit={(p) => { setEditing(p as TenantPet); setOpen(true); setDetail(null); }}
      />

      <PortalInvitationDialog
        open={invitationOpen}
        onOpenChange={setInvitationOpen}
        client={invitationClient}
        pet={invitationPet}
      />
    </div>
  );
}

function TextField({ label, className, ...props }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={props.name}>{label}</Label>
      <Input id={props.name} {...props} />
    </div>
  );
}

function SelectField({ label, name, defaultValue, options }: { label: string; name: string; defaultValue: string; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
