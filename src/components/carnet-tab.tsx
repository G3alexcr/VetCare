import { useState } from "react";
import {
  useAllVaccines, useAllDewormings, useAllAppointments, useAllSurgeries, useAllHospitalizations, useAllPetFiles, useAllPetPhotos,
  addPetPhoto, deletePetPhoto, getVaccineStatus, getDewormingStatus,
  SEED_VACCINES, SEED_DEWORMINGS, SEED_SURGERIES, SEED_PET_PHOTOS,
} from "@/lib/store";
import { useAllClientes } from "@/lib/clientes-store";
import { useAllPets, updatePet } from "@/lib/pets-store";
import { Button } from "@/components/ui/button";
import { Printer, X, Maximize2 } from "lucide-react";
import { ImageInput } from "@/components/image-input";
import { ImagePreviewDialog } from "@/components/image-preview-dialog";
import { toast } from "sonner";
import type { Pet } from "@/lib/mock-data";

const MAX_FOTOS = 3;

// Carné digital: resumen + identidad + vacunas/parásitos + fotos + imprimir.
export function CarnetTab({ pet }: { pet: Pet }) {
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);
  const isRocky = pet.id === "00000000-0000-0000-0000-0000000000b1" || pet.name?.toLowerCase() === "rocky";
  const isLuna = pet.id === "00000000-0000-0000-0000-0000000000b2" || pet.name?.toLowerCase() === "luna";
  const isNani = pet.id === "09f5d472-9f7e-4e83-9f7d-702fb78348b6" || pet.id === "00000000-0000-0000-0000-0000000000b3" || pet.name?.toLowerCase() === "nani";

  const matchesPet = (petId: string) =>
    petId === pet.id ||
    (isRocky && (petId === "00000000-0000-0000-0000-0000000000b1" || petId === "rocky")) ||
    (isLuna && (petId === "00000000-0000-0000-0000-0000000000b2" || petId === "luna")) ||
    (isNani && (petId === "09f5d472-9f7e-4e83-9f7d-702fb78348b6" || petId === "00000000-0000-0000-0000-0000000000b3" || petId === "nani"));

  const vaccines = useAllVaccines().filter((v) => matchesPet(v.petId)).sort((a, b) => a.applicationDate.localeCompare(b.applicationDate));
  const dewormings = useAllDewormings().filter((d) => matchesPet(d.petId)).sort((a, b) => a.applicationDate.localeCompare(b.applicationDate));
  const appointments = useAllAppointments();
  const surgeries = useAllSurgeries().filter((s) => matchesPet(s.petId));
  const hospitalizations = useAllHospitalizations().filter((h) => matchesPet(h.petId));
  const petFiles = useAllPetFiles().filter((f) => matchesPet(f.petId));
  const petPhotos = useAllPetPhotos().filter((p) => matchesPet(p.petId));
  const clientes = useAllClientes();
  const owner = clientes.find((c) => c.id === pet.clientId || (isNani && (c.id === "5e700fd9-3323-433c-9570-294e46c10785" || c.id === "00000000-0000-0000-0000-00000000f103" || c.email === "ghiulyscr@gmail.com")));
  // La foto principal del carné se lee en vivo (para reflejar al instante cuando el dueño la cambia).
  const carnePet = useAllPets().find((x) => x.id === pet.id || (isNani && x.name === "Nani"));
  const carnePhoto = (isNani && (!carnePet?.photo || carnePet.photo.includes("unsplash"))) ? "/nani.png" : (carnePet?.photo || pet.photo || (isNani ? "/nani.png" : ""));

  const today = new Date().toISOString().split("T")[0];
  const futuras = appointments.filter((a) => a.petId === pet.id && a.date >= today && a.status !== "Cancelada").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const proximaCita = futuras[0];
  const ultimaFoto = petPhotos[0]?.photoDate;
  const ultimaCirugia = surgeries[0]?.surgeryDate;

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const print = () => {
    const w = window.open("", "_blank", "width=820,height=900");
    if (!w) return toast.error("Permite ventanas emergentes para imprimir.");
    const badge = (l: string) => `#${l === "Vencida" ? "dc2626" : l === "Próxima a vencer" ? "d97706" : "059669"}`;
    const rows = (list: Array<{ d: string; n: string; nxt: string; vet: string; st: string }>) =>
      list.map((x) => `<tr><td>${x.d}</td><td>${esc(x.n)}</td><td>${x.nxt || "—"}</td><td>${esc(x.vet || "—")}</td><td style="color:${badge(x.st)};font-weight:700">${x.st}</td></tr>`).join("");
    const fotos = petPhotos.map((p) => `<img src="${p.photoUrl}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;margin-right:6px"/>`).join("");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Carné — ${esc(pet.name)}</title>
      <style>body{font-family:system-ui;color:#111;padding:24px;max-width:760px;margin:auto}h1{font-size:20px;margin:0}
      .head{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;font-size:13px}
      table{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px}th,td{border:1px solid #ccc;padding:6px;text-align:left}
      th{background:#f3f4f6}.sec{font-weight:700;margin-top:16px}.fotos{margin-top:8px}@media print{.noprint{display:none}}</style></head><body>
      <button class="noprint" onclick="window.print()">Imprimir</button>
      <h1>🐾 Carné Sanitario — ${esc(pet.name)}</h1>
      ${carnePhoto ? `<img src="${carnePhoto}" style="height:80px;width:80px;object-fit:cover;border-radius:12px"/>` : ""}
      <div class="head">
        <div><strong>Especie:</strong> ${esc(pet.species)}<br/><strong>Raza:</strong> ${esc(pet.breed)}<br/><strong>Sexo:</strong> ${esc(pet.sex)}<br/><strong>Nacimiento:</strong> ${pet.birthDate || "—"}</div>
        <div><strong>Propietario:</strong> ${esc(owner?.name || owner?.fullName || (isNani ? "Ghiulina S" : "—"))}<br/><strong>Teléfono:</strong> ${esc(owner?.phone || (isNani ? "87888990" : "—"))}<br/><strong>Color:</strong> ${esc(pet.color) || "—"}<br/><strong>Peso:</strong> ${pet.weight} kg</div>
      </div>
      <div class="fotos">${fotos}</div>
      <div class="sec">Control de Vacunación</div>
      <table><thead><tr><th>Fecha</th><th>Producto</th><th>Próxima dosis</th><th>Veterinario</th><th>Estado</th></tr></thead>
      <tbody>${rows(vaccines.map((v) => ({ d: v.applicationDate, n: v.vaccineName, nxt: v.nextDueDate, vet: v.veterinarian, st: getVaccineStatus(v.nextDueDate).label })))}</tbody></table>
      <div class="sec">Control de Parásitos</div>
      <table><thead><tr><th>Fecha</th><th>Producto</th><th>Próxima</th><th>Veterinario</th><th>Estado</th></tr></thead>
      <tbody>${rows(dewormings.map((d) => ({ d: d.applicationDate, n: d.productName, nxt: d.nextApplicationDate, vet: d.veterinarian, st: getDewormingStatus(d.nextApplicationDate).label })))}</tbody></table>
      <p style="font-size:11px;color:#666">Generado por Go2Vet · ${new Date().toLocaleDateString("es-CR")}</p>
      </body></html>`);
    w.document.close();
    w.focus();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={print}><Printer className="h-4 w-4 mr-1" /> Imprimir / Descargar carné</Button>
      </div>

      {/* Resumen del expediente (como la barra del diálogo) */}
      <div className="rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
        <div>🪱 Desparasitaciones registradas: {dewormings.length} · Próxima aplicación: {dewormings[0]?.nextApplicationDate || "—"}</div>
        <div>🏥 Cirugías registradas: {surgeries.length} · Última cirugía: {ultimaCirugia || "—"}</div>
        <div>🛏️ Hospitalizaciones: {hospitalizations.length} · {hospitalizations.some((h) => h.status === "Hospitalizado" || h.status === "Recuperación") ? "Paciente hospitalizado actualmente: Sí" : "Paciente hospitalizado actualmente: No"}</div>
        <div>🗂️ Archivos registrados: {petFiles.length} · 📸 Fotografías: {petPhotos.length} · Última: {ultimaFoto || "—"}</div>
        <div>📅 Próxima cita: {proximaCita ? `${proximaCita.date} ${proximaCita.time}` : "—"} · Total citas futuras: {futuras.length}</div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3 border-b pb-3 mb-3">
          <div
            className="h-16 w-16 rounded-xl overflow-hidden shrink-0 bg-muted cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all select-none group"
            onClick={() => carnePhoto && setPreviewPhoto({ url: carnePhoto, title: `${pet.name} · Foto de carné` })}
            title="Clic para ver foto completa"
          >
            {carnePhoto && <img src={carnePhoto} alt={pet.name} className="h-full w-full object-cover object-top transition-transform group-hover:scale-105" />}
          </div>
          <div>
            <div className="font-bold text-lg">{pet.name}</div>
            <div className="text-xs text-muted-foreground">{pet.species} · {pet.breed} · {pet.sex} · Nacimiento {pet.birthDate || "—"}</div>
          </div>
          <div className="ml-auto text-right text-xs text-muted-foreground">
            <div>{owner?.name || owner?.fullName || (isNani ? "Ghiulina S" : "—")}</div>
            <div>{owner?.phone || (isNani ? "87888990" : "—")}</div>
          </div>
        </div>

        {/* Fotos del paciente (máx 3) */}
        <div className="font-semibold text-sm mb-2">🖼️ Fotos del paciente</div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {carnePhoto && (
            <div
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/40 bg-muted shadow-xs cursor-pointer select-none group"
              onClick={() => setPreviewPhoto({ url: carnePhoto, title: `${pet.name} · Carné Oficial` })}
              title="Clic para ver foto completa"
            >
              <img src={carnePhoto} alt={pet.name} className="w-full h-full object-cover object-top transition-transform group-hover:scale-105" />
              <div className="absolute bottom-1 left-1 flex items-center gap-0.5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium shadow-xs z-10">
                ⭐ Carné
              </div>
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Maximize2 className="h-2.5 w-2.5" /> Ver
                </span>
              </div>
            </div>
          )}
          {petPhotos.map((p) => (
            <div
              key={p.id}
              className="relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer select-none group"
              onClick={() => setPreviewPhoto({ url: p.photoUrl, title: `${pet.name} · ${p.title || "Foto"}` })}
              title="Clic para ver foto completa"
            >
              {p.photoUrl && <img src={p.photoUrl} alt={p.title} className="w-full h-full object-cover object-top transition-transform group-hover:scale-105" />}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Maximize2 className="h-2.5 w-2.5" /> Ver
                </span>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); deletePetPhoto(p.id); toast.success("Foto eliminada"); }} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white grid place-items-center z-10" title="Eliminar">
                <X className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); updatePet(pet.id, { photo: p.photoUrl }); toast.success("Foto principal del carné actualizada"); }}
                className="absolute bottom-1 left-1 flex items-center gap-0.5 h-6 px-1.5 rounded-full bg-emerald-500/90 hover:bg-emerald-600 text-white text-[10px] font-medium z-10"
                title="Usar como foto del carné"
              >⭐ Carné</button>
            </div>
          ))}
          {!carnePhoto && petPhotos.length === 0 && <div className="col-span-3 text-xs text-muted-foreground rounded-lg border border-dashed p-3 text-center">Aún no hay fotos. Sube hasta {MAX_FOTOS}.</div>}
        </div>
        {petPhotos.length < MAX_FOTOS ? (
          <ImageInput
            label={`Subir foto (${petPhotos.length}/${MAX_FOTOS})`}
            value={null}
            onChange={(v) => {
              if (!v) return;
              addPetPhoto({ petId: pet.id, title: "Foto del paciente", category: "General", photoUrl: v, photoDate: today, veterinarian: "", clinicalNotes: "", uploadedBy: "Dueño" });
              toast.success("Foto agregada");
            }}
          />
        ) : (
          <p className="text-xs text-amber-600">Máximo {MAX_FOTOS} fotos. Elimina una para subir otra.</p>
        )}

        <div className="font-semibold text-sm mt-4 mb-1">💉 Control de Vacunación</div>
        <table className="w-full text-xs">
          <tbody>
            {vaccines.length === 0 && <tr><td className="py-1 text-muted-foreground">Sin registros.</td></tr>}
            {vaccines.map((v) => {
              const st = getVaccineStatus(v.nextDueDate);
              return (
                <tr key={v.id} className="border-b border-border/40">
                  <td className="py-1 whitespace-nowrap">{v.applicationDate}</td>
                  <td className="py-1 font-medium">{v.vaccineName}</td>
                  <td className="py-1 whitespace-nowrap">{v.nextDueDate || "—"}</td>
                  <td className="py-1 text-muted-foreground">{v.veterinarian}</td>
                  <td className="py-1">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${st.label === "Vencida" ? "bg-red-100 text-red-700" : st.label === "Próxima a vencer" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"}`}>{st.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="font-semibold text-sm mt-4 mb-1">🪱 Control de Parásitos</div>
        <table className="w-full text-xs">
          <tbody>
            {dewormings.length === 0 && <tr><td className="py-1 text-muted-foreground">Sin registros.</td></tr>}
            {dewormings.map((d) => {
              const st = getDewormingStatus(d.nextApplicationDate);
              return (
                <tr key={d.id} className="border-b border-border/40">
                  <td className="py-1 whitespace-nowrap">{d.applicationDate}</td>
                  <td className="py-1 font-medium">{d.productName}</td>
                  <td className="py-1 whitespace-nowrap">{d.nextApplicationDate || "—"}</td>
                  <td className="py-1 text-muted-foreground">{d.veterinarian}</td>
                  <td className="py-1">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${st.label === "Vencida" ? "bg-red-100 text-red-700" : st.label === "Próxima a vencer" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"}`}>{st.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
