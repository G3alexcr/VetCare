import { useMemo, useRef, useState } from "react";
import { Eye, Pencil, Trash2, Download, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useVeterinarios } from "@/lib/veterinarios-store";
import {
  usePetFiles,
  addPetFile,
  updatePetFile,
  deletePetFile,
  type PetFile,
  type PetFileCategory,
} from "@/lib/store";
import { toast } from "sonner";

const CATEGORIES: PetFileCategory[] = [
  "Laboratorio",
  "Radiografía",
  "Ecografía",
  "Receta médica",
  "Consentimiento informado",
  "Resultado clínico",
  "Informe quirúrgico",
  "Hospitalización",
  "Otros",
];
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.docx,.xlsx";

function fmtSize(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function FilesTab({ petId }: { petId: string }) {
  const all = usePetFiles();
  const items = useMemo(
    () => all.filter((f) => f.petId === petId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [all, petId]
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PetFile | null>(null);
  const [viewing, setViewing] = useState<PetFile | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">Total: {items.length}</span>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Upload className="h-4 w-4 mr-2" /> Subir archivo
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="p-10 text-center">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">No hay archivos registrados.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Tamaño</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.fileName}</TableCell>
                  <TableCell><Badge variant="secondary">{f.fileCategory}</Badge></TableCell>
                  <TableCell className="whitespace-nowrap">{f.documentDate || "—"}</TableCell>
                  <TableCell>{f.uploadedBy || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtSize(f.fileSize)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setViewing(f)} title="Ver">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Descargar" asChild>
                      <a href={f.fileUrl} download={f.fileName}>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(f); setFormOpen(true); }} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Eliminar"
                      onClick={() => { deletePetFile(f.id); toast.success("Archivo eliminado"); }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <FileForm
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        editing={editing}
        petId={petId}
      />
      <FileViewer item={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function FileForm({
  open, onOpenChange, editing, petId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: PetFile | null;
  petId: string;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [category, setCategory] = useState<PetFileCategory>(editing?.fileCategory ?? "Laboratorio");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const vets = useVeterinarios();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = Object.fromEntries(fd.entries()) as Record<string, string>;
    const file = fileRef.current?.files?.[0];

    setBusy(true);
    try {
      if (editing) {
        const patch: Partial<PetFile> = {
          fileName: v.fileName || editing.fileName,
          fileCategory: category,
          documentDate: v.documentDate ?? "",
          veterinarian: v.veterinarian ?? "",
          description: v.description ?? "",
        };
        if (file) {
          patch.fileUrl = await readAsDataUrl(file);
          patch.fileSize = file.size;
          patch.fileType = file.type || file.name.split(".").pop() || "";
        }
        updatePetFile(editing.id, patch);
        toast.success("Archivo actualizado");
      } else {
        if (!file) { toast.error("Selecciona un archivo"); setBusy(false); return; }
        const dataUrl = await readAsDataUrl(file);
        addPetFile({
          petId,
          fileName: v.fileName || file.name,
          fileCategory: category,
          fileUrl: dataUrl,
          fileSize: file.size,
          fileType: file.type || file.name.split(".").pop() || "",
          documentDate: v.documentDate ?? "",
          veterinarian: v.veterinarian ?? "",
          description: v.description ?? "",
          uploadedBy: v.veterinarian || "Usuario",
        });
        toast.success("Archivo subido");
      }
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar archivo" : "Subir archivo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="fileName">Nombre del documento</Label>
            <Input id="fileName" name="fileName" defaultValue={editing?.fileName} placeholder="Hemograma 2026" />
          </div>
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as PetFileCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="documentDate">Fecha documento</Label>
            <Input id="documentDate" name="documentDate" type="date" defaultValue={editing?.documentDate ?? today} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="veterinarian">Veterinario</Label>
            <Input id="veterinarian" name="veterinarian" list="vet-pf-list" defaultValue={editing?.veterinarian ?? vets[0]?.nombre ?? ""} />
            <datalist id="vet-pf-list">
              {vets.map((v) => <option key={v.id} value={v.nombre} />)}
            </datalist>
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={editing?.description} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="file">Archivo {editing && <span className="text-xs text-muted-foreground">(dejar vacío para conservar el actual)</span>}</Label>
            <Input id="file" name="file" type="file" accept={ACCEPT} ref={fileRef} />
            <p className="text-xs text-muted-foreground">Formatos: PDF, JPG, PNG, DOCX, XLSX</p>
          </div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={busy}>{busy ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FileViewer({ item, onClose }: { item: PetFile | null; onClose: () => void }) {
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        {item && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                <FileText className="h-4 w-4" /> {item.fileName}
                <Badge variant="secondary">{item.fileCategory}</Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>Fecha: <span className="text-foreground">{item.documentDate || "—"}</span></div>
                <div>Veterinario: <span className="text-foreground">{item.veterinarian || "—"}</span></div>
                <div>Tamaño: <span className="text-foreground">{fmtSize(item.fileSize)}</span></div>
                {item.description && <div>Descripción: <span className="text-foreground">{item.description}</span></div>}
              </div>
              <FilePreview item={item} />
              <div className="flex justify-end">
                <Button asChild>
                  <a href={item.fileUrl} download={item.fileName}>
                    <Download className="h-4 w-4 mr-2" /> Descargar
                  </a>
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FilePreview({ item }: { item: PetFile }) {
  const type = item.fileType?.toLowerCase() ?? "";
  const isImage = type.startsWith("image/") || /\.(jpe?g|png|gif|webp)$/i.test(item.fileName);
  const isPdf = type.includes("pdf") || /\.pdf$/i.test(item.fileName);

  if (isImage) {
    return <img src={item.fileUrl} alt={item.fileName} className="max-h-[60vh] w-auto mx-auto rounded border" />;
  }
  if (isPdf) {
    return <iframe src={item.fileUrl} title={item.fileName} className="w-full h-[60vh] rounded border" />;
  }
  return (
    <Card className="p-8 text-center">
      <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-40" />
      <p className="text-sm text-muted-foreground">Vista previa no disponible para este formato. Descarga el archivo para visualizarlo.</p>
    </Card>
  );
}

