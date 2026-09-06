import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Client } from "./mock-data";
import { getAllClientes } from "./clientes-store";
import { db } from "./supabase";

type Ctx = {
  owner: Client | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateOwner: (patch: Partial<Client>) => void;
};

const PortalAuthContext = createContext<Ctx | null>(null);

const KNOWN_DEMO_CLIENTS: Record<string, Client> = {
  "maria@gmail.com": {
    id: "00000000-0000-0000-0000-00000000f101",
    fullName: "María Rodríguez",
    identification: "1712345678",
    phone: "+506 8811 3344",
    whatsapp: "+506 8811 3344",
    email: "maria@gmail.com",
    address: "Av. Principal 123",
    registeredAt: "2024-01-15",
    notes: "",
  },
  "juan@hotmail.com": {
    id: "00000000-0000-0000-0000-00000000f102",
    fullName: "Juan Pérez",
    identification: "1723456789",
    phone: "+506 8822 4455",
    whatsapp: "+506 8822 4455",
    email: "juan@hotmail.com",
    address: "Calle Los Pinos 45",
    registeredAt: "2024-02-10",
    notes: "",
  },
  "ghiulyscr@gmail.com": {
    id: "5e700fd9-3323-433c-9570-294e46c10785",
    fullName: "Ghiulina S",
    identification: "987654321",
    phone: "87888990",
    whatsapp: "87888990",
    email: "ghiulyscr@gmail.com",
    address: "Heredia Costa Rica",
    registeredAt: "2026-09-06",
    notes: "Tutor(a) de Nani",
  },
};

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [owner, setOwner] = useState<Client | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("vetcare_portal_owner");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email && KNOWN_DEMO_CLIENTS[parsed.email.toLowerCase()]) {
          const matched = KNOWN_DEMO_CLIENTS[parsed.email.toLowerCase()];
          const healed = { ...matched, ...parsed, id: matched.id, fullName: matched.fullName };
          localStorage.setItem("vetcare_portal_owner", JSON.stringify(healed));
          return healed;
        }
        return parsed;
      } catch {}
    }
    return null;
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const login = async (email: string, _password: string): Promise<{ ok: boolean; error?: string }> => {
    const clean = email.trim().toLowerCase();
    let found = getAllClientes().find((c) => c.email.toLowerCase() === clean);
    if (!found) {
      try {
        const { data } = await db.from("clients").select("*").ilike("email", clean).limit(1);
        if (data && data.length > 0) {
          const r = data[0] as Record<string, unknown>;
          const name = String((r.full_name || r.name) ?? "");
          found = {
            id: String(r.id),
            name,
            fullName: name,
            identification: String(r.identification ?? ""),
            phone: String(r.phone ?? ""),
            whatsapp: String(r.whatsapp ?? ""),
            email: String(r.email ?? ""),
            address: String(r.address ?? ""),
            registeredAt: String(r.registered_at ?? ""),
            notes: String(r.notes ?? ""),
            clinicId: String(r.clinic_id ?? ""),
            createdAt: String(r.created_at ?? ""),
          };
        }
      } catch (e) {
        console.error("Error buscando cliente en Supabase:", e);
      }
    }

    const fallback = KNOWN_DEMO_CLIENTS[clean];
    const client: Client = found
      ? {
          id: found.id,
          fullName: found.fullName || found.name,
          identification: found.identification,
          phone: found.phone,
          whatsapp: found.whatsapp,
          email: found.email,
          address: found.address,
          registeredAt: found.registeredAt,
          notes: found.notes,
        }
      : fallback || {
          id: crypto.randomUUID(),
          fullName: clean.split("@")[0],
          identification: "",
          phone: "",
          whatsapp: "",
          email: clean,
          address: "",
          registeredAt: new Date().toISOString().split("T")[0],
          notes: "Propietario registrado",
        };

    setOwner(client);
    try {
      localStorage.setItem("vetcare_portal_owner", JSON.stringify(client));
    } catch {}
    return { ok: true };
  };

  const logout = () => {
    setOwner(null);
    try {
      localStorage.removeItem("vetcare_portal_owner");
    } catch {}
  };

  const updateOwner = (patch: Partial<Client>) => {
    setOwner((cur) => {
      if (!cur) return cur;
      const updated = { ...cur, ...patch };
      try {
        localStorage.setItem("vetcare_portal_owner", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  return (
    <PortalAuthContext.Provider value={{ owner, ready, login, logout, updateOwner }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error("usePortalAuth must be used within PortalAuthProvider");
  return ctx;
}
