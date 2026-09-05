import { usePosProducts } from "./pos-store";
import { useVeterinarios } from "./veterinarios-store";
import { usePetPhotos, usePetFiles } from "./store";
import { useClinics, useCurrentClinicId } from "./saas-store";

// Tamaño aproximado (bytes) de una data URL base64.
export function dataUrlSize(url: string): number {
  if (!url || !url.startsWith("data:")) return 0;
  const comma = url.indexOf(",");
  if (comma < 0) return 0;
  const b64 = url.slice(comma + 1);
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((b64.length * 3) / 4) - padding);
}

// Almacenamiento usado (bytes) por imágenes base64 de la clínica activa (reactivo).
export function useStorageUsage(): number {
  const products = usePosProducts();
  const vets = useVeterinarios();
  const photos = usePetPhotos();
  const files = usePetFiles();
  const clinicId = useCurrentClinicId();
  const clinics = useClinics();
  const logo = clinics.find((c) => c.id === clinicId)?.logoUrl ?? "";
  let bytes = 0;
  for (const p of products) bytes += dataUrlSize(p.image ?? "");
  for (const v of vets) bytes += dataUrlSize(v.foto ?? "");
  for (const ph of photos) bytes += dataUrlSize(ph.photoUrl);
  for (const f of files) bytes += dataUrlSize(f.fileUrl);
  bytes += dataUrlSize(logo);
  return bytes;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}
