import React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ShieldAlert,
  AlertTriangle,
  Package,
  MessageCircle,
  Phone,
  CheckCircle2,
  Syringe,
  ChevronRight,
  ExternalLink,
  Pill,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVaccines, useDewormings, useSurgeries } from "@/lib/store";
import { usePets } from "@/lib/pets-store";
import { useClientes } from "@/lib/clientes-store";
import { useProducts } from "@/lib/inventory-store";

export function ClinicalAlertsTray() {
  const vaccines = useVaccines();
  const dewormings = useDewormings();
  const surgeries = useSurgeries();
  const pets = usePets();
  const clientes = useClientes();
  const products = useProducts();
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Vacunas vencidas o por vencer en 7 días
  const overdueVaccines = vaccines
    .filter((v) => v.nextDueDate && v.nextDueDate <= todayStr)
    .slice(0, 4);

  // 2. Fármacos en stock crítico
  const lowStockProducts = products
    .filter((p) => Number(p.stock) <= Number(p.minStock))
    .slice(0, 4);

  // 3. Seguimiento post-operatorio (Cirugías de los últimos 3 días)
  const recentSurgeries = surgeries
    .filter((s) => s.status === "Finalizada" || s.status === "En proceso")
    .slice(0, 3);

  const buildWhatsAppLink = (clientPhone: string, petName: string, vaccineName: string) => {
    const cleanPhone = clientPhone.replace(/\D/g, "") || "50622229999";
    const msg = `Hola, te recordamos desde la clínica veterinaria que tu mascota *${petName}* tiene pendiente su refuerzo de *${vaccineName}*. ¿Deseas agendar tu cita para esta semana?`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Tarjeta 1: Alertas Sanitarias (Vacunas / Desparasitaciones por vencer) */}
      <Card className="p-4 sm:p-5 border-border/80 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 grid place-items-center shrink-0">
                <Syringe className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Vacunación & Refuerzos</h3>
                <p className="text-[11px] text-muted-foreground">Pendientes o vencidos para contacto</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-500/30">
              {overdueVaccines.length} alertas
            </Badge>
          </div>

          <div className="pt-3 space-y-2.5">
            {overdueVaccines.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
                <CheckCircle2 className="h-6 w-6 text-emerald-500/70" />
                <span>Todos los pacientes están al día con sus vacunas.</span>
              </div>
            ) : (
              overdueVaccines.map((v) => {
                const pet = pets.find((p) => p.id === v.petId);
                const client = pet ? clientes.find((c) => c.id === pet.clientId) : null;

                return (
                  <div
                    key={v.id}
                    className="p-2.5 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate flex items-center gap-1">
                        <span>{pet?.name || "Paciente"}</span>
                        <span className="text-[10px] text-amber-600 font-medium">({v.vaccineName})</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        Tutor: {client?.fullName || "General"} · {client?.phone || "Sin teléfono"}
                      </div>
                      <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                        Venció: {v.nextDueDate}
                      </div>
                    </div>

                    {client?.phone ? (
                      <a
                        href={buildWhatsAppLink(client.phone, pet?.name || "tu mascota", v.vaccineName)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-[11px] shrink-0 transition-colors shadow-xs"
                        title="Enviar recordatorio por WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    ) : (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        Sin tel.
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-3 mt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Notificaciones preventivas</span>
          <Link to="/mascotas" className="text-primary hover:underline font-medium">
            Ver todas →
          </Link>
        </div>
      </Card>

      {/* Tarjeta 2: Stock Crítico de Farmacia & Insumos */}
      <Card className="p-4 sm:p-5 border-border/80 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 grid place-items-center shrink-0">
                <Package className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Stock Crítico Farmacia</h3>
                <p className="text-[11px] text-muted-foreground">Fármacos por debajo del mínimo</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-700 border-rose-500/30">
              {lowStockProducts.length} reposiciones
            </Badge>
          </div>

          <div className="pt-3 space-y-2.5">
            {lowStockProducts.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
                <CheckCircle2 className="h-6 w-6 text-emerald-500/70" />
                <span>Inventario de farmacia en niveles óptimos.</span>
              </div>
            ) : (
              lowStockProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="p-2.5 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{prod.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Categoría: {prod.category} · Lote: {prod.lot || "General"}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-extrabold text-rose-600 dark:text-rose-400">
                      {prod.stock} {prod.unit}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Mín: {prod.minStock}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-3 mt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Insumos médicos</span>
          <Link to="/inventario" className="text-primary hover:underline font-medium">
            Gestionar Stock →
          </Link>
        </div>
      </Card>

      {/* Tarjeta 3: Seguimiento Post-Quirúrgico & Pacientes en Control */}
      <Card className="p-4 sm:p-5 border-border/80 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-600 grid place-items-center shrink-0">
                <Phone className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Llamadas Post-Operatorias</h3>
                <p className="text-[11px] text-muted-foreground">Control de evolución 24-48h</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-700 border-sky-500/30">
              {recentSurgeries.length} pendientes
            </Badge>
          </div>

          <div className="pt-3 space-y-2.5">
            {recentSurgeries.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
                <CheckCircle2 className="h-6 w-6 text-emerald-500/70" />
                <span>No hay llamadas de control pendientes para hoy.</span>
              </div>
            ) : (
              recentSurgeries.map((s) => {
                const pet = pets.find((p) => p.id === s.petId);
                const client = pet ? clientes.find((c) => c.id === pet.clientId) : null;

                return (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate flex items-center gap-1">
                        <span>{pet?.name}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          ({s.procedureType})
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        Tutor: {client?.fullName} · {client?.phone || "Sin tel."}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Cirujano: Dr(a). {s.veterinarian}
                      </div>
                    </div>

                    <a
                      href={client?.phone ? `tel:${client.phone}` : "#"}
                      className="h-7 px-2.5 rounded-lg border border-border hover:bg-muted font-medium text-[11px] inline-flex items-center gap-1 shrink-0"
                    >
                      <Phone className="h-3 w-3 text-sky-600" />
                      <span>Llamar</span>
                    </a>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-3 mt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Evolución clínica</span>
          <Link to="/consultas" className="text-primary hover:underline font-medium">
            Ver expedientes →
          </Link>
        </div>
      </Card>
    </div>
  );
}
