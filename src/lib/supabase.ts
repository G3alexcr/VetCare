import { createClient } from "@supabase/supabase-js";

// Cliente Supabase sin tipos de esquema — para consultar las tablas dinámicas
// del multi-tenant (clinic_members, clinics, products, sales, etc.).
const url = (import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) as string;
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY) as string;

export const db = createClient(url, key);
