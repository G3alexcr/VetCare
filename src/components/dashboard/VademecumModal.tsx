import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Search, Calculator, Sparkles, Check, AlertCircle } from "lucide-react";

interface Drug {
  name: string;
  category: string;
  defaultDoseMgKg: number;
  concentrationMgMl: number;
  route: string;
  species: string[];
  frequency: string;
  notes: string;
}

const COMMON_DRUGS: Drug[] = [
  {
    name: "Amoxicilina + Ác. Clavulánico",
    category: "Antibiótico",
    defaultDoseMgKg: 12.5,
    concentrationMgMl: 50,
    route: "Oral / SC",
    species: ["Canino", "Felino"],
    frequency: "Cada 12 horas",
    notes: "Administrar con alimento para prevenir molestias gástricas.",
  },
  {
    name: "Meloxicam",
    category: "AINE / Antiinflamatorio",
    defaultDoseMgKg: 0.2,
    concentrationMgMl: 1.5,
    route: "Oral / SC",
    species: ["Canino", "Felino"],
    frequency: "Dosis inicial 0.2 mg/kg, luego 0.1 mg/kg cada 24 horas",
    notes: "Contraindicado en pacientes deshidratados o con falla renal.",
  },
  {
    name: "Cefalexina",
    category: "Antibiótico cefalosporina",
    defaultDoseMgKg: 25,
    concentrationMgMl: 50,
    route: "Oral",
    species: ["Canino", "Felino"],
    frequency: "Cada 12 horas por 7-14 días",
    notes: "Excelente para piodermas y tejidos blandos.",
  },
  {
    name: "Tramadol",
    category: "Analgésico opioide",
    defaultDoseMgKg: 3,
    concentrationMgMl: 50,
    route: "Oral / IV / SC",
    species: ["Canino"],
    frequency: "Cada 8-12 horas",
    notes: "Para dolor moderado a severo. En gatos usar con estricta precaución.",
  },
  {
    name: "Metronidazol",
    category: "Antiprotozoario / Antibiótico",
    defaultDoseMgKg: 15,
    concentrationMgMl: 50,
    route: "Oral",
    species: ["Canino", "Felino"],
    frequency: "Cada 12 horas",
    notes: "Indicado para giardiasis y colitis bacteriana.",
  },
  {
    name: "Omeprazol",
    category: "Protector gástrico",
    defaultDoseMgKg: 1,
    concentrationMgMl: 4,
    route: "Oral / IV",
    species: ["Canino", "Felino"],
    frequency: "Cada 24 horas en ayunas",
    notes: "Inhibidor de la bomba de protones.",
  },
];

interface VademecumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VademecumModal({ open, onOpenChange }: VademecumModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDrug, setSelectedDrug] = useState<Drug>(COMMON_DRUGS[0]);
  const [weight, setWeight] = useState<string>("10");
  const [customDose, setCustomDose] = useState<string>(String(COMMON_DRUGS[0].defaultDoseMgKg));

  const filteredDrugs = COMMON_DRUGS.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const numWeight = parseFloat(weight) || 0;
  const numDose = parseFloat(customDose) || 0;
  const totalMg = numWeight * numDose;
  const totalMl = selectedDrug.concentrationMgMl > 0 ? totalMg / selectedDrug.concentrationMgMl : 0;

  const handleSelectDrug = (drug: Drug) => {
    setSelectedDrug(drug);
    setCustomDose(String(drug.defaultDoseMgKg));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl">
        <DialogHeader className="p-4 sm:p-5 border-b bg-gradient-to-r from-slate-900 to-[#046162] text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                Vademécum & Calculadora de Dosis Veterinaria
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300">
                Consulta principios activos y calcula el volumen exacto en ml y mg según el peso del paciente
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Columna izquierda: Lista y buscador de fármacos */}
          <div className="md:col-span-2 flex flex-col p-3 gap-2 bg-muted/20">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar fármaco..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[220px] md:max-h-[380px] pr-1">
              {filteredDrugs.map((drug) => {
                const isSelected = selectedDrug.name === drug.name;
                return (
                  <button
                    key={drug.name}
                    onClick={() => handleSelectDrug(drug)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-medium shadow-xs"
                        : "hover:bg-muted bg-card border border-border/50 text-foreground"
                    }`}
                  >
                    <div className="font-semibold truncate">{drug.name}</div>
                    <div className={`text-[11px] truncate ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                      {drug.category}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columna derecha: Calculadora de dosis y ficha */}
          <div className="md:col-span-3 p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto max-h-[380px]">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">{selectedDrug.name}</h3>
                <Badge variant="outline" className="text-[10px]">
                  {selectedDrug.category}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedDrug.frequency} · Vía {selectedDrug.route}</p>
            </div>

            {/* Calculadora */}
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                <Calculator className="h-4 w-4" />
                Cálculo de Dosis por Peso
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Peso del paciente (kg):
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="h-8 text-xs font-semibold bg-background"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Dosis (mg/kg):
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={customDose}
                    onChange={(e) => setCustomDose(e.target.value)}
                    className="h-8 text-xs font-semibold bg-background"
                  />
                </div>
              </div>

              {/* Resultado del cálculo */}
              <div className="pt-2 border-t border-primary/20 grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-lg bg-background border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase font-medium">Dosis Total</div>
                  <div className="text-base font-bold text-primary">{totalMg.toFixed(2)} mg</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold">Volumen a Administrar</div>
                  <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {totalMl.toFixed(2)} ml
                  </div>
                </div>
              </div>
            </div>

            {/* Notas clínicas */}
            <div className="text-xs space-y-1.5 text-muted-foreground">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                Observaciones clínicas:
              </div>
              <p className="text-[11px] leading-relaxed bg-muted/40 p-2.5 rounded-lg border border-border/60">
                {selectedDrug.notes}
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 border-t bg-muted/40 flex items-center justify-between text-xs text-muted-foreground">
          <span>Go2Vet Vademécum Clínico</span>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
