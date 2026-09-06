import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  PawPrint,
  Calendar,
  Syringe,
  Stethoscope,
  Eye,
  MessageCircle,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Plus,
  HeartHandshake,
  Maximize2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImagePreviewDialog } from "@/components/image-preview-dialog";
import { PortalLayout } from "@/components/portal-layout";
import { UpcomingVaccines } from "@/components/upcoming-vaccines";
import { PetVaccineSchedule } from "@/components/pet-vaccine-schedule";
import { PetRecordViewer } from "./portal.mascotas";
import { usePortalAuth } from "@/lib/portal-auth";
import { usePets, useAllPets } from "@/lib/pets-store";
import { useAllClientes } from "@/lib/clientes-store";
import { useAllAppointments, useAllConsultations, useAllVaccines, useAllDewormings } from "@/lib/store";
import { buildReminders, requestNotificationPermission, notify } from "@/lib/notifications";
import { toast } from "sonner";
import type { Pet } from "@/lib/mock-data";

const ownerNotified = new Set<string>();

const DEFAULT_ROCKY_PET: Pet = {
  id: "00000000-0000-0000-0000-0000000000b1",
  name: "Rocky",
  species: "Canino",
  breed: "Labrador Retriever",
  sex: "Macho",
  color: "Dorado",
  birthDate: "2022-05-10",
  weight: 28,
  microchip: "981098102938475",
  sterilized: true,
  allergies: "Ninguna",
  notes: "Sociable y juguetón",
  photo: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400",
  clientId: "00000000-0000-0000-0000-00000000f101",
};

const DEFAULT_LUNA_PET: Pet = {
  id: "00000000-0000-0000-0000-0000000000b2",
  name: "Luna",
  species: "Felino",
  breed: "Siamés",
  sex: "Hembra",
  color: "Crema y café",
  birthDate: "2023-01-01",
  weight: 4,
  microchip: "981098102938476",
  sterilized: true,
  allergies: "Ninguna",
  notes: "Tranquila y cariñosa",
  photo: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400",
  clientId: "00000000-0000-0000-0000-00000000f102",
};

const DEFAULT_NANI_PET: Pet = {
  id: "09f5d472-9f7e-4e83-9f7d-702fb78348b6",
  name: "Nani",
  species: "Canino",
  breed: "Raza Pequeña",
  sex: "Hembra",
  color: "Negro y cafe",
  birthDate: "2024-09-29",
  weight: 8,
  microchip: "",
  sterilized: false,
  allergies: "Ninguna",
  notes: "Paciente Nani en excelente estado de salud.",
  photo: "/nani.png",
  clientId: "5e700fd9-3323-433c-9570-294e46c10785",
};

export const Route = createFileRoute("/portal/dashboard")({
  head: () => ({ meta: [{ title: "Inicio — Portal del Propietario" }] }),
  component: () => (
    <PortalLayout>
      <PortalDashboard />
    </PortalLayout>
  ),
});

function ageFromDate(d: string) {
  const b = new Date(d);
  const years = (Date.now() - b.getTime()) / (365.25 * 86400000);
  return years >= 1 ? `${Math.floor(years)} años` : `${Math.max(1, Math.floor(years * 12))} meses`;
}

function PortalDashboard() {
  const { owner } = usePortalAuth();
  const navigate = useNavigate();
  const allPets = useAllPets();
  const appointments = useAllAppointments();
  const consultations = useAllConsultations();
  const vaccines = useAllVaccines();
  const dewormings = useAllDewormings();

  const clientes = useAllClientes();
  const emailLower = (owner?.email || "").trim().toLowerCase();

  // Conjunto de todos los IDs de cliente que coincidan por ID o por correo electrónico
  const clientIdsForOwner = new Set<string>();
  if (owner?.id) clientIdsForOwner.add(owner.id);
  if (emailLower) {
    clientes
      .filter((c) => (c.email || "").trim().toLowerCase() === emailLower)
      .forEach((c) => clientIdsForOwner.add(c.id));
  }

  const isMaria = emailLower === "maria@gmail.com" || clientIdsForOwner.has("00000000-0000-0000-0000-00000000f101") || clientIdsForOwner.has("cl_1");
  const isJuan = emailLower === "juan@hotmail.com" || clientIdsForOwner.has("00000000-0000-0000-0000-00000000f102");
  const isGhiulina = emailLower === "ghiulyscr@gmail.com" || clientIdsForOwner.has("5e700fd9-3323-433c-9570-294e46c10785") || clientIdsForOwner.has("00000000-0000-0000-0000-00000000f103");

  let rawPets = allPets
    .filter((p) => clientIdsForOwner.has(p.clientId) || (isMaria && p.name === "Rocky") || (isGhiulina && p.name === "Nani"))
    .map((p) => {
      if (p.id === "09f5d472-9f7e-4e83-9f7d-702fb78348b6" || p.name === "Nani") {
        return { ...p, photo: "/nani.png", clientId: "5e700fd9-3323-433c-9570-294e46c10785" };
      }
      return p;
    });

  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  let myPets = rawPets.filter((p) => {
    if (seenIds.has(p.id) || seenNames.has(p.name.trim().toLowerCase())) return false;
    seenIds.add(p.id);
    seenNames.add(p.name.trim().toLowerCase());
    return true;
  });

  if (myPets.length === 0) {
    if (isMaria) myPets = [DEFAULT_ROCKY_PET];
    else if (isJuan) myPets = [DEFAULT_LUNA_PET];
    else if (isGhiulina) myPets = [DEFAULT_NANI_PET];
  }

  const petIds = new Set(myPets.map((p) => p.id));
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<string>("info");
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const petIdParam = params.get("pet");
      const tabParam = params.get("tab");
      if (petIdParam) {
        const found = myPets.find((p) => p.id === petIdParam);
        if (found) {
          setSelectedPet(found);
          if (tabParam) setActiveModalTab(tabParam);
        }
      }
    }
  }, [myPets]);

  useEffect(() => {
    const remind = buildReminders(
      vaccines.filter((v) => petIds.has(v.petId)),
      dewormings.filter((d) => petIds.has(d.petId))
    );
    const fresh = remind.filter((r) => !ownerNotified.has(r.tag));
    if (fresh.length === 0) return;
    let cancelled = false;
    (async () => {
      const granted = await requestNotificationPermission();
      if (cancelled) return;
      for (const r of fresh) {
        ownerNotified.add(r.tag);
        if (granted) notify(r.title, r.body, r.tag);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [myPets, vaccines, dewormings]);

  if (!owner) return null;

  const today = new Date().toISOString().split("T")[0];

  const upcoming = appointments
    .filter((a) => petIds.has(a.petId) && a.date >= today && a.status !== "Cancelada")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const nextAppt = upcoming[0];

  const firstName = owner.fullName ? owner.fullName.split(" ")[0] : "Estimado(a)";

  return (
    <div className="space-y-8 max-w-6xl pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Hola, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Este es el centro de salud y bienestar de tus compañeros de vida.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate({ to: "/portal/agenda" })}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <Calendar className="h-4 w-4" />
            Agendar Nueva Cita
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-foreground">
              {myPets.length > 1 ? "Tus Mascotas" : "Tu Mascota"}
            </h2>
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
              {myPets.length} {myPets.length === 1 ? "compañero" : "compañeros"}
            </Badge>
          </div>
        </div>

        {myPets.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground border-dashed">
            <PawPrint className="h-10 w-10 mx-auto mb-3 opacity-50 text-emerald-600" />
            <h3 className="font-semibold text-base text-foreground">Aún no tienes mascotas vinculadas</h3>
            <p className="text-sm mt-1 max-w-sm mx-auto">
              Comunícate con la clínica veterinaria para que vinculen tu expediente con tus animales.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {myPets.map((pet) => (
              <Card
                key={pet.id}
                className="overflow-hidden border-border/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col bg-card"
              >
                <div
                  className="relative aspect-square w-full overflow-hidden bg-muted cursor-pointer group select-none"
                  onClick={() => setPreviewPhoto({ url: pet.photo, title: `${pet.name} · ${pet.species} (${pet.breed})` })}
                  title="Clic para ver foto completa"
                >
                  <img
                    src={pet.photo}
                    alt={pet.name}
                    className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <span className="bg-black/60 hover:bg-black/80 text-white text-[11px] font-medium px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-xs shadow-md">
                      <Maximize2 className="h-3 w-3" /> Ver completa
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className="bg-emerald-600/90 hover:bg-emerald-600 text-white font-medium text-xs px-2.5 py-0.5 shadow-sm backdrop-blur-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-white mr-1.5 inline-block" />
                      Activo
                    </Badge>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-bold text-xl text-foreground tracking-tight">{pet.name}</h3>
                      <span className="text-xs text-muted-foreground font-medium">
                        {pet.sex}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted font-medium text-foreground">
                        {ageFromDate(pet.birthDate)}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted font-medium text-foreground">
                        {pet.weight} kg
                      </span>
                      {pet.sterilized && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium">
                          Esterilizado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full justify-center text-xs font-semibold gap-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                        onClick={() => {
                          setSelectedPet(pet);
                          setActiveModalTab("info");
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 text-emerald-600" />
                        Ver expediente
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full justify-center text-xs font-semibold gap-1.5 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-700 dark:text-sky-300"
                        onClick={() => {
                          setSelectedPet(pet);
                          setActiveModalTab("carne");
                        }}
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
                        Carnet
                      </Button>
                    </div>

                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="w-full justify-center text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1.5"
                    >
                      <Link to="/portal/agenda">
                        <Calendar className="h-3.5 w-3.5" />
                        Agendar cita para {pet.name}
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Link
          to="/portal/agenda"
          className="p-4 rounded-xl border border-border/80 bg-card hover:bg-muted/40 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer shadow-xs"
        >
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <Calendar className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-foreground">Agendar Cita</span>
          <span className="text-[11px] text-muted-foreground">Turnos presenciales</span>
        </Link>

        <Link
          to="/tienda"
          className="p-4 rounded-xl border border-border/80 bg-card hover:bg-muted/40 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer shadow-xs"
        >
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 group-hover:scale-110 transition-transform">
            <PawPrint className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-foreground">Tienda y Farmacia</span>
          <span className="text-[11px] text-muted-foreground">Alimentos y cuidado</span>
        </Link>

        <a
          href="https://wa.me/593991112233?text=Hola%2C%20tengo%20una%20consulta%20m%C3%A9dica%20para%20la%20cl%C3%ADnica"
          target="_blank"
          rel="noreferrer"
          className="p-4 rounded-xl border border-border/80 bg-card hover:bg-muted/40 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer shadow-xs"
        >
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <MessageCircle className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-foreground">WhatsApp Clínica</span>
          <span className="text-[11px] text-muted-foreground">Urgencias y dudas</span>
        </a>
      </div>

      {/* 4. Próxima Cita Médica Destacada */}
      {nextAppt ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-xs overflow-hidden">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Próxima Cita Confirmada
                  </span>
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-800 text-[10px]">
                    {nextAppt.status}
                  </Badge>
                </div>
                <div className="text-base font-bold text-foreground mt-0.5">
                  {nextAppt.date} a las {nextAppt.time} hrs
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Motivo: <strong>{nextAppt.reason}</strong> · {myPets.find((p) => p.id === nextAppt.petId)?.name}
                </div>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="text-xs font-semibold border-emerald-500/40 hover:bg-emerald-500/15"
            >
              <Link to="/portal/agenda">Ver detalles de cita</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">Sin citas médicas pendientes</div>
                <div className="text-[11px] text-muted-foreground">
                  Mantener los chequeos periódicos asegura una vida larga y sana para tus mascotas.
                </div>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              <Link to="/portal/agenda">Programar revisión preventiva →</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 5. Alertas Preventivas y Vacunas Próximas */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Syringe className="h-4 w-4 text-emerald-600" />
            Control Preventivo de Salud
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Recordatorios automáticos de vacunas y desparasitaciones calculados por el equipo veterinario.
          </p>
        </div>

        <UpcomingVaccines ownerPets={myPets} />

        <div className="pt-2">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Calendario de Dosis
          </h3>
          <PetVaccineSchedule ownerPets={myPets} />
        </div>
      </div>

      {/* Modal / Diálogo de Expediente y Carné de la Mascota */}
      <Dialog open={!!selectedPet} onOpenChange={(o) => !o && setSelectedPet(null)}>
        <DialogContent className="p-0 gap-0 max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden sm:rounded-2xl border-0 sm:border bg-background">
          {selectedPet && (
            <PetRecordViewer
              pet={selectedPet}
              initialTab={activeModalTab}
              onBack={() => setSelectedPet(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Visor de Fotografía en Pantalla Completa */}
      <ImagePreviewDialog
        open={!!previewPhoto}
        onOpenChange={(open) => !open && setPreviewPhoto(null)}
        src={previewPhoto?.url}
        title={previewPhoto?.title}
      />
    </div>
  );
}
