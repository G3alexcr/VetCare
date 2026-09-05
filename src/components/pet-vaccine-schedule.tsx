import { useAllVaccines, useAllDewormings, getVaccineStatus, getDewormingStatus } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = { ownerPets: { id: string; name: string; species: string; breed: string }[] };

// Vista "Próximas vacunas" por mascota: calendario con estados.
export function PetVaccineSchedule({ ownerPets }: Props) {
  const vaccines = useAllVaccines();
  const dewormings = useAllDewormings();
  const petIds = new Set(ownerPets.map((p) => p.id));
  const pets = ownerPets.filter((p) => petIds.has(p.id));

  if (pets.length === 0) return null;

  return (
    <div className="space-y-4">
      {pets.map((pet) => {
        const pv = vaccines
          .filter((v) => v.petId === pet.id)
          .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
        const dw = dewormings
          .filter((d) => d.petId === pet.id)
          .sort((a, b) => a.nextApplicationDate.localeCompare(b.nextApplicationDate));
        if (pv.length === 0 && dw.length === 0) return null;
        return (
          <Card key={pet.id} className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="font-semibold">{pet.name}</div>
              <Badge variant="secondary">{pet.species} · {pet.breed}</Badge>
            </div>
            <div className="space-y-2">
              {dw.map((d) => {
                const st = getDewormingStatus(d.nextApplicationDate);
                return (
                  <div key={d.id} className="flex items-center justify-between text-sm py-1 border-b border-border/40">
                    <div className="min-w-0">
                      <span className="mr-1">🪱</span><span className="font-medium">{d.productName}</span>
                      <div className="text-xs text-muted-foreground">Aplicada: {d.applicationDate} · Próxima: {d.nextApplicationDate}</div>
                    </div>
                    <Badge variant={st.label === "Vencida" ? "destructive" : st.label === "Próxima a vencer" ? "secondary" : "default"}>{st.label}</Badge>
                  </div>
                );
              })}
              {pv.map((v) => {
                const st = getVaccineStatus(v.nextDueDate);
                return (
                  <div key={v.id} className="flex items-center justify-between text-sm py-1 border-b border-border/40">
                    <div className="min-w-0">
                      <span className="mr-1">💉</span><span className="font-medium">{v.vaccineName}</span>
                      <div className="text-xs text-muted-foreground">Aplicada: {v.applicationDate} · Próxima dosis: {v.nextDueDate} · {v.veterinarian}</div>
                    </div>
                    <Badge variant={st.label === "Vencida" ? "destructive" : st.label === "Próxima a vencer" ? "secondary" : "default"}>{st.label}</Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
