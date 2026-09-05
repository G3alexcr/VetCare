'use client';

import { useState } from 'react';
import { WebsiteSettings, saveWebsiteSettings, DEFAULT_HEALTH_PLANS, WebsiteHealthPlan } from '@/lib/website-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, Sparkles, Save, Eye, EyeOff } from 'lucide-react';

interface Props {
  settings: WebsiteSettings;
}

export function PlansTab({ settings }: Props) {
  const sections = settings.sections_config || {};
  const isEnabled = sections.health_plans?.enabled !== false;

  const currentConfig = settings.identity?.health_plans_config;
  const [title, setTitle] = useState(currentConfig?.title || "Planes de Salud y Paquetes Preventivos");
  const [subtitle, setSubtitle] = useState(
    currentConfig?.subtitle || "Tranquilidad médica continua para tu mascota con coberturas diseñadas para cada edad y etapa de vida."
  );

  const initialPlans = (currentConfig?.plans && currentConfig.plans.length > 0)
    ? currentConfig.plans
    : DEFAULT_HEALTH_PLANS;

  const [plans, setPlans] = useState<WebsiteHealthPlan[]>(initialPlans);
  const [saving, setSaving] = useState(false);

  const handleToggleSection = (val: boolean) => {
    saveWebsiteSettings({
      sections_config: {
        ...sections,
        health_plans: {
          ...(sections.health_plans || { order: 5 }),
          enabled: val,
        },
      },
    });
    toast.success(val ? "Sección de Planes de Salud activada en la web" : "Sección de Planes de Salud ocultada de la web");
  };

  const handleUpdatePlan = (index: number, field: keyof WebsiteHealthPlan, val: any) => {
    setPlans((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleFeaturesChange = (index: number, text: string) => {
    const lines = text.split('\n');
    handleUpdatePlan(index, 'features', lines);
  };

  const handleAddPlan = () => {
    const newPlan: WebsiteHealthPlan = {
      id: `plan-${Date.now()}`,
      name: "Nuevo Plan de Salud",
      target: "Para todas las edades",
      price: "$50",
      period: "/mes",
      badge: "NUEVO",
      recommended: false,
      features: [
        "Consultas veterinarias periódicas",
        "Control preventivo de vacunas",
        "Desparasitación seriada",
      ],
    };
    setPlans((prev) => [...prev, newPlan]);
  };

  const handleDeletePlan = (index: number) => {
    if (plans.length <= 1) {
      toast.error("Debe existir al menos un plan si la sección está activa.");
      return;
    }
    setPlans((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setSaving(true);
    // Limpiar líneas vacías en las coberturas
    const cleanedPlans = plans.map((p) => ({
      ...p,
      features: p.features.map((f) => f.trim()).filter(Boolean),
    }));

    saveWebsiteSettings({
      identity: {
        health_plans_config: {
          title,
          subtitle,
          plans: cleanedPlans,
        },
      },
    });

    setTimeout(() => {
      setSaving(false);
      toast.success("¡Planes de salud y precios actualizados con éxito!");
    }, 400);
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-5xl mx-auto">
      
      {/* Encabezado */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                Módulo Clínico Opcional
              </span>
              <span className="text-xs text-slate-500">• 100% Configurable</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-1">Planes de Salud y Paquetes Preventivos</h2>
            <p className="text-sm text-slate-500 mt-1">
              Personaliza los precios, nombres, coberturas y visibilidad de los paquetes médicos ofrecidos a los dueños de mascotas.
            </p>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>

      {/* Switch Toggle Maestro de la Sección */}
      <div className={`p-5 rounded-3xl border transition-all ${
        isEnabled 
          ? "bg-emerald-50/60 border-emerald-200 shadow-xs" 
          : "bg-slate-50 border-slate-200"
      }`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl grid place-items-center ${
              isEnabled ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-200 text-slate-500"
            }`}>
              {isEnabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>Mostrar sección de Planes de Salud en la página web</span>
                {isEnabled ? (
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">VISIBLE</span>
                ) : (
                  <span className="text-[10px] bg-slate-400 text-white px-2 py-0.5 rounded-full font-bold">OCULTO</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Si tu clínica no maneja paquetes mensuales o prepago, puedes apagar este botón y la sección desaparecerá por completo de la página.
              </p>
            </div>
          </div>

          <Switch 
            checked={isEnabled} 
            onCheckedChange={handleToggleSection} 
          />
        </div>
      </div>

      {/* Textos Principales de la Sección */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Textos del Encabezado
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Título de la Sección</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Planes de Salud y Paquetes Preventivos"
              className="text-sm font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Subtítulo / Bajada Descriptiva</Label>
            <Input 
              value={subtitle} 
              onChange={(e) => setSubtitle(e.target.value)} 
              placeholder="Tranquilidad médica continua para tu mascota..."
              className="text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* Editor de Planes Individuales */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">Tarjetas de Planes Configurados ({plans.length})</h3>
            <p className="text-xs text-slate-500">Edita los precios, periodos, coberturas y destaca el plan preferido.</p>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddPlan}
            className="text-xs font-bold border-slate-200 hover:bg-slate-100"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Agregar Plan
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, idx) => (
            <div 
              key={plan.id || idx}
              className={`bg-white rounded-3xl p-5 border flex flex-col justify-between transition-all ${
                plan.recommended 
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md" 
                  : "border-slate-200 shadow-xs hover:border-slate-300"
              }`}
            >
              <div className="space-y-4">
                
                {/* Cabecera de la Tarjeta */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <span className="text-xs font-black text-slate-400">PLAN #{idx + 1}</span>
                  
                  <button 
                    type="button"
                    onClick={() => handleDeletePlan(idx)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-rose-50"
                    title="Eliminar este plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Destacar como Recomendado */}
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-700">★ Destacar como Recomendado</span>
                  <Switch 
                    checked={plan.recommended} 
                    onCheckedChange={(val) => handleUpdatePlan(idx, 'recommended', val)} 
                  />
                </div>

                {/* Nombre del Plan */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600">Nombre del Plan</Label>
                  <Input 
                    value={plan.name} 
                    onChange={(e) => handleUpdatePlan(idx, 'name', e.target.value)} 
                    placeholder="Ej. Plan Cachorros"
                    className="text-xs font-bold"
                  />
                </div>

                {/* Dirigido a / Público */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600">Dirigido a / Edad</Label>
                  <Input 
                    value={plan.target} 
                    onChange={(e) => handleUpdatePlan(idx, 'target', e.target.value)} 
                    placeholder="Ej. Menores a 1 año"
                    className="text-xs"
                  />
                </div>

                {/* Precio y Periodo */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-600">Precio</Label>
                    <Input 
                      value={plan.price} 
                      onChange={(e) => handleUpdatePlan(idx, 'price', e.target.value)} 
                      placeholder="$45 o ₡25,000"
                      className="text-xs font-black text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-600">Frecuencia</Label>
                    <Input 
                      value={plan.period} 
                      onChange={(e) => handleUpdatePlan(idx, 'period', e.target.value)} 
                      placeholder="/mes"
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Etiqueta / Badge */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600">Etiqueta Superior (Badge)</Label>
                  <Input 
                    value={plan.badge} 
                    onChange={(e) => handleUpdatePlan(idx, 'badge', e.target.value)} 
                    placeholder="DESARROLLO, MÁS ELEGIDO..."
                    className="text-xs uppercase font-bold"
                  />
                </div>

                {/* Coberturas Incluidas */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600">
                    Coberturas y Beneficios (un ítem por línea)
                  </Label>
                  <Textarea 
                    value={Array.isArray(plan.features) ? plan.features.join('\n') : plan.features} 
                    onChange={(e) => handleFeaturesChange(idx, e.target.value)} 
                    placeholder="Consulta médica periódica&#10;Vacuna séxtuple&#10;Desparasitación seriada"
                    rows={6}
                    className="text-xs font-normal leading-relaxed resize-none"
                  />
                  <p className="text-[10px] text-slate-400">Cada salto de línea crea un ítem con un check verde en la web.</p>
                </div>

              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>{plan.features?.length || 0} coberturas configuradas</span>
                <span className="text-emerald-700 font-bold">{plan.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botón flotante/inferior de Guardar */}
      <div className="border-t border-slate-200 pt-5 flex items-center justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 shadow-sm"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Guardando..." : "Guardar Cambios de Planes"}
        </Button>
      </div>

    </div>
  );
}
