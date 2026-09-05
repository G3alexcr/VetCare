import { useEffect } from "react";
import { getHydrators } from "@/lib/db-hooks";
import { getCurrentClinicId, setCurrentClinic, setActingClinic } from "@/lib/saas-store";

// Hidrata todos los stores desde Supabase al montar la app autenticada.
// También lee ?clinic= de la URL para abrir una clínica en una pestaña nueva
// (antes se hacía con localStorage; ahora se pasa por query param).
export function DataHydrator() {
  useEffect(() => {
    // Boot: leer ?clinic= y fijar la clínica activa/actuando (sin localStorage).
    const url = new URL(window.location.href);
    const clinic = url.searchParams.get("clinic");
    if (clinic) {
      setCurrentClinic(clinic);
      setActingClinic(clinic);
      url.searchParams.delete("clinic");
      window.history.replaceState({}, "", url.toString());
    }

    (async () => {
      const cid = getCurrentClinicId();
      await Promise.all(getHydrators().map((h) => h(cid)));
    })().catch((e) => console.error("[DataHydrator]", e));
  }, []);

  return null;
}
