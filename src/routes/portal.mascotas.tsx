import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Eye,
  PawPrint,
  ArrowLeft,
  X,
  Stethoscope,
  Calendar,
  Syringe,
  ShieldCheck,
  Clock,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CarnetTab } from "@/components/carnet-tab";
import { ImageInput } from "@/components/image-input";
import { PortalLayout } from "@/components/portal-layout";
import { usePortalAuth } from "@/lib/portal-auth";
import { type Pet } from "@/lib/mock-data";
import { usePets, useAllPets, updatePet } from "@/lib/pets-store";
import { useAllVeterinarios } from "@/lib/veterinarios-store";
import {
  useAllAppointments,
  useAllConsultations,
  useAllVaccines,
  useAllDewormings,
  useAllSurgeries,
  useAllHospitalizations,
  useAllPetFiles,
  useAllPetPhotos,
  addPetPhoto,
  deletePetPhoto,
  SEED_VACCINES,
  SEED_DEWORMINGS,
  SEED_CONSULTATIONS,
  SEED_SURGERIES,
  SEED_PET_PHOTOS,
} from "@/lib/store";
import { toast } from "sonner";

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

const MAX_FOTOS = 3;

export const Route = createFileRoute("/portal/mascotas")({
  beforeLoad: ({ search }: { search: Record<string, unknown> }) => {
    throw redirect({
      to: "/portal/dashboard",
      search,
    });
  },
  head: () => ({ meta: [{ title: "Mis mascotas — Portal" }] }),
  component: () => (
    <PortalLayout>
      <MyPetsPage />
    </PortalLayout>
  ),
});

function ageFromDate(d: string) {
  const b = new Date(d);
  const years = (Date.now() - b.getTime()) / (365.25 * 86400000);
  return years >= 1 ? `${Math.floor(years)} años` : `${Math.max(1, Math.floor(years * 12))} meses`;
}

function MyPetsPage() {
  const { owner } = usePortalAuth();
  const allPets = useAllPets();
  const [selected, setSelected] = useState<Pet | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("info");
  if (!owner) return null;

  const isMaria = owner.email?.toLowerCase() === "maria@gmail.com" || owner.id === "00000000-0000-0000-0000-00000000f101" || owner.id === "cl_1";
  const isJuan = owner.email?.toLowerCase() === "juan@hotmail.com" || owner.id === "00000000-0000-0000-0000-00000000f102";

  const targetClientId = isMaria
    ? "00000000-0000-0000-0000-00000000f101"
    : isJuan
    ? "00000000-0000-0000-0000-00000000f102"
    : owner.id;

  let pets = allPets.filter((p) => p.clientId === targetClientId || (isMaria && p.name === "Rocky"));
  if (pets.length === 0) {
    if (isMaria) pets = [DEFAULT_ROCKY_PET];
    else if (isJuan) pets = [DEFAULT_LUNA_PET];
  }

  // Leer parámetros ?tab= y ?pet= de la URL (ej. desde el Dashboard u otros accesos)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const petParam = params.get("pet");

    if (tabParam) {
      setCurrentTab(tabParam);
    }
    if (pets.length > 0) {
      if (petParam) {
        const found = pets.find((p) => p.id === petParam || p.name.toLowerCase() === petParam.toLowerCase());
        if (found) setSelected(found);
      } else if (tabParam === "carne" && pets.length === 1) {
        setSelected(pets[0]);
      }
    }
  }, [pets.length]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Mis mascotas</h1>
        <p className="text-muted-foreground text-sm">Consulta el expediente clínico y carnet de cada una.</p>
      </div>

      {pets.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <PawPrint className="h-8 w-8 mx-auto mb-2 opacity-60" />
          Aún no tienes mascotas registradas.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <img src={p.photo} alt={p.name} className="h-40 w-full object-cover" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-lg">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.species} · {p.breed}</div>
                  </div>
                  <Badge variant="secondary">Activo</Badge>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {p.sex} · {ageFromDate(p.birthDate)} · {p.weight} kg
                </div>
                {/* 2 Botones Claros: Uno para el Expediente y otro para el Carné */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="w-full text-xs font-semibold gap-1.5 bg-primary"
                    onClick={() => {
                      setCurrentTab("info");
                      setSelected(p);
                    }}
                  >
                    <Eye className="h-3.5 w-3.5" /> Ver expediente
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs font-semibold gap-1.5 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-700 dark:text-sky-300"
                    onClick={() => {
                      setCurrentTab("carne");
                      setSelected(p);
                    }}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-sky-600" /> Carnet
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Vista de Expediente / Carnet: En móvil nativo a pantalla completa; en desktop modal amplio */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="p-0 gap-0 max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden sm:rounded-2xl border-0 sm:border bg-background">
          {selected && (
            <PetRecordViewer
              pet={selected}
              initialTab={currentTab}
              onBack={() => setSelected(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PetRecordViewer({
  pet,
  initialTab = "info",
  onBack,
}: {
  pet: Pet;
  initialTab?: string;
  onBack: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const isRocky = pet.id === "00000000-0000-0000-0000-0000000000b1" || pet.name?.toLowerCase() === "rocky";
  const isLuna = pet.id === "00000000-0000-0000-0000-0000000000b2" || pet.name?.toLowerCase() === "luna";

  const matchesPet = (petId: string) =>
    petId === pet.id ||
    (isRocky && (petId === "00000000-0000-0000-0000-0000000000b1" || petId === "rocky")) ||
    (isLuna && (petId === "00000000-0000-0000-0000-0000000000b2" || petId === "luna"));

  const rawConsultations = useAllConsultations().filter((c) => matchesPet(c.petId));
  const consultations =
    rawConsultations.length > 0
      ? rawConsultations
      : isRocky
      ? SEED_CONSULTATIONS.filter((c) => c.petId === "00000000-0000-0000-0000-0000000000b1")
      : [];

  const rawVaccines = useAllVaccines().filter((v) => matchesPet(v.petId));
  const vaccines =
    rawVaccines.length > 0
      ? rawVaccines
      : isRocky
      ? SEED_VACCINES.filter((v) => v.petId === "00000000-0000-0000-0000-0000000000b1")
      : isLuna
      ? SEED_VACCINES.filter((v) => v.petId === "00000000-0000-0000-0000-0000000000b2")
      : [];

  const rawDewormings = useAllDewormings().filter((d) => matchesPet(d.petId));
  const dewormings =
    rawDewormings.length > 0
      ? rawDewormings
      : isRocky
      ? SEED_DEWORMINGS.filter((d) => d.petId === "00000000-0000-0000-0000-0000000000b1")
      : isLuna
      ? SEED_DEWORMINGS.filter((d) => d.petId === "00000000-0000-0000-0000-0000000000b2")
      : [];

  const rawSurgeries = useAllSurgeries().filter((s) => matchesPet(s.petId));
  const surgeries =
    rawSurgeries.length > 0
      ? rawSurgeries
      : isRocky
      ? SEED_SURGERIES.filter((s) => s.petId === "00000000-0000-0000-0000-0000000000b1")
      : [];

  const hospitalizations = useAllHospitalizations().filter((h) => matchesPet(h.petId));
  const files = useAllPetFiles().filter((f) => matchesPet(f.petId));

  const rawPhotos = useAllPetPhotos().filter((p) => matchesPet(p.petId));
  const photos =
    rawPhotos.length > 0
      ? rawPhotos
      : isRocky
      ? SEED_PET_PHOTOS.filter((p) => p.petId === "00000000-0000-0000-0000-0000000000b1")
      : [];

  const vets = useAllVeterinarios();
  const appointments = useAllAppointments()
    .filter((a) => matchesPet(a.petId) && a.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const timeline = [
    ...consultations.map((c) => ({ date: c.date, type: "Consulta", desc: c.diagnosis || c.reason, detail: c.treatment })),
    ...vaccines.map((v) => ({ date: v.applicationDate, type: "Vacuna", desc: v.vaccineName, detail: `Lab: ${v.laboratory || "—"}` })),
    ...dewormings.map((d) => ({ date: d.applicationDate, type: "Desparasitación", desc: d.productName, detail: d.dewormingType })),
    ...surgeries.map((s) => ({ date: s.surgeryDate, type: "Cirugía", desc: s.procedureType, detail: `Vet: ${s.veterinarian}` })),
    ...hospitalizations.map((h) => ({ date: h.admissionDate, type: "Hospitalización", desc: h.reason, detail: h.status })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const [activeTab, setActiveTab] = useState(initialTab || "info");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const TAB_LABELS: Record<string, string> = {
    info: "📋 Expediente Clínico",
    carne: "🐾 Carné Digital",
    consultas: `🩺 Consultas${consultations.length ? ` (${consultations.length})` : ""}`,
    vaccines: `💉 Vacunas${vaccines.length ? ` (${vaccines.length})` : ""}`,
    vacunas: `💉 Vacunas${vaccines.length ? ` (${vaccines.length})` : ""}`,
    despar: `🪱 Desparasitación${dewormings.length ? ` (${dewormings.length})` : ""}`,
    cirugias: `🏥 Cirugías${surgeries.length ? ` (${surgeries.length})` : ""}`,
    hospi: "🛏️ Hospitalización",
    archivos: `📸 Galería${photos.length ? ` (${photos.length})` : ""}`,
    timeline: "⏱️ Cronología",
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Cabecera superior nativa móvil con botón de retorno y foto */}
      <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-b bg-card/95 backdrop-blur-md flex items-center justify-between gap-3 sticky top-0 z-30 safe-top">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="sm:hidden h-8 w-8 -ml-1 text-muted-foreground hover:text-foreground shrink-0"
            title="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="relative h-11 w-11 rounded-full overflow-hidden shrink-0 border-2 border-primary/20 shadow-xs">
            <img src={pet.photo} alt={pet.name} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base sm:text-lg truncate leading-tight">{pet.name}</h2>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200">
                {pet.species}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{pet.breed} · {pet.sex} · {pet.weight} kg</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="hidden sm:inline-flex h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
          title="Cerrar"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navegación por secciones */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        {/* Móvil: Selector limpio y 4 accesos directos (Cero scroll horizontal incómodo) */}
        <div className="sm:hidden px-3 py-2 border-b bg-muted/20 space-y-2 shrink-0">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="h-9 text-xs font-semibold rounded-xl bg-background border shadow-2xs w-full flex justify-between items-center px-3">
              <div className="flex items-center gap-2 truncate">
                <span className="text-muted-foreground text-[11px] font-normal">Sección:</span>
                <span className="font-bold text-foreground truncate">{TAB_LABELS[activeTab] || activeTab}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="info">📋 Expediente Clínico</SelectItem>
              <SelectItem value="carne">🐾 Carné Digital</SelectItem>
              <SelectItem value="consultas">🩺 Consultas Médicas {consultations.length > 0 ? `(${consultations.length})` : ""}</SelectItem>
              <SelectItem value="vacunas">💉 Registro de Vacunas {vaccines.length > 0 ? `(${vaccines.length})` : ""}</SelectItem>
              <SelectItem value="despar">🪱 Control de Desparasitación {dewormings.length > 0 ? `(${dewormings.length})` : ""}</SelectItem>
              <SelectItem value="cirugias">🏥 Cirugías {surgeries.length > 0 ? `(${surgeries.length})` : ""}</SelectItem>
              <SelectItem value="hospi">🛏️ Hospitalización</SelectItem>
              <SelectItem value="archivos">📸 Galería y Fotos {photos.length > 0 ? `(${photos.length})` : ""}</SelectItem>
              <SelectItem value="timeline">⏱️ Cronología Completa</SelectItem>
            </SelectContent>
          </Select>

          {/* 4 Accesos rápidos en cuadrícula fija: Expediente, Carné, Consultas y Vacunas */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: "info", label: "Expediente", icon: "📋" },
              { id: "carne", label: "Carné", icon: "🐾" },
              { id: "consultas", label: `Consultas${consultations.length ? ` (${consultations.length})` : ""}`, icon: "🩺" },
              { id: "vacunas", label: `Vacunas${vaccines.length ? ` (${vaccines.length})` : ""}`, icon: "💉" },
            ].map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1.5 px-1 rounded-lg text-center flex flex-col items-center justify-center gap-0.5 border transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                      : "bg-background hover:bg-muted text-muted-foreground border-border/60 font-medium"
                  }`}
                >
                  <span className="text-xs leading-none">{item.icon}</span>
                  <span className="truncate w-full text-[10px] leading-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop: Barra horizontal completa de tabs */}
        <div className="hidden sm:block shrink-0 px-6 py-2 border-b bg-muted/30">
          <TabsList className="w-full flex justify-start gap-1.5 h-auto p-1 bg-transparent overflow-x-auto no-scrollbar scroll-smooth">
            <TabsTrigger value="info" className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium shrink-0">
              📋 Expediente
            </TabsTrigger>
            <TabsTrigger value="carne" className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium shrink-0">
              🐾 Carné Digital
            </TabsTrigger>
            <TabsTrigger value="consultas" className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium shrink-0 flex items-center gap-1.5">
              🩺 Consultas
              {consultations.length > 0 && <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/30 text-current">{consultations.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="vacunas" className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium shrink-0 flex items-center gap-1.5">
              💉 Vacunas
              {vaccines.length > 0 && <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/30 text-current">{vaccines.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="despar" className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium shrink-0 flex items-center gap-1.5">
              🪱 Despar.
              {dewormings.length > 0 && <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/30 text-current">{dewormings.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="cirugias" className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium shrink-0 flex items-center gap-1.5">
              🏥 Cirugías
              {surgeries.length > 0 && <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/30 text-current">{surgeries.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="hospi" className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium shrink-0">
              🛏️ Hospital.
            </TabsTrigger>
            <TabsTrigger value="archivos" className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium shrink-0">
              📸 Galería
            </TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium shrink-0">
              ⏱️ Cronología
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Contenido scrolleable independiente */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* 1. Expediente Clínico Principal (Info) */}
          <TabsContent value="info" className="m-0 focus-visible:outline-none space-y-4">
            {/* Tarjetas de Resumen Rápido Clínico */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab("consultas")}
                className="p-3.5 rounded-2xl border bg-card hover:bg-muted/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Consultas</span>
                  <Stethoscope className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-bold text-foreground">{consultations.length}</div>
                <span className="text-[10px] text-emerald-600 font-medium">Ver historial →</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("vacunas")}
                className="p-3.5 rounded-2xl border bg-card hover:bg-muted/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Vacunas</span>
                  <Syringe className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-bold text-foreground">{vaccines.length}</div>
                <span className="text-[10px] text-blue-600 font-medium">Ver dosis →</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("despar")}
                className="p-3.5 rounded-2xl border bg-card hover:bg-muted/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Desparasitación</span>
                  <ShieldCheck className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-bold text-foreground">{dewormings.length}</div>
                <span className="text-[10px] text-amber-600 font-medium">Ver controles →</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("carne")}
                className="p-3.5 rounded-2xl border bg-card hover:bg-muted/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Carné Oficial</span>
                  <PawPrint className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-bold text-foreground">Digital</div>
                <span className="text-[10px] text-purple-600 font-medium">Abrir carné →</span>
              </button>
            </div>

            {/* Banner directo para acceder al Carné Digital Oficial */}
            <div className="rounded-2xl border border-sky-200 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 grid place-items-center shrink-0 mt-0.5">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-sky-950 dark:text-sky-100">
                    Carné Sanitario y de Vacunación de {pet.name}
                  </h4>
                  <p className="text-xs text-sky-800/80 dark:text-sky-300/80 mt-0.5">
                    Documento digital con sellos veterinarios, historial de vacunas y desparasitación para viajes o controles.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setActiveTab("carne")}
                className="shrink-0 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs"
              >
                Abrir Carné Digital <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>

            {/* Tarjeta de Ficha de Identidad */}
            <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-foreground">
                <FileText className="h-4 w-4 text-emerald-600" />
                Ficha de Identidad de {pet.name}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <Info label="Especie" value={pet.species} />
                <Info label="Raza" value={pet.breed} />
                <Info label="Sexo" value={pet.sex} />
                <Info label="Color" value={pet.color} />
                <Info label="Nacimiento" value={pet.birthDate} />
                <Info label="Edad Estimada" value={ageFromDate(pet.birthDate)} />
                <Info label="Peso Actual" value={`${pet.weight} kg`} />
                <Info label="Microchip" value={pet.microchip} />
                <Info label="Esterilizado" value={pet.sterilized ? "Sí" : "No"} />
                <Info label="Alergias Conocidas" value={pet.allergies} />
              </div>
            </div>

            {/* Última Consulta Médica (si existe) */}
            {consultations.length > 0 && (
              <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                    <Stethoscope className="h-4 w-4 text-emerald-600" />
                    Última Atención Médica Registrada
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("consultas")}
                    className="text-xs font-medium text-emerald-600 hover:underline"
                  >
                    Ver todas ({consultations.length})
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span>{consultations[0].reason}</span>
                    <span className="text-muted-foreground font-normal">{consultations[0].date}</span>
                  </div>
                  {consultations[0].diagnosis && (
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Diagnóstico:</strong> {consultations[0].diagnosis}
                    </p>
                  )}
                  {consultations[0].treatment && (
                    <p className="text-emerald-800 dark:text-emerald-300">
                      <strong>Tratamiento:</strong> {consultations[0].treatment}
                    </p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* 2. Carné */}
          <TabsContent value="carne" className="m-0 focus-visible:outline-none">
            <CarnetTab pet={pet} />
          </TabsContent>

          {/* 3. Consultas Clínicas */}
          <TabsContent value="consultas" className="m-0 focus-visible:outline-none space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm">Historial de Consultas Médicas</h3>
              <span className="text-xs text-muted-foreground">{consultations.length} atenciones registradas</span>
            </div>
            {consultations.length === 0 ? (
              <EmptyState text="Aún no hay consultas médicas registradas." />
            ) : (
              <div className="space-y-3">
                {consultations.map((c) => {
                  const vet = vets.find((v) => v.id === c.vetId);
                  return (
                    <div key={c.id} className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs space-y-3">
                      <div className="flex items-start justify-between gap-2 border-b pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 grid place-items-center shrink-0">
                            <Stethoscope className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-foreground">{c.reason}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <Calendar className="h-3 w-3" /> {c.date} · {vet?.nombre ?? "Dr. Veterinario"}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs font-normal bg-muted">
                          {c.weight ? `${c.weight} kg` : "Revisión"}
                        </Badge>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-muted/40">
                          <span className="font-semibold text-foreground block mb-0.5">Diagnóstico:</span>
                          <p className="text-muted-foreground">{c.diagnosis || "Sin diagnóstico específico"}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200">
                          <span className="font-semibold block mb-0.5">Tratamiento e Indicaciones:</span>
                          <p className="text-emerald-900/90 dark:text-emerald-300">{c.treatment || "Sin tratamiento registrado"}</p>
                        </div>
                      </div>

                      {c.medications && (
                        <div className="text-xs text-muted-foreground pt-1 flex items-start gap-1.5">
                          <span className="font-semibold text-foreground shrink-0">Medicamentos:</span>
                          <span>{c.medications}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* 4. Vacunas */}
          <TabsContent value="vacunas" className="m-0 focus-visible:outline-none space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm">Registro de Vacunación</h3>
              <span className="text-xs text-muted-foreground">{vaccines.length} vacunas aplicadas</span>
            </div>
            {vaccines.length === 0 ? (
              <EmptyState text="Aún no hay vacunas registradas para esta mascota." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {vaccines.map((v) => {
                  const isUpcoming = v.nextDueDate && v.nextDueDate >= today;
                  return (
                    <div key={v.id} className="rounded-2xl border bg-card p-4 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300 grid place-items-center">
                            <Syringe className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-bold text-sm">{v.vaccineName}</div>
                            <div className="text-[11px] text-muted-foreground">{v.laboratory || "Laboratorio certificado"}</div>
                          </div>
                        </div>
                        <Badge className={isUpcoming ? "bg-emerald-600 text-white" : "bg-muted text-foreground"}>
                          {isUpcoming ? "Al día" : "Aplicada"}
                        </Badge>
                      </div>
                      <div className="p-2 rounded-xl bg-muted/40 text-xs flex justify-between items-center">
                        <div>
                          <span className="text-muted-foreground text-[10px] block">Aplicación:</span>
                          <span className="font-medium">{v.applicationDate}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-muted-foreground text-[10px] block">Próxima Dosis:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{v.nextDueDate || "No requerida"}</span>
                        </div>
                      </div>
                      {v.veterinarian && (
                        <p className="text-[11px] text-muted-foreground">Veterinario: {v.veterinarian}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* 5. Desparasitación */}
          <TabsContent value="despar" className="m-0 focus-visible:outline-none space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm">Control de Parásitos (Interna y Externa)</h3>
              <span className="text-xs text-muted-foreground">{dewormings.length} aplicaciones</span>
            </div>
            {dewormings.length === 0 ? (
              <EmptyState text="Aún no hay desparasitaciones registradas." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {dewormings.map((d) => (
                  <div key={d.id} className="rounded-2xl border bg-card p-4 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm">🪱 {d.productName}</div>
                        <div className="text-[11px] text-muted-foreground">{d.dewormingType || "Dosis periódica"} {d.dose ? `· ${d.dose}` : ""}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {d.weight ? `${d.weight} kg` : "Al día"}
                      </Badge>
                    </div>
                    <div className="p-2 rounded-xl bg-muted/40 text-xs flex justify-between items-center">
                      <div>
                        <span className="text-muted-foreground text-[10px] block">Fecha de Toma:</span>
                        <span className="font-medium">{d.applicationDate}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground text-[10px] block">Próxima dosis:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{d.nextApplicationDate || "Por programar"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 6. Cirugías */}
          <TabsContent value="cirugias" className="m-0 focus-visible:outline-none space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm">Procedimientos Quirúrgicos</h3>
              <span className="text-xs text-muted-foreground">{surgeries.length} intervenciones</span>
            </div>
            {surgeries.length === 0 ? (
              <EmptyState text="No hay cirugías registradas para esta mascota." />
            ) : (
              <div className="space-y-3">
                {surgeries.map((s) => (
                  <div key={s.id} className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b pb-2">
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          🏥 {s.procedureType}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Fecha: {s.surgeryDate} · Cirujano: {s.veterinarian}
                        </div>
                      </div>
                      <Badge className="bg-emerald-600 text-white font-medium">{s.status}</Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 text-xs">
                      {s.procedurePerformed && (
                        <div className="p-2.5 rounded-xl bg-muted/40">
                          <span className="font-semibold block mb-0.5">Procedimiento realizado:</span>
                          <p className="text-muted-foreground">{s.procedurePerformed}</p>
                        </div>
                      )}
                      {s.postoperativeRecommendations && (
                        <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200">
                          <span className="font-semibold block mb-0.5">Recomendaciones postoperatorias:</span>
                          <p className="text-amber-900 dark:text-amber-300">{s.postoperativeRecommendations}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 7. Hospitalizaciones */}
          <TabsContent value="hospi" className="m-0 focus-visible:outline-none space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm">Historial de Hospitalización</h3>
              <span className="text-xs text-muted-foreground">{hospitalizations.length} ingresos</span>
            </div>
            {hospitalizations.length === 0 ? (
              <EmptyState text="La mascota no registra ingresos ni hospitalizaciones previas." />
            ) : (
              <div className="space-y-3">
                {hospitalizations.map((h) => (
                  <div key={h.id} className="rounded-2xl border bg-card p-4 shadow-xs space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b pb-2">
                      <div className="font-bold text-sm">🛏️ {h.reason}</div>
                      <Badge variant="outline">{h.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Ingreso: {h.admissionDate} · Veterinario: {h.veterinarian}</p>
                    {h.treatmentPlan && (
                      <div className="text-xs p-2 rounded-lg bg-muted/50">
                        <span className="font-medium">Plan: </span>{h.treatmentPlan}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 8. Galería y Archivos */}
          <TabsContent value="archivos" className="m-0 focus-visible:outline-none space-y-4">
            <div className="rounded-2xl border bg-card p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">Fotografías de {pet.name}</h4>
                  <p className="text-xs text-muted-foreground">Sube fotos clínicas o recuerdos de tu mascota ({photos.length}/{MAX_FOTOS})</p>
                </div>
              </div>

              {photos.length < MAX_FOTOS ? (
                <ImageInput
                  label={`Subir nueva foto (${photos.length}/${MAX_FOTOS})`}
                  value={null}
                  onChange={(v) => {
                    if (!v) return;
                    addPetPhoto({ petId: pet.id, title: "Foto de mi mascota", category: "General", photoUrl: v, photoDate: today, veterinarian: "", clinicalNotes: "", uploadedBy: "Dueño" });
                    toast.success("Fotografía guardada");
                  }}
                />
              ) : (
                <p className="text-xs text-amber-600 font-medium">Límite alcanzado ({MAX_FOTOS} fotos). Elimina una para subir una nueva.</p>
              )}

              {photos.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-xl">
                  Aún no has subido fotografías.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((p) => (
                    <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden border bg-muted group">
                      <img src={p.photoUrl} alt={p.title} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { deletePetPhoto(p.id); toast.success("Foto eliminada"); }}
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white grid place-items-center text-sm shadow-md"
                        title="Eliminar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { updatePet(pet.id, { photo: p.photoUrl }); toast.success("Foto principal actualizada"); }}
                        className="absolute bottom-2 left-2 flex items-center gap-1 h-6 px-2 rounded-full bg-emerald-600 text-white text-[10px] font-semibold shadow-md"
                        title="Foto del carné"
                      >
                        ⭐ Carné
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {files.length > 0 && (
              <div className="rounded-2xl border bg-card p-4 shadow-xs space-y-2">
                <h4 className="font-semibold text-sm mb-2">Documentos y Estudios ({files.length})</h4>
                <div className="space-y-2">
                  {files.map((f) => (
                    <div key={f.id} className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/20 text-xs">
                      <div>
                        <div className="font-medium">{f.fileName}</div>
                        <div className="text-[10px] text-muted-foreground">{f.documentDate} · {f.fileCategory}</div>
                      </div>
                      <Badge variant="outline">Adjunto</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* 9. Cronología / Línea de tiempo */}
          <TabsContent value="timeline" className="m-0 focus-visible:outline-none space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm">Línea de Tiempo Completa</h3>
              <span className="text-xs text-muted-foreground">{timeline.length} eventos históricos</span>
            </div>

            {appointments.length > 0 && (
              <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-sky-600 shrink-0" />
                <div>
                  <span className="font-semibold">Próxima cita programada: </span>
                  {appointments[0].date} {appointments[0].time} — {appointments[0].reason}
                </div>
              </div>
            )}

            {timeline.length === 0 ? (
              <EmptyState text="Aún no hay eventos registrados en la cronología." />
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {timeline.map((e, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-[21px] top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary" />
                    <div className="rounded-xl border bg-card p-3 shadow-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-foreground">{e.desc}</span>
                        <span className="text-[10px] text-muted-foreground">{e.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] py-0">{e.type}</Badge>
                        {e.detail && <span className="text-xs text-muted-foreground truncate">{e.detail}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground text-xs space-y-1 bg-muted/20">
      <PawPrint className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
      <p>{text}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
      <div className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xs font-semibold text-foreground truncate">{value || "—"}</div>
    </div>
  );
}
