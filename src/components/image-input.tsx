import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePlus, Upload, X, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useStorageUsage, dataUrlSize } from "@/lib/storage";
import { usePlanCapabilities } from "@/lib/saas-store";

type Props = {
  label?: string;
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  placeholder?: string;
  aspect?: "square" | "wide";
  className?: string;
};

// Convierte un archivo a data URL (base64) bajando la resolución para no inflar el localStorage.
function fileToResizedDataUrl(file: File, maxDim = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("imagen inválida"));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ImageInput({ label, value, onChange, placeholder, aspect = "square", className }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlOpen, setUrlOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const caps = usePlanCapabilities();
  const used = useStorageUsage();
  const maxBytes = caps.maxStorageGb * 1024 * 1024 * 1024;

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Selecciona una imagen");
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      const newSize = dataUrlSize(dataUrl);
      if (used + newSize > maxBytes) {
        toast.error(`Almacenamiento del plan superado (${caps.maxStorageGb} GB). Mejora tu plan para subir más imágenes.`);
        e.target.value = "";
        return;
      }
      onChange(dataUrl);
      toast.success("Imagen cargada");
    } catch {
      toast.error("No se pudo procesar la imagen");
    }
    e.target.value = "";
  };

  const applyUrl = () => {
    const u = urlDraft.trim();
    if (!u) return toast.error("Pega una URL");
    onChange(u);
    setUrlOpen(false);
  };

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {label && <Label>{label}</Label>}
      <div className="flex items-start gap-4">
        <div
          className={`${aspect === "square" ? "aspect-square w-36 sm:w-44" : "aspect-video w-full max-w-md"} shrink-0 rounded-xl overflow-hidden border bg-muted grid place-items-center`}
        >
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus className="h-8 w-8 text-muted-foreground/40" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-1" /> Subir imagen
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <Button type="button" variant="outline" size="sm" onClick={() => { setUrlOpen(true); if (value && value.startsWith("http")) setUrlDraft(value); else setUrlDraft(""); }}>
              <Link2 className="h-4 w-4 mr-1" /> Usar URL
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
                <X className="h-4 w-4 mr-1" /> Quitar
              </Button>
            )}
          </div>
          {urlOpen ? (
            <div className="flex gap-2">
              <Input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyUrl(); } }}
                placeholder={placeholder ?? "https://ejemplo.com/imagen.png"}
              />
              <Button type="button" variant="secondary" size="sm" onClick={applyUrl}>Aplicar</Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Sube la imagen desde tu equipo o teléfono (se guarda en base64) o pégala por URL.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
