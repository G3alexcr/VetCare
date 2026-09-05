import { useMemo, useSyncExternalStore } from "react";
import { useCurrentClinicId } from "./saas-store";

// Devuelve solo los registros de la clínica activa. Reactivo a cambios de
// clínica y de datos (usa getSnapshot estable para evitar re-renders infinitos).
export function useTenantSlice<T extends { clinicId: string }>(
  subscribe: (cb: () => void) => () => void,
  get: () => T[],
): T[] {
  const cid = useCurrentClinicId();
  useSyncExternalStore(subscribe, get, get);
  return useMemo(() => get().filter((x) => x.clinicId === cid), [get(), cid]);
}
