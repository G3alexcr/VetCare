import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "./supabase";
import type { User } from "./mock-data";

type AuthContextType = {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  simulatedRole: User["role"] | null;
  setSimulatedRole: (role: User["role"] | null) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Mapea el rol de clinic_members al código interno (super/admin/vet/reception)
const ROLE_MAP: Record<string, User["role"]> = {
  "Super Administrador": "super",
  Owner: "admin",
  Administrador: "admin",
  "Administrativo": "admin",
  Veterinario: "vet",
  "Recepción": "reception",
  Caja: "admin",
  Inventario: "admin",
  Asistente: "vet",
};

async function loadAppUser(sessionUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): Promise<User | null> {
  const email = (sessionUser.email || "").toLowerCase().trim();

  // 1. Superadmin explícito o metadata
  if (email.includes("superadmin") || sessionUser.user_metadata?.role === "super") {
    return {
      id: sessionUser.id,
      name: (sessionUser.user_metadata?.name as string) ?? email,
      email,
      role: "super",
    };
  }

  // 2. Consulta en clinic_members para verificar si pertenece al staff clínico
  try {
    const { data } = await db.from("clinic_members").select("role").eq("user_id", sessionUser.id).limit(1);
    if (data && data.length > 0 && data[0]?.role) {
      const mappedRole = ROLE_MAP[data[0].role] || "admin";
      return {
        id: sessionUser.id,
        name: (sessionUser.user_metadata?.name as string) ?? email ?? "Staff",
        email,
        role: mappedRole,
      };
    }
  } catch (e) {
    console.error("Error buscando rol en clinic_members:", e);
  }

  // 3. Si no tiene membresía en clinic_members ni es superadmin: NO ES PERSONAL CLÍNICO
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [simulatedRole, setSimulatedRoleState] = useState<User["role"] | null>(() => {
    if (typeof window === "undefined") return null;
    return (localStorage.getItem("vetcare_simulated_role") as User["role"]) || null;
  });

  const setSimulatedRole = (role: User["role"] | null) => {
    setSimulatedRoleState(role);
    if (role) {
      localStorage.setItem("vetcare_simulated_role", role);
    } else {
      localStorage.removeItem("vetcare_simulated_role");
    }
  };

  const effectiveUser = useMemo(() => {
    if (!user) return null;
    if (simulatedRole) {
      return {
        ...user,
        role: simulatedRole,
        name:
          simulatedRole === "vet"
            ? user.name.startsWith("Dr")
              ? user.name
              : `Dr. ${user.name}`
            : user.name,
      };
    }
    return user;
  }, [user, simulatedRole]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!cancelled && data.session?.user) setUser(await loadAppUser(data.session.user));
      } catch (e) {
        console.error("auth:", e);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (!cancelled) {
          if (session?.user) setUser(await loadAppUser(session.user));
          else setUser(null);
        }
      } catch (e) {
        console.error("auth:", e);
      } finally {
        if (!cancelled) setReady(true);
      }
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { ok: false, error: error?.message ?? "Error de autenticación" };
    const appUser = await loadAppUser(data.user);
    if (!appUser) {
      // El usuario existe en Supabase pero no es personal de clínica (es cliente / tutor)
      return { ok: false, isClientOnly: true, error: "Usuario sin rol clínico asignado." };
    }
    setUser(appUser);
    return { ok: true, user: appUser };
  };

  const logout = async () => {
    setSimulatedRole(null);
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser,
        ready,
        login,
        logout,
        simulatedRole,
        setSimulatedRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
