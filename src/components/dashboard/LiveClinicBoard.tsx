import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  Hospital,
  Activity,
  Scissors,
  CheckCircle2,
  Clock,
  User,
  AlertTriangle,
  HeartPulse,
  PawPrint,
  ChevronRight,
  Stethoscope,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppointments, useSurgeries } from "@/lib/store";
import { usePets } from "@/lib/pets-store";
import { useClientes } from "@/lib/clientes-store";
import { useVeterinarios } from "@/lib/veterinarios-store";
import { useHospitalRooms } from "@/lib/hospital-store";

export function LiveClinicBoard() {
  const [activeTab, setActiveTab] = useState<"agenda" | "hospital" | "quirofano">("agenda");
  const navigate = useNavigate();

  const appointments = useAppointments();
  const surgeries = useSurgeries();
  const pets = usePets();
  const clientes = useClientes();
  const vets = useVeterinarios();
  const rooms = useHospitalRooms();

  const today = new Date().toISOString().split("T")[0];

  const todayAppts = appointments
    .filter((a) => a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  const occupiedRooms = rooms.filter((r) => r.status === "Ocupada");

  const todaySurgeries = surgeries.filter(
    (s) => s.surgeryDate === today || s.status === "En proceso" || s.status === "Programada"
  );

  return (
    <Card className="p-4 sm:p-5 border-border/80 shadow-xs flex flex-col h-full">
      {/* Cabecera y Selector de Pestañas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h2 className="font-bold text-base text-foreground flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-primary" />
            Flujo Operativo & Pacientes en Tiempo Real
          </h2>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {/* Pestañas de control */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("agenda")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "agenda"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Agenda Hoy ({todayAppts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("hospital")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "hospital"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Hospital className="h-3.5 w-3.5 text-violet-500" />
            <span>Hospitalizados ({occupiedRooms.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("quirofano")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "quirofano"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Scissors className="h-3.5 w-3.5 text-rose-500" />
            <span>Quirófano ({todaySurgeries.length})</span>
          </button>
        </div>
      </div>

      {/* Contenido según pestaña activa */}
      <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 min-h-[220px] max-h-[360px] pr-1">
        {/* PESTAÑA 1: AGENDA DE HOY */}
        {activeTab === "agenda" && (
          <>
            {todayAppts.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <Calendar className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p>No hay citas agendadas para hoy.</p>
                <Button size="sm" variant="outline" onClick={() => navigate({ to: "/agenda" })}>
                  + Agendar Cita
                </Button>
              </div>
            ) : (
              todayAppts.map((appt) => {
                const pet = pets.find((p) => p.id === appt.petId);
                const client = clientes.find((c) => c.id === appt.clientId);
                const vet = vets.find((v) => v.id === appt.vetId);

                const statusStyles: Record<string, string> = {
                  "Confirmada": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
                  "Pendiente": "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
                  "En atención": "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30 animate-pulse",
                  "Finalizada": "bg-muted text-muted-foreground border-border",
                  "Cancelada": "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
                };

                return (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-all text-xs group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-center w-12 shrink-0">
                        <div className="font-extrabold text-sm text-foreground">{appt.time}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          <span>30m</span>
                        </div>
                      </div>

                      <div className="h-9 w-9 rounded-full bg-primary/10 overflow-hidden shrink-0 border border-border">
                        {pet?.photo ? (
                          <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
                        ) : (
                          <PawPrint className="h-4 w-4 m-2.5 text-primary" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                          <span>{pet?.name || "Paciente"}</span>
                          <span className="text-[11px] text-muted-foreground font-normal">
                            ({pet?.species || "Mascota"})
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          Tutor: <span className="font-medium text-foreground">{client?.fullName || "General"}</span>
                          {vet && ` · Dr(a). ${vet.nombre}`}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate italic">
                          Motivo: {appt.reason || "Consulta de rutina"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`text-[10px] ${statusStyles[appt.status] || ""}`}>
                        {appt.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate({ to: "/consultas" })}
                        className="h-7 text-xs px-2 hover:bg-primary hover:text-primary-foreground"
                      >
                        Atender
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* PESTAÑA 2: HOSPITALIZADOS & SEMÁFORO */}
        {activeTab === "hospital" && (
          <>
            {occupiedRooms.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500/60" />
                <p>Todas las jaulas y salas están libres o desinfectadas en este momento.</p>
                <Button size="sm" variant="outline" onClick={() => navigate({ to: "/hospitalizacion" })}>
                  + Registrar Ingreso
                </Button>
              </div>
            ) : (
              occupiedRooms.map((room) => {
                const pet = pets.find((p) => p.id === room.currentPetId);
                const client = pet ? clientes.find((c) => c.id === pet.clientId) : null;

                // Criterio de semáforo
                const isCritical = room.type === "UCI" || room.notes.toLowerCase().includes("crítico");
                const isWarning = room.type === "Aislamiento" || room.notes.toLowerCase().includes("observación");

                return (
                  <div
                    key={room.id}
                    className="p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Semáforo visual */}
                      <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/40 min-w-16 border border-border/50 text-center shrink-0">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">{room.type}</span>
                        <span className="text-sm font-extrabold text-foreground">{room.code}</span>
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" /> UCI
                          </span>
                        ) : isWarning ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Cuidado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Estable
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-sm text-foreground flex items-center gap-2">
                          <span>{pet?.name || "Paciente internado"}</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            ({pet?.species} · {pet?.breed})
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Tutor: <span className="font-medium text-foreground">{client?.fullName || "Registrado"}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          <span className="font-medium text-foreground">Evolución:</span> {room.notes || "En sueroterapia y observación post-quirúrgica"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate({ to: "/hospitalizacion" })}
                        className="h-7 text-xs"
                      >
                        Ver Ficha Jaula
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* PESTAÑA 3: QUIRÓFANO Y CIRUGÍAS */}
        {activeTab === "quirofano" && (
          <>
            {todaySurgeries.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <Scissors className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p>No hay procedimientos quirúrgicos programados para hoy.</p>
              </div>
            ) : (
              todaySurgeries.map((surg) => {
                const pet = pets.find((p) => p.id === surg.petId);
                const client = pet ? clientes.find((c) => c.id === pet.clientId) : null;

                return (
                  <div
                    key={surg.id}
                    className="p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 grid place-items-center shrink-0">
                        <Scissors className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground flex items-center gap-2">
                          <span>{surg.procedureType || "Intervención Quirúrgica"}</span>
                          <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-700 border-rose-500/30">
                            {surg.status}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Paciente: <span className="font-semibold text-foreground">{pet?.name}</span> ({pet?.species}) · Cirujano: Dr(a). {surg.veterinarian || "Asignado"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Anestesia: {surg.anesthesiaType || "Inhalatoria"} · Ayuno pre-quirúrgico verificado
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate({ to: "/consultas" })}
                      className="h-7 text-xs shrink-0"
                    >
                      Protocolo Quirúrgico
                    </Button>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      <div className="pt-3 mt-auto border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
        <span>Actualización automática en tiempo real</span>
        <Link to="/agenda" className="text-primary font-medium hover:underline flex items-center gap-0.5">
          <span>Abrir Agenda Completa</span>
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </Card>
  );
}
