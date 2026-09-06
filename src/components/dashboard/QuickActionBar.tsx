import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  PlusCircle,
  Pill,
  CalendarPlus,
  PawPrint,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePets } from "@/lib/pets-store";
import { useClientes } from "@/lib/clientes-store";
import { VademecumModal } from "./VademecumModal";

export function QuickActionBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [vademecumOpen, setVademecumOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const pets = usePets();
  const clientes = useClientes();

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = searchTerm.trim().length > 1
    ? pets.filter((p) => {
        const client = clientes.find((c) => c.id === p.clientId);
        const term = searchTerm.toLowerCase();
        return (
          p.name.toLowerCase().includes(term) ||
          p.breed.toLowerCase().includes(term) ||
          p.species.toLowerCase().includes(term) ||
          (p.microchip && p.microchip.includes(term)) ||
          (client && client.fullName.toLowerCase().includes(term))
        );
      }).slice(0, 5)
    : [];

  return (
    <>
      <div className="bg-card border border-border/80 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Buscador Universal */}
        <div ref={searchRef} className="relative w-full lg:max-w-md">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar paciente por nombre, microchip o tutor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              className="pl-9 pr-4 h-9.5 text-xs bg-muted/40 border-border/70 rounded-xl focus-visible:ring-primary"
            />
          </div>

          {/* Menú desplegable de resultados instantáneos */}
          {dropdownOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-border/60">
              <div className="p-2 text-[10px] uppercase font-bold text-muted-foreground bg-muted/30">
                Pacientes encontrados
              </div>
              {searchResults.map((pet) => {
                const client = clientes.find((c) => c.id === pet.clientId);
                return (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      setSearchTerm("");
                      navigate({ to: "/mascotas" });
                    }}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-muted/60 transition-colors text-left text-xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary/10 overflow-hidden shrink-0 border border-border">
                        {pet.photo ? (
                          <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
                        ) : (
                          <PawPrint className="h-4 w-4 m-2 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <span>{pet.name}</span>
                          <span className="text-[11px] text-muted-foreground font-normal">
                            ({pet.species} · {pet.breed})
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Tutor: <span className="font-medium text-foreground">{client?.fullName || "Sin tutor"}</span>
                          {pet.microchip && ` · Chip: ${pet.microchip}`}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Barra de Atajos de Acción Rápida */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {/* Botón Rojo: Urgencia / Nueva Consulta */}
          <Button
            size="sm"
            onClick={() => navigate({ to: "/consultas" })}
            className="h-9 px-3 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-xs gap-1.5 cursor-pointer"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>+ Nueva Consulta / Urgencia</span>
          </Button>

          {/* Botón Vademécum */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setVademecumOpen(true)}
            className="h-9 px-3 text-xs font-medium rounded-xl border-border hover:bg-muted gap-1.5 cursor-pointer"
          >
            <Pill className="h-4 w-4 text-[#009d9e]" />
            <span>Vademécum & Dosis</span>
          </Button>

          {/* Botón Agendar Cita */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate({ to: "/agenda" })}
            className="h-9 px-3 text-xs font-medium rounded-xl border-border hover:bg-muted gap-1.5 cursor-pointer"
          >
            <CalendarPlus className="h-4 w-4 text-emerald-600" />
            <span>Agendar Cita</span>
          </Button>

          {/* Botón Registrar Paciente */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate({ to: "/mascotas" })}
            className="h-9 px-3 text-xs font-medium rounded-xl border-border hover:bg-muted gap-1.5 cursor-pointer"
          >
            <PawPrint className="h-4 w-4 text-sky-600" />
            <span>+ Paciente</span>
          </Button>
        </div>
      </div>

      <VademecumModal open={vademecumOpen} onOpenChange={setVademecumOpen} />
    </>
  );
}
