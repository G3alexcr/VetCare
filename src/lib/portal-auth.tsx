import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Client } from "./mock-data";
import { getAllClientes } from "./clientes-store";

type Ctx = {
  owner: Client | null;
  ready: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
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
          const healed = { ...matched, ...parsed, id: matched.id };
          localStorage.setItem("vetcare_portal_owner", JSON.stringify(healed));
          return healed;
        }
        return parsed;
      } catch {}
    }
    return KNOWN_DEMO_CLIENTS["maria@gmail.com"];
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const login = (email: string, _password: string) => {
    const found = getAllClientes().find((c) => c.email.toLowerCase() === email.toLowerCase());
    const fallback = KNOWN_DEMO_CLIENTS[email.toLowerCase()];
    if (!found && !fallback) return { ok: false, error: "Propietario no encontrado" };
    // Construye el owner con la forma de `Client` a partir del Cliente de la DB o fallback.
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
      : fallback!;
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
