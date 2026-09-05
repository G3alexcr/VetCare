import { useEffect } from "react";
import { useCurrentClinicId } from "./saas-store";

// Mapea filas de base de datos (snake_case) → tipo de la app (camelCase).
export function pick<T>(row: Record<string, unknown>, keys: (keyof T)[]): T {
  const out: Record<string, unknown> = {};
  for (const k of keys) out[k as string] = row[k as string];
  return out as T;
}

export type DbRow = Record<string, unknown>;

// Convierte una fila de DB en un objeto con `id` y `clinicId` ya formateados.
export function rowOf<T extends { id: string; clinicId: string }>(row: DbRow): T {
  return {
    ...(row as unknown as T),
    id: String(row.id),
    clinicId: String(row.clinic_id),
  } as T;
}

// ---------------------------------------------------------------------------
// Registro de hidratadores de store. Cada módulo registra su cargador al
// importarse y el DataHydrator los ejecuta al montar / al cambiar de clínica.
// ---------------------------------------------------------------------------
export type Hydrator = (clinicId: string) => Promise<void>;
const hydrators: Hydrator[] = [];
export function registerHydrator(fn: Hydrator) {
  hydrators.push(fn);
}
export function getHydrators(): Hydrator[] {
  return hydrators;
}

// Runs an async loader scoped to the active clinic whenever it mounts or changes.
export function useDbSync(loader: (clinicId: string) => Promise<void>) {
  const cid = useCurrentClinicId();
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await loader(cid);
      } catch (e) {
        console.error("[useDbSync]", e);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid]);
}
