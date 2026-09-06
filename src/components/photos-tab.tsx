import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Eye, GitCompare, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ImageInput } from "@/components/image-input";
import { CameraCaptureDialog } from "@/components/camera-capture-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  usePetPhotos,
  addPetPhoto,
  updatePetPhoto,
  deletePetPhoto,
  PET_PHOTO_CATEGORIES,
  type PetPhoto,
  type PetPhotoCategory,
} from "@/lib/store";
import { useVeterinarios } from "@/lib/veterinarios-store";
import { useAllPets } from "@/lib/pets-store";
import { toast } from "sonner";

export function PhotosTab({ petId }: { petId: string }) {
  const all = usePetPhotos();
  const allPets = useAllPets();
  const currentPet = allPets.find((p) => p.id === petId);
  const veterinarios = useVeterinarios();
  const photos = useMemo(() => {
    const list = [...all.filter((p) => p.petId === petId)];
    const profilePhoto = currentPet?.photo || (petId === "00000000-0000-0000-0000-0000000000b3" ? "/nani.png" : "");
    if (profilePhoto && !list.some((p) => p.photoUrl === profilePhoto)) {
      list.unshift({
        id: `profile-${petId}`,
        clinicId: currentPet?.clinicId || "",
        petId: petId,
        title: `Foto Oficial — ${currentPet?.name || "Mascota"}`,
        photoUrl: profilePhoto,
        photoDate: currentPet?.createdAt ? currentPet.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
        category: "General",
        veterinarian: "Clínica",
        clinicalNotes: "Fotografía principal del expediente clínico y carné digital",
        uploadedBy: "u1",
        createdAt: currentPet?.createdAt || new Date().toISOString(),
      });
    }
    return list.sort((a, b) => b.photoDate.localeCompare(a.photoDate));
  }, [all, petId, currentPet]);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [vet, setVet] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PetPhoto | null>(null);
  const [viewing, setViewing] = useState<PetPhoto | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [initialPhoto, setInitialPhoto] = useState("");

  const handleCaptureFromCamera = (dataUrl: string) => {
    setInitialPhoto(dataUrl);
    setEditing(null);
    setFormOpen(true);
  };

  const vets = useMemo(() => Array.from(new Set(photos.map((p) => p.veterinarian).filter(Boolean))), [photos]);

  const filtered = photos.filter((p) => {
    const matchesQ = !q || [p.title, p.clinicalNotes, p.veterinarian, p.category].join(" ").toLowerCase().includes(q.toLowerCase());
    const matchesCat = cat === "all" || p.category === cat;
    const matchesVet = vet === "all" || p.veterinarian === vet;
    const matchesDate = !dateFrom || p.photoDate >= dateFrom;
    return matchesQ && matchesCat && matchesVet && matchesDate;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const openNew = () => { setEditing(null); setInitialPhoto(""); setFormOpen(true); };
  const openEdit = (p: PetPhoto) => { setEditing(p); setInitialPhoto(""); setFormOpen(true); setViewing(null); };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por título, nota, veterinario..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {PET_PHOTO_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={vet} onValueChange={setVet}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Veterinario" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los veterinarios</SelectItem>
            {vets.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[160px]" />
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            variant={compareMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => { setCompareMode((v) => !v); setSelected([]); }}
          >
            <GitCompare className="h-4 w-4 mr-1.5" /> {compareMode ? "Cancelar" : "Comparar"}
          </Button>
          <Button
            size="sm"
            onClick={() => setCameraOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-1.5"
          >
            <Camera className="h-4 w-4" /> Tomar foto
          </Button>
          <Button size="sm" variant="outline" onClick={openNew} className="gap-1.5">
            <Plus className="h-4 w-4" /> Subir fotografía
          </Button>
        </div>
      </div>

      {compareMode && (
        <Card className="p-3 text-xs text-muted-foreground flex items-center justify-between">
          <span>Selecciona 2 fotografías para compararlas lado a lado. ({selected.length}/2)</span>
          {selected.length === 2 && (
            <Button size="sm" onClick={() => { /* opens compare dialog via state below */ }}>
              Ver comparación
            </Button>
          )}
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">Sin fotografías.</Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => {
            const isSel = selected.includes(p.id);
            return (
              <Card
                key={p.id}
                className={`overflow-hidden group cursor-pointer transition ${isSel ? "ring-2 ring-primary" : ""}`}
                onClick={() => (compareMode ? toggleSelect(p.id) : setViewing(p))}
              >
                <div className="aspect-square bg-muted overflow-hidden relative">
                  <img src={p.photoUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-black/60 text-white text-[10px]">{p.category}</Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">{p.photoDate}</span>
                  </div>
                </div>
                <div className="p-2.5">
                  <div className="font-medium text-xs truncate">{p.title}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{p.veterinarian}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ComparePanel photos={filtered.filter((p) => selected.includes(p.id))} onClose={() => setSelected([])} />

      <PhotoFormDialog
        key={editing?.id ?? (initialPhoto ? "captured" : "new")}
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setInitialPhoto("");
        }}
        editing={editing}
        petId={petId}
        initialPhoto={initialPhoto}
        petName={currentPet?.name}
      />

      <CameraCaptureDialog
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={handleCaptureFromCamera}
        title={`Tomar fotografía de ${currentPet?.name || "mascota"}`}
      />

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-8">{viewing.title}</DialogTitle>
              </DialogHeader>
              <img src={viewing.photoUrl} alt={viewing.title} className="w-full max-h-[60vh] object-contain rounded-md bg-muted" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Fecha" value={viewing.photoDate} />
                <Info label="Categoría" value={viewing.category} />
                <Info label="Veterinario" value={viewing.veterinarian} />
                <Info label="Subido por" value={veterinarios.find((v) => v.id === viewing.uploadedBy)?.nombre ?? "—"} />
              </div>
              {viewing.clinicalNotes && (
                <div className="text-sm">
                  <div className="text-xs text-muted-foreground mb-1">Descripción clínica</div>
                  <p className="whitespace-pre-wrap">{viewing.clinicalNotes}</p>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewing(null)}>Cerrar</Button>
                <Button variant="outline" onClick={() => openEdit(viewing)}>
                  <Pencil className="h-4 w-4 mr-2" /> Editar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deletePetPhoto(viewing.id);
                    setViewing(null);
                    toast.success("Fotografía eliminada");
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ComparePanel({ photos, onClose }: { photos: PetPhoto[]; onClose: () => void }) {
  const open = photos.length === 2;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comparación clínica</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {photos.map((p) => (
            <div key={p.id} className="space-y-2">
              <img src={p.photoUrl} alt={p.title} className="w-full aspect-square object-cover rounded-md bg-muted" />
              <div className="text-sm space-y-1">
                <div className="font-medium">{p.title}</div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <Badge variant="secondary">{p.category}</Badge>
                  <span>{p.photoDate}</span>
                </div>
                <div className="text-xs text-muted-foreground">{p.veterinarian}</div>
                {p.clinicalNotes && <p className="text-xs mt-1">{p.clinicalNotes}</p>}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}><X className="h-4 w-4 mr-2" /> Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PhotoFormDialog({
  open,
  onOpenChange,
  editing,
  petId,
  initialPhoto,
  petName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: PetPhoto | null;
  petId: string;
  initialPhoto?: string;
  petName?: string;
}) {
  const [preview, setPreview] = useState<string>(initialPhoto || editing?.photoUrl || "");
  const vets = useVeterinarios();

  useEffect(() => {
    if (open) {
      setPreview(initialPhoto || editing?.photoUrl || "");
    }
  }, [open, initialPhoto, editing]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const d = Object.fromEntries(fd.entries()) as Record<string, string>;
    const url = preview || editing?.photoUrl;
    if (!url) { toast.error("Selecciona una imagen"); return; }
    const base = {
      title: d.title,
      category: d.category as PetPhotoCategory,
      photoDate: d.photoDate,
      veterinarian: d.veterinarian,
      clinicalNotes: d.clinicalNotes,
      photoUrl: url,
    };
    if (editing) {
      updatePetPhoto(editing.id, base);
      toast.success("Fotografía actualizada");
    } else {
      addPetPhoto({ petId, uploadedBy: "u1", ...base });
      toast.success("📷 Fotografía clínica guardada");
    }
    onOpenChange(false);
    setPreview("");
  };

  const defaultTitle = editing?.title || (initialPhoto ? `Foto clínica — ${petName || "Paciente"}` : "");

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setPreview(""); }}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar fotografía" : initialPhoto ? "Guardar fotografía tomada" : "Subir fotografía"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <ImageInput label="Imagen" value={preview || editing?.photoUrl || null} onChange={(v) => setPreview(v ?? "")} />
          </div>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input name="title" defaultValue={defaultTitle} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select name="category" defaultValue={editing?.category ?? "General"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PET_PHOTO_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" name="photoDate" defaultValue={editing?.photoDate ?? new Date().toISOString().split("T")[0]} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Veterinario</Label>
            <Select name="veterinarian" defaultValue={editing?.veterinarian ?? vets[0]?.nombre ?? ""}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {vets.map((v) => <SelectItem key={v.id} value={v.nombre}>{v.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Descripción clínica</Label>
            <Textarea name="clinicalNotes" defaultValue={editing?.clinicalNotes} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
