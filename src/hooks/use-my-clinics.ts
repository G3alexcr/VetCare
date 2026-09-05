import { useClinics, type Clinic } from "@/lib/saas-store";

// Clínicas accesibles para el usuario actual. Supabase ya filtra por pertenencia
// (RLS: el super admin ve todas, cada usuario ve las suyas), así que devolvemos
// la lista hidratada directamente desde la BD.
export function useMyClinics(): Clinic[] {
  return useClinics();
}
