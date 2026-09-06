import { useState } from "react";
import { Cake, Pencil, Plus, Stethoscope, Trash2, Eye, Calendar as CalIcon, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { ConsultationForm } from "@/components/consultation-form";
import { ConsultationDetailDialog } from "@/components/consultation-detail";
import { VaccinesTab } from "@/components/vaccines-tab";
import { CarnetTab } from "@/components/carnet-tab";
import { DewormingsTab } from "@/components/dewormings-tab";
import { SurgeriesTab } from "@/components/surgeries-tab";
import { HospitalizationTab } from "@/components/hospitalization-tab";
import { FilesTab } from "@/components/files-tab";
import { PhotosTab } from "@/components/photos-tab";
import { AppointmentsTab } from "@/components/appointments-tab";
import { TimelineTab } from "@/components/timeline-tab";
import type { Pet } from "@/lib/mock-data";
import { useClientes } from "@/lib/clientes-store";
import { useVeterinarios } from "@/lib/veterinarios-store";
import { openVetCareAI } from "@/lib/ai-store";
import {
  useConsultations,
  useAppointments,
  useDewormings,
  useSurgeries,
  useHospitalizations,
  usePetFiles,
  usePetPhotos,
  addConsultationFromAppointment,
  addConsultation,
  updateConsultation,
  deleteConsultation,
  type LinkedConsultation,
} from "@/lib/store";
import { toast } from "sonner";
import { toLocalDateStr } from "@/lib/utils";

function calcAge(birthDate: string): string {
  if (!birthDate) return "—";
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return "—";
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  let months = now.getMonth() - b.getMonth();
  if (now.getDate() < b.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  if (years <= 0 && months <= 0) return "Recién nacido";
  if (years <= 0) return `${months} mes${months === 1 ? "" : "es"}`;
  if (months === 0) return `${years} año${years === 1 ? "" : "s"}`;
  return `${years} año${years === 1 ? "" : "s"} ${months} m`;
}

export function PetRecordDialog({
  pet,
  onClose,
  onEdit,
}: {
  pet: Pet | null;
  onClose: () => void;
  onEdit: (pet: Pet) => void;
}) {
  const consultations = useConsultations();
  const appointments = useAppointments();
  const dewormings = useDewormings();
  const surgeries = useSurgeries();
  const hospitalizations = useHospitalizations();
  const petFiles = usePetFiles();
  const petPhotosAll = usePetPhotos();
  const clientes = useClientes();
  const vets = useVeterinarios();
  const [newOpen, setNewOpen] = useState(false);
  const [editingConsult, setEditingConsult] = useState<LinkedConsultation | null>(null);
  const [viewConsult, setViewConsult] = useState<LinkedConsultation | null>(null);

  if (!pet) return null;

  const owner = clientes.find((c) => c.id === pet.clientId);
  const history = consultations
    .filter((c) => c.petId === pet.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const upcoming = appointments
    .filter((a) => a.petId === pet.id && ["Pendiente", "Confirmada", "En atención"].includes(a.status))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const petDewormings = dewormings.filter((d) => d.petId === pet.id);
  const nextDeworming = petDewormings
    .map((d) => d.nextApplicationDate)
    .filter(Boolean)
    .sort()
    .find((date) => date >= new Date().toISOString().split("T")[0]);
  const petSurgeries = surgeries.filter((s) => s.petId === pet.id);
  const lastSurgery = [...petSurgeries].sort((a, b) => b.surgeryDate.localeCompare(a.surgeryDate))[0];
  const petHosp = hospitalizations.filter((h) => h.petId === pet.id);
  const currentlyHosp = petHosp.some((h) => h.status !== "Alta médica" && h.status !== "Fallecido");
  const lastHosp = [...petHosp].sort((a, b) => b.admissionDate.localeCompare(a.admissionDate))[0];
  const petFilesForPet = petFiles.filter((f) => f.petId === pet.id);
  const lastFile = [...petFilesForPet].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const petPhotos = petPhotosAll.filter((p) => p.petId === pet.id);
  const lastPhoto = [...petPhotos].sort((a, b) => b.photoDate.localeCompare(a.photoDate))[0];
  const todayISO = new Date().toISOString().split("T")[0];
  const futureAppts = appointments
    .filter((a) => a.petId === pet.id && a.status !== "Cancelada" && a.status !== "Finalizada" && a.date >= todayISO)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const nextAppt = futureAppts[0];

  return (
    <>
      <Dialog open={!!pet} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3 pr-8">
              <div className="flex items-center gap-3">
                <img src={pet.photo} alt={pet.name} className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <div className="text-lg">{pet.name}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {pet.species} · {pet.breed} · {owner?.fullName ?? "—"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openVetCareAI("resumen", pet.id)}>
                  <Sparkles className="h-4 w-4 mr-2" /> Resumen IA
                </Button>
                <Button size="sm" onClick={() => setNewOpen(true)}>
                  <Stethoscope className="h-4 w-4 mr-2" /> Nueva consulta
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="text-xs text-muted-foreground -mt-2 pb-1 space-y-0.5">
            <div>
              🦠 Desparasitaciones registradas: <span className="font-medium text-foreground">{petDewormings.length}</span>
              {nextDeworming && (
                <> · Próxima aplicación: <span className="font-medium text-foreground">{nextDeworming}</span></>
              )}
            </div>
            <div>
              🏥 Cirugías registradas: <span className="font-medium text-foreground">{petSurgeries.length}</span>
              {lastSurgery && (
                <> · Última cirugía: <span className="font-medium text-foreground">{lastSurgery.surgeryDate}</span></>
              )}
            </div>
            <div>
              🏨 Hospitalizaciones: <span className="font-medium text-foreground">{petHosp.length}</span>
              {" · "}Paciente hospitalizado actualmente: <span className="font-medium text-foreground">{currentlyHosp ? "Sí" : "No"}</span>
              {lastHosp && (
                <> · Última: <span className="font-medium text-foreground">{lastHosp.admissionDate}</span></>
              )}
            </div>
            <div>
              📄 Archivos registrados: <span className="font-medium text-foreground">{petFilesForPet.length}</span>
              {lastFile && (
                <> · Último archivo: <span className="font-medium text-foreground">{lastFile.documentDate || lastFile.createdAt.split("T")[0]}</span></>
              )}
            </div>
            <div>
              📷 Fotografías registradas: <span className="font-medium text-foreground">{petPhotos.length}</span>
              {lastPhoto && (
                <> · Última fotografía: <span className="font-medium text-foreground">{lastPhoto.photoDate}</span></>
              )}
            </div>
            <div>
              📅 Próxima cita: <span className="font-medium text-foreground">{nextAppt ? `${nextAppt.date} ${nextAppt.time}` : "—"}</span>
              {" · "}Total citas futuras: <span className="font-medium text-foreground">{futureAppts.length}</span>
            </div>
          </div>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="flex flex-wrap h-auto justify-start">
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="carne">Carné</TabsTrigger>
              <TabsTrigger value="consultas">Consultas</TabsTrigger>
              <TabsTrigger value="vacunas">Vacunas</TabsTrigger>
              <TabsTrigger value="desparasitacion">Desparasitación</TabsTrigger>
              <TabsTrigger value="cirugias">Cirugías</TabsTrigger>
              <TabsTrigger value="hospitalizacion">Hospitalización</TabsTrigger>
              <TabsTrigger value="archivos">Archivos</TabsTrigger>
              <TabsTrigger value="fotografias">Fotografías</TabsTrigger>
              <TabsTrigger value="citas">Próximas citas</TabsTrigger>
              <TabsTrigger value="timeline">Línea de tiempo</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4">
              <div className="grid sm:grid-cols-[200px_1fr] gap-4">
                <img src={pet.photo} alt={pet.name} className="rounded-lg aspect-square object-cover w-full" />
                <div className="space-y-1 text-sm">
                  <Detail label="Nombre" value={pet.name} />
                  <Detail label="Especie" value={pet.species} />
                  <Detail label="Raza" value={pet.breed} />
                  <Detail label="Sexo" value={pet.sex} />
                  <Detail label="Color" value={pet.color} />
                  <Detail label="Fecha de nacimiento" value={pet.birthDate} />
                  <Detail label="Edad" value={calcAge(pet.birthDate)} />
                  <Detail label="Peso" value={`${pet.weight} kg`} />
                  <Detail label="Microchip" value={pet.microchip || "—"} />
                  <Detail label="Esterilizado" value={pet.sterilized ? "Sí" : "No"} />
                  <Detail label="Alergias" value={pet.allergies || "—"} />
                  <Detail label="Propietario" value={owner?.fullName ?? "—"} />
                  <div className="pt-3">
                    <Button variant="outline" size="sm" onClick={() => onEdit(pet)}>
                      <Pencil className="h-4 w-4 mr-2" /> Editar información
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="carne" className="mt-4">
              <CarnetTab pet={pet} />
            </TabsContent>

            <TabsContent value="consultas" className="mt-4 space-y-3">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setNewOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Nueva consulta
                </Button>
              </div>
              {history.length === 0 ? (
                <EmptyState text="Sin consultas registradas." />
              ) : (
                <Card className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Veterinario</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Diagnóstico</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((c) => {
                        const vet = vets.find((v) => v.id === c.vetId);
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="whitespace-nowrap">{c.date}</TableCell>
                            <TableCell>{vet?.nombre ?? "—"}</TableCell>
                            <TableCell>{c.reason}</TableCell>
                            <TableCell className="text-muted-foreground">{c.diagnosis || "—"}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => setViewConsult(c)} title="Ver">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setEditingConsult(c)} title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  deleteConsultation(c.id);
                                  toast.success("Consulta eliminada");
                                }}
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="citas" className="mt-4">
              <AppointmentsTab petId={pet.id} />
            </TabsContent>

            <TabsContent value="vacunas" className="mt-4">
              <VaccinesTab petId={pet.id} />
            </TabsContent>

            <TabsContent value="desparasitacion" className="mt-4">
              <DewormingsTab petId={pet.id} />
            </TabsContent>

            <TabsContent value="cirugias" className="mt-4">
              <SurgeriesTab petId={pet.id} />
            </TabsContent>

            <TabsContent value="hospitalizacion" className="mt-4">
              <HospitalizationTab petId={pet.id} />
            </TabsContent>

            <TabsContent value="archivos" className="mt-4">
              <FilesTab petId={pet.id} />
            </TabsContent>

            <TabsContent value="fotografias" className="mt-4">
              <PhotosTab petId={pet.id} />
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <TimelineTab petId={pet.id} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* New consultation dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva consulta — {pet.name}</DialogTitle>
          </DialogHeader>
          <ConsultationForm
            lockContext
            defaults={{ petId: pet.id, clientId: pet.clientId }}
            onCancel={() => setNewOpen(false)}
            onSubmit={(data) => {
              // Try to attach to a current appointment for this pet today
              const today = data.date || toLocalDateStr(new Date());
              const active = appointments.find(
                (a) => a.petId === pet.id && a.date === today && a.status !== "Cancelada" && a.status !== "Finalizada"
              );
              if (active) {
                addConsultationFromAppointment(data, active.id);
              } else {
                addConsultation({ ...data, id: crypto.randomUUID() });
              }
              setNewOpen(false);
              toast.success("Consulta registrada");
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit consultation dialog */}
      <Dialog open={!!editingConsult} onOpenChange={(o) => !o && setEditingConsult(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar consulta</DialogTitle>
          </DialogHeader>
          {editingConsult && (
            <ConsultationForm
              lockContext
              defaults={{
                date: editingConsult.date,
                vetId: editingConsult.vetId,
                petId: editingConsult.petId,
                clientId: pet.clientId,
                reason: editingConsult.reason,
              }}
              submitLabel="Actualizar"
              onCancel={() => setEditingConsult(null)}
              onSubmit={(data) => {
                updateConsultation(editingConsult.id, data);
                setEditingConsult(null);
                toast.success("Consulta actualizada");
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConsultationDetailDialog consultation={viewConsult} onClose={() => setViewConsult(null)} />
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="p-10 text-center">
      <Cake className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-40" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </Card>
  );
}
