import { useAllVaccines, useAllDewormings, getVaccineStatus, getDewormingStatus } from "@/lib/store";

type Props = { ownerPets: { id: string; name: string }[] };

// Tarjeta "Próximas vacunas / desparasitaciones" para el dueño en el portal.
export function UpcomingVaccines({ ownerPets }: Props) {
  const vaccines = useAllVaccines();
  const dewormings = useAllDewormings();
  const petIds = new Set(ownerPets.map((p) => p.id));
  const petName = (id: string) => ownerPets.find((p) => p.id === id)?.name ?? "Mascota";

  const items = [
    ...vaccines
      .filter((v) => petIds.has(v.petId))
      .map((v) => ({ kind: "vacuna" as const, name: v.vaccineName, petId: v.petId, next: v.nextDueDate, status: getVaccineStatus(v.nextDueDate) })),
    ...dewormings
      .filter((d) => petIds.has(d.petId))
      .map((d) => ({ kind: "desparasitación" as const, name: d.productName, petId: d.petId, next: d.nextApplicationDate, status: getDewormingStatus(d.nextApplicationDate) })),
  ]
    .filter((x) => x.status.label !== "Vigente")
    .sort((a, b) => a.next.localeCompare(b.next));

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        🐾 ¡Todo al día! No tenés vacunas ni desparasitaciones próximas a vencer. 🎉
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="font-semibold text-amber-900 mb-2">⏰ Próximas vacunas y desparasitaciones</div>
      <div className="space-y-2">
        {items.map((x, i) => (
          <div key={i} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-amber-900">{x.kind === "vacuna" ? "💉" : "🪱"} {x.name} · {petName(x.petId)}</div>
              <div className="text-xs text-amber-700">Próxima: {x.next}</div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${x.status.label === "Vencida" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
              {x.status.label === "Vencida" ? `Vencida (${Math.abs(x.status.daysLeft)}d)` : `En ${x.status.daysLeft} día(s)`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
