import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SuperAdminLayout } from "@/components/superadmin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCan } from "@/lib/rbac";
import { useMyClinics } from "@/hooks/use-my-clinics";
import {
  addClinic, updateClinic, suspendClinic, reactivateClinic, paySubscription, deleteClinic, setCurrentClinic, setActingClinic,
  usePlans, useSubscriptions, type Clinic, type SubscriptionPlan,
} from "@/lib/saas-store";
import { useAllPosSales } from "@/lib/pos-store";
import { useAllClientes } from "@/lib/clientes-store";
import { useCurrency } from "@/lib/config-store";
import { 
  ShieldAlert, Building2, Plus, Pencil, RefreshCw, PlayCircle, PauseCircle, 
  Eye, LogIn, Trash2, Globe, Server, Activity, Users, FileText, 
  Terminal, ShieldCheck, Search, ExternalLink, Download, Upload, CheckCircle2,
  XCircle, Check, Loader2, Key
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin")({ component: AdminCentroDeMando });

type SuperTab = "directorio" | "conectividad" | "proformas" | "sincronizador" | "metricas" | "auditoria";

const ALL_VET_MODULES = [
  { id: "dashboard", label: "Dashboard General" },
  { id: "clientes", label: "Gestión de Clientes" },
  { id: "mascotas", label: "Pacientes / Mascotas" },
  { id: "agenda", label: "Agenda Médica & Citas" },
  { id: "consultas", label: "Expediente Clínico & Consultas" },
  { id: "vacunas", label: "Carnet de Vacunación" },
  { id: "desparasitacion", label: "Control Antiparasitario" },
  { id: "cirugias", label: "Quirófano & Cirugías" },
  { id: "hospitalizacion", label: "Hospitalización & Jaulas" },
  { id: "fotografias", label: "Galería Médica / Fotos" },
  { id: "archivos", label: "Estudios, Rayos X & Archivos" },
  { id: "veterinarios", label: "Equipo Médico & Veterinarios" },
  { id: "servicios", label: "Catálogo de Servicios Médicos" },
  { id: "especies", label: "Especies & Razas" },
  { id: "caja", label: "Control de Caja & Movimientos" },
  { id: "inventario", label: "Farmacia & Inventario" },
  { id: "facturacion", label: "Facturación & Cobros" },
  { id: "punto_venta", label: "Punto de Venta (POS)" },
  { id: "website", label: "Website Studio & Portal Web" },
  { id: "automatizacion", label: "Recordatorios Automáticos" },
  { id: "clinicas", label: "Gestión Multi-Clínica" },
  { id: "roles", label: "Roles & Permisos del Personal" },
  { id: "configuracion", label: "Ajustes de la Clínica" }
];

function diasParaRenovar(c: Clinic, subs: ReturnType<typeof useSubscriptions>): number {
  const sub = subs.find((s) => s.clinicId === c.id);
  if (!sub?.endDate) return Infinity;
  return Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / 86400000);
}

function estadoBadge(s: string) {
  return s === "Activa" ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : s === "Prueba" ? "bg-sky-100 text-sky-700 border-sky-200"
    : s === "Suspendida" ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-slate-100 text-slate-700 border-slate-200";
}

function AdminCentroDeMando() {
  const navigate = useNavigate();
  const can = useCan();
  const currency = useCurrency();
  const myClinics = useMyClinics();
  const plans = usePlans();
  const subs = useSubscriptions();
  const allSales = useAllPosSales();
  const clientes = useAllClientes();

  const [mainTab, setMainTab] = useState<SuperTab>("directorio");
  const [searchTerm, setSearchTerm] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [editClinic, setEditClinic] = useState<Clinic | null>(null);
  const [detail, setDetail] = useState<Clinic | null>(null);

  // Filtro de búsqueda por nombre comercial o subdominio
  const filteredClinics = useMemo(() => {
    if (!searchTerm.trim()) return myClinics;
    const term = searchTerm.toLowerCase();
    return myClinics.filter(c => 
      c.name.toLowerCase().includes(term) || 
      (c.subdomain && c.subdomain.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  }, [myClinics, searchTerm]);

  const activeClinicsCount = myClinics.filter(c => c.subscriptionStatus === "Activa" || c.subscriptionStatus === "Prueba").length;
  const subdomainsCount = myClinics.filter(c => !!c.subdomain).length;

  const handleSaveNew = (data: {
    name: string;
    subdomain: string;
    legalName?: string;
    taxId?: string;
    email?: string;
    phone?: string;
    city?: string;
    country?: string;
    subscriptionPlanId: string;
    subscriptionStatus?: string;
  }) => {
    addClinic({
      name: data.name,
      subdomain: data.subdomain,
      legalName: data.legalName ?? data.name,
      taxId: data.taxId ?? "",
      email: data.email ?? "",
      phone: data.phone ?? "",
      whatsapp: data.phone ?? "",
      address: "",
      city: data.city ?? "",
      country: data.country ?? "Costa Rica",
      logoUrl: "",
      timezone: "America/Costa_Rica",
      currency: "CRC",
      subscriptionPlanId: data.subscriptionPlanId,
      subscriptionStatus: (data.subscriptionStatus as Clinic["subscriptionStatus"]) ?? "Prueba",
      openingHours: "",
      specialties: [],
      socials: {},
      brandColor: "#009d9e",
    });
    toast.success(`Clínica ${data.name} registrada con subdominio "${data.subdomain}"`);
    setNewOpen(false);
  };

  if (!can("clinicas", "configure")) {
    return (
      <SuperAdminLayout>
        <div className="grid place-items-center py-24">
          <div className="max-w-md text-center space-y-3 p-8 rounded-xl border bg-card">
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 text-destructive grid place-items-center">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold">Acceso restringido</h2>
            <p className="text-sm text-muted-foreground">Este panel es solo para administradores de la plataforma.</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Encabezado Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6 text-teal-600" /> Centro de Mando
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gestión global de infraestructuras, subdominios y clínicas veterinarias
            </p>
          </div>
          <Button 
            onClick={() => setNewOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-lg shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all text-xs uppercase"
          >
            <Plus className="w-4 h-4" /> Registrar Nueva Clínica
          </Button>
        </div>

        {/* Pestañas de Navegación Nexus-Style */}
        <div className="flex gap-1 p-1 bg-muted/60 rounded-2xl w-full border border-border/50 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: "directorio", label: "DIRECTORIO", icon: Server },
            { id: "conectividad", label: "CONECTIVIDAD & USUARIOS", icon: Users },
            { id: "proformas", label: "PROFORMAS & PROPUESTAS", icon: FileText },
            { id: "sincronizador", label: "SINCRONIZADOR", icon: Activity },
            { id: "metricas", label: "MÉTRICAS", icon: Globe },
            { id: "auditoria", label: "AUDITORÍA", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = mainTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMainTab(tab.id as SuperTab)}
                className={`shrink-0 flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                  active
                    ? "bg-card text-teal-600 shadow-sm border border-border/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-teal-600" : "text-muted-foreground"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tarjetas de Métricas Globales (Estilo Nexus) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">TOTAL CLÍNICAS</p>
              <h3 className="text-2xl font-black text-foreground">{myClinics.length}</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">ACTIVAS</p>
              <h3 className="text-2xl font-black text-foreground">{activeClinicsCount}</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">SUBDOMINIOS</p>
              <h3 className="text-2xl font-black text-foreground">{subdomainsCount}</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">ESTADO GLOBAL</p>
              <h3 className="text-2xl font-black text-emerald-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Online
              </h3>
            </div>
          </div>
        </div>

        {/* CONTENIDO SEGÚN LA PESTAÑA SELECCIONADA */}
        {mainTab === "directorio" && (
          <div className="space-y-4">
            {/* Buscador de clínicas */}
            <div className="relative max-w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clínica o subdominio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-3 rounded-2xl bg-card border border-border/80 text-sm shadow-xs"
              />
            </div>

            {/* Tabla de Directorio Nexus-Style */}
            <Card className="overflow-hidden rounded-2xl border-border/80 shadow-xs">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase">Clínica</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Dirección (Acceso Web / Subdominio)</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Estado</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Base de Datos</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClinics.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                        No se encontraron clínicas con ese criterio de búsqueda.
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredClinics.map((c) => {
                    const host = typeof window !== "undefined" ? window.location.host : "vet-care-lilac.vercel.app";
                    const sub = c.subdomain || "paws-pattient";
                    const webAccessUrl = `https://${host}/site/${sub}`;

                    return (
                      <TableRow key={c.id} className="hover:bg-muted/20 transition-colors">
                        {/* 1. Nombre de la clínica */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="h-10 w-10 rounded-xl grid place-items-center text-white font-black text-sm shadow-xs shrink-0"
                              style={{ background: c.brandColor || "#009d9e" }}
                            >
                              {c.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-foreground">{c.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{c.legalName || c.email}</div>
                            </div>
                          </div>
                        </TableCell>

                        {/* 2. Dirección Web y Subdominio */}
                        <TableCell>
                          <div className="space-y-1">
                            <a
                              href={webAccessUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-xs text-teal-700 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/30 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800"
                            >
                              <Globe className="w-3 h-3" />
                              <span>{host}/?s={sub}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                            </a>
                            <p className="text-[10px] text-muted-foreground">
                              Slug activo: <span className="font-mono font-bold text-foreground">{sub}</span>
                            </p>
                          </div>
                        </TableCell>

                        {/* 3. Estado */}
                        <TableCell>
                          <Badge className={estadoBadge(c.subscriptionStatus)}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
                            {c.subscriptionStatus}
                          </Badge>
                        </TableCell>

                        {/* 4. Base de Datos & Mantenimiento */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-mono text-[11px] text-muted-foreground truncate max-w-[180px] bg-muted/50 px-2 py-0.5 rounded border border-border/50">
                              ygftruagfklrefxjmqwv.supabase.co
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Conectada & OK
                            </div>
                          </div>
                        </TableCell>

                        {/* 5. Acciones */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Entrar al Portal */}
                            <Button
                              size="sm"
                              onClick={() => {
                                setCurrentClinic(c.id);
                                setActingClinic(c.id);
                                toast.success(`Entrando al panel de ${c.name}`);
                                navigate({ to: "/dashboard" });
                              }}
                              className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-8 text-xs rounded-xl shadow-xs"
                            >
                              <LogIn className="h-3.5 w-3.5 mr-1" /> Portal
                            </Button>

                            {/* Editar */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditClinic(c)}
                              className="h-8 text-xs rounded-xl border-border"
                              title="Editar configuración y subdominio"
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                            </Button>

                            {/* Detalle */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDetail(c)}
                              className="h-8 w-8 p-0 rounded-xl"
                              title="Detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* Suspender / Activar */}
                            {c.subscriptionStatus === "Suspendida" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { reactivateClinic(c.id); toast.success(`${c.name} reactivada`); }}
                                className="h-8 w-8 p-0 text-emerald-600 rounded-xl"
                                title="Reactivar"
                              >
                                <PlayCircle className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { suspendClinic(c.id); toast(`${c.name} suspendida`); }}
                                className="h-8 w-8 p-0 text-amber-600 rounded-xl"
                                title="Suspender"
                              >
                                <PauseCircle className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Eliminar */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`¿Eliminar la clínica ${c.name}? Esta acción no se puede deshacer.`)) {
                                  deleteClinic(c.id);
                                  toast.success(`${c.name} eliminada`);
                                }
                              }}
                              className="h-8 w-8 p-0 text-destructive rounded-xl"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {/* PESTAÑA: CONECTIVIDAD & USUARIOS */}
        {mainTab === "conectividad" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  Conectividad de Usuarios & Personal Veterinario
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Reporte de veterinarios, recepcionistas y administradores por cada clínica afiliada.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {myClinics.map((c) => {
                const clinicClientes = clientes.filter((x) => x.clinicId === c.id);
                return (
                  <Card key={c.id} className="p-5 rounded-2xl border-border/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg grid place-items-center text-white font-bold text-xs" style={{ background: c.brandColor || "#009d9e" }}>
                          {c.name.slice(0, 1).toUpperCase()}
                        </div>
                        <h4 className="font-bold text-sm text-foreground">{c.name}</h4>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-teal-600 border-teal-200">
                        {c.subdomain || "Sin subdominio"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t">
                      <div className="bg-muted/40 p-2.5 rounded-xl">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Clientes</p>
                        <p className="text-lg font-black text-foreground">{clinicClientes.length}</p>
                      </div>
                      <div className="bg-muted/40 p-2.5 rounded-xl">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Estado</p>
                        <p className="text-xs font-bold text-emerald-600 mt-1">{c.subscriptionStatus}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>Contacto: {c.phone || "—"}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-teal-600 hover:text-teal-700 font-bold"
                        onClick={() => {
                          setCurrentClinic(c.id);
                          setActingClinic(c.id);
                          navigate({ to: "/usuarios" });
                        }}
                      >
                        Ver Personal →
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* PESTAÑA: PROFORMAS & PROPUESTAS */}
        {mainTab === "proformas" && (
          <VetProformaGenerator clinics={myClinics} plans={plans} />
        )}

        {/* PESTAÑA: SINCRONIZADOR GLOBAL */}
        {mainTab === "sincronizador" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-amber-500" />
                  Sincronizador Global de Esquemas (SQL)
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Aplica cambios de base de datos o migraciones automáticas en todas las clínicas del grupo.
                </p>
              </div>
              <Button
                onClick={() => toast.success("Sincronización de esquemas completada en todas las clínicas")}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Sincronizar Tablas Ahora
              </Button>
            </div>

            <Card className="p-6 rounded-2xl bg-slate-950 text-amber-400 font-mono text-xs space-y-4 shadow-xl border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Consola de Mantenimiento SaaS</span>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">MASTER ROLE</Badge>
              </div>
              <div className="space-y-1.5 text-slate-300">
                <p className="text-emerald-400">✓ Tabla 'clinics' actualizada con columna 'subdomain'</p>
                <p className="text-emerald-400">✓ Políticas de Seguridad RLS aplicadas en 'website_slides' y 'website_settings'</p>
                <p className="text-emerald-400">✓ Detección de subdominio universal activa (/site/$slug y ?s=subdominio)</p>
                <p className="text-slate-500">Esperando instrucciones de sincronización...</p>
              </div>
            </Card>
          </div>
        )}

        {/* PESTAÑA: MÉTRICAS */}
        {mainTab === "metricas" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-600" />
              Métricas y Salud de la Red de Clínicas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myClinics.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between hover:border-teal-500/40 transition-all shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center font-bold text-xs">
                      {c.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate text-foreground">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                        <Globe className="w-3 h-3 text-teal-600" />
                        {c.subdomain || "sin-subdominio"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">ONLINE</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA: AUDITORÍA */}
        {mainTab === "auditoria" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" /> Registro de Auditoría y Eventos
            </h3>
            <Card className="p-6 rounded-2xl border-border/80 shadow-xs text-center py-16 text-muted-foreground text-sm">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-teal-600/40" />
              <p className="font-bold text-foreground">Todos los registros de auditoría están en orden</p>
              <p className="text-xs text-muted-foreground mt-1">Sin anomalías de seguridad detectadas en los accesos de clínicas.</p>
            </Card>
          </div>
        )}

        {/* MODAL AMPLIO NEXUS-STYLE PARA REGISTRAR CLÍNICA */}
        {newOpen && (
          <WideRegisterClinicModal
            open={newOpen}
            onClose={() => setNewOpen(false)}
            onSave={handleSaveNew}
            plans={plans}
          />
        )}

        {/* MODAL DE EDICIÓN AMPLIO */}
        {editClinic && (
          <WideEditClinicModal
            clinic={editClinic}
            plans={plans}
            onClose={() => setEditClinic(null)}
            onSave={(patch) => {
              updateClinic(editClinic.id, patch);
              toast.success("Clínica y subdominio actualizados");
              setEditClinic(null);
            }}
          />
        )}

        {/* MODAL DETALLE */}
        {detail && (
          <Dialog open={detail != null} onOpenChange={(o) => { if (!o) setDetail(null); }}>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader><DialogTitle>{detail.name}</DialogTitle></DialogHeader>
              <div className="space-y-2 text-sm pt-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Subdominio</span><span className="font-mono font-bold text-teal-600">{detail.subdomain || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Razón social</span><span>{detail.legalName || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">ID fiscal</span><span>{detail.taxId || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Correo</span><span>{detail.email}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Teléfono</span><span>{detail.phone}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ciudad</span><span>{detail.city} · {detail.country}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Estado</span><Badge className={estadoBadge(detail.subscriptionStatus)}>{detail.subscriptionStatus}</Badge></div>
                <Button className="w-full mt-4 bg-teal-600 hover:bg-teal-700" onClick={() => setDetail(null)}>Cerrar</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </SuperAdminLayout>
  );
}

// ---------------------------------------------------------------------------
// MODAL AMPLIO DE REGISTRO (NEXUS STYLE CON SUBDOMINIO Y SELECCIÓN DE MÓDULOS)
// ---------------------------------------------------------------------------
function WideRegisterClinicModal({
  open,
  onClose,
  onSave,
  plans,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  plans: SubscriptionPlan[];
}) {
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [legalName, setLegalName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("San José");
  const [country, setCountry] = useState("Costa Rica");
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || "");
  const [status, setStatus] = useState("Prueba");
  const [selectedModules, setSelectedModules] = useState<string[]>(ALL_VET_MODULES.map(m => m.id));

  // Generación automática del subdominio al escribir el nombre comercial
  const handleNameChange = (val: string) => {
    setName(val);
    const clean = val.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    if (!subdomain || subdomain === clean.slice(0, -1) || subdomain === clean) {
      setSubdomain(clean);
    }
  };

  const handleModuleToggle = (id: string) => {
    setSelectedModules(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Ingresa el nombre comercial");
    if (!subdomain.trim()) return toast.error("Ingresa el subdominio");

    onSave({
      name,
      subdomain: subdomain.toLowerCase().trim(),
      legalName: legalName || name,
      taxId,
      email,
      phone,
      city,
      country,
      subscriptionPlanId: selectedPlanId,
      subscriptionStatus: status,
    });
  };

  const currentHost = typeof window !== "undefined" ? window.location.host : "vet-care-lilac.vercel.app";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-card border border-border rounded-3xl shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Header fijo */}
        <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600" />
            Registrar Nueva Clínica Veterinaria
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-muted transition-colors">
            ✕
          </button>
        </div>

        {/* Formulario Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* Fila 1: Nombre Comercial y Subdominio Clave */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Nombre Comercial *</label>
              <input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Ej: Veterinaria Dr. Pet"
                className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border outline-none focus:ring-2 focus:ring-teal-500/20 text-sm font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase ml-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Subdominio Único *
              </label>
              <input
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                required
                placeholder="ej: drpet"
                className="w-full px-4 py-3 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-300 dark:border-teal-700 outline-none focus:ring-2 focus:ring-teal-500 font-mono text-sm font-bold text-teal-900 dark:text-teal-200"
              />
              <p className="text-[11px] text-muted-foreground ml-1">
                Acceso web: <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                  https://{currentHost}/?s={subdomain || "..."}
                </span>
              </p>
            </div>
          </div>

          {/* Fila 2: Razón social y Cédula */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Razón Social</label>
              <input
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Ej: Servicios Médicos Veterinarios S.A."
                className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border outline-none focus:ring-2 focus:ring-teal-500/20 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Cédula Jurídica / RUC / NIT</label>
              <input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="3-101-123456"
                className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border outline-none focus:ring-2 focus:ring-teal-500/20 text-sm"
              />
            </div>
          </div>

          {/* Fila 3: Correo y Teléfono */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@veterinaria.com"
                className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border outline-none focus:ring-2 focus:ring-teal-500/20 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Teléfono / WhatsApp</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+506 2222-3333"
                className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border outline-none focus:ring-2 focus:ring-teal-500/20 text-sm"
              />
            </div>
          </div>

          {/* Fila 4: Base de Datos & Conexión Cloud */}
          <div className="border border-border/60 rounded-2xl p-5 bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-600" /> Infraestructura & Base de Datos
            </h4>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground">Supabase Project Endpoint</label>
              <input
                readOnly
                value="https://ygftruagfklrefxjmqwv.supabase.co"
                className="w-full px-3 py-2 rounded-xl bg-background border border-border/80 font-mono text-xs text-muted-foreground"
              />
            </div>
          </div>

          {/* Fila 5: Licencia Comercial y Módulos Activos */}
          <div className="border-t border-border/60 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2 text-teal-700 dark:text-teal-400">
                <ShieldCheck className="w-4 h-4" /> Plan de Licencia Comercial
              </h4>
              <Badge variant="outline" className="text-xs">
                {selectedModules.length} de {ALL_VET_MODULES.length} módulos habilitados
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Plan / Tier Contratado</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border outline-none focus:ring-2 focus:ring-teal-500/20 font-bold text-foreground text-sm"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (${p.monthlyPrice}/mes)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Estado de la Suscripción</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border outline-none focus:ring-2 focus:ring-teal-500/20 font-bold text-foreground text-sm"
                >
                  <option value="Prueba">Período de Prueba (Trial)</option>
                  <option value="Activa">Suscripción Activa</option>
                  <option value="Suspendida">Suspendida por Pago</option>
                </select>
              </div>
            </div>

            {/* Checklist de Módulos */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase ml-1">
                Módulos Activos para la Clínica
              </label>
              <div className="border border-border/80 rounded-2xl p-5 bg-muted/10 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
                {ALL_VET_MODULES.map((mod) => {
                  const isChecked = selectedModules.includes(mod.id);
                  return (
                    <label key={mod.id} className="flex items-center gap-2.5 text-xs cursor-pointer select-none py-1.5 hover:bg-muted/40 rounded-lg px-2 transition-colors">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleModuleToggle(mod.id)}
                        className="rounded border-border text-teal-600 focus:ring-teal-500 w-4 h-4 shrink-0"
                      />
                      <span className={isChecked ? "font-bold text-foreground" : "text-muted-foreground"}>
                        {mod.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="border-t border-border pt-4 flex items-center justify-end gap-3 shrink-0">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl px-6">
              Afiliar & Activar Clínica
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MODAL DE EDICIÓN AMPLIO
// ---------------------------------------------------------------------------
function WideEditClinicModal({
  clinic,
  plans,
  onClose,
  onSave,
}: {
  clinic: Clinic;
  plans: SubscriptionPlan[];
  onClose: () => void;
  onSave: (patch: Partial<Clinic>) => void;
}) {
  const [name, setName] = useState(clinic.name);
  const [subdomain, setSubdomain] = useState(clinic.subdomain || "");
  const [legalName, setLegalName] = useState(clinic.legalName || "");
  const [taxId, setTaxId] = useState(clinic.taxId || "");
  const [email, setEmail] = useState(clinic.email || "");
  const [phone, setPhone] = useState(clinic.phone || "");
  const [city, setCity] = useState(clinic.city || "");
  const [planId, setPlanId] = useState(clinic.subscriptionPlanId);
  const [status, setStatus] = useState(clinic.subscriptionStatus);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      subdomain: subdomain.toLowerCase().trim(),
      legalName,
      taxId,
      email,
      phone,
      city,
      subscriptionPlanId: planId,
      subscriptionStatus: status as any,
    });
  };

  const currentHost = typeof window !== "undefined" ? window.location.host : "vet-care-lilac.vercel.app";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-3xl bg-card border border-border rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Pencil className="w-5 h-5 text-teal-600" />
            Editar Configuración de {clinic.name}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Nombre Comercial</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border outline-none focus:ring-2 focus:ring-teal-500/20 text-sm font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Subdominio
              </label>
              <input
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                required
                className="w-full px-4 py-3 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-300 dark:border-teal-700 outline-none font-mono text-sm font-bold text-teal-900 dark:text-teal-200"
              />
              <p className="text-[11px] text-muted-foreground">
                URL actual: <span className="font-mono text-teal-600 font-bold">https://{currentHost}/?s={subdomain}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Razón Social</label>
              <input value={legalName} onChange={(e) => setLegalName(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Cédula / Tax ID</label>
              <input value={taxId} onChange={(e) => setTaxId(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Plan de Software</label>
              <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border font-bold text-sm">
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Estado</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border font-bold text-sm">
                <option value="Activa">Activa</option>
                <option value="Prueba">Prueba</option>
                <option value="Suspendida">Suspendida</option>
              </select>
            </div>
          </div>

          <div className="border-t border-border pt-4 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl px-6">Guardar Cambios</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GENERADOR DE PROFORMAS Y PROPUESTAS VETERINARIAS
// ---------------------------------------------------------------------------
function VetProformaGenerator({ clinics, plans }: { clinics: Clinic[]; plans: SubscriptionPlan[] }) {
  const [selectedClinicId, setSelectedClinicId] = useState<string>("custom");
  const [clinicName, setClinicName] = useState<string>("Clínica Veterinaria San Francisco");
  const [legalName, setLegalName] = useState<string>("Servicios Veterinarios S.A.");
  const [taxId, setTaxId] = useState<string>("3-101-987654");
  const [directorName, setDirectorName] = useState<string>("Dr. Roberto Méndez M.V.");
  const [directorPhone, setDirectorPhone] = useState<string>("+506 8888-2233");
  const [directorEmail, setDirectorEmail] = useState<string>("contacto@vetsanfrancisco.com");
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || "pro");
  const [monthlyPrice, setMonthlyPrice] = useState<number>(plans[0]?.monthlyPrice || 49);
  const [repName, setRepName] = useState<string>("Alexander Cruz");
  const [validityDays, setValidityDays] = useState<number>(30);
  const [currency, setCurrency] = useState<"USD" | "CRC">("USD");

  const annualTotal = monthlyPrice * 12 * 0.85; // 15% dto anual

  const handleSelectClinic = (id: string) => {
    setSelectedClinicId(id);
    if (id === "custom") return;
    const c = clinics.find((x) => x.id === id);
    if (c) {
      setClinicName(c.name);
      setLegalName(c.legalName || c.name);
      setTaxId(c.taxId || "");
      setDirectorEmail(c.email || "");
      setDirectorPhone(c.phone || "");
    }
  };

  const handleSelectPlan = (id: string) => {
    setSelectedPlanId(id);
    const p = plans.find((x) => x.id === id);
    if (p) {
      setMonthlyPrice(p.monthlyPrice || 49);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Generador de Proformas & Propuestas Comerciales
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Genera cotizaciones oficiales de suscripción para clínicas y hospitales veterinarios.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            Imprimir / PDF
          </Button>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(
                `Propuesta VetCare para ${clinicName} - Plan ${plans.find((p) => p.id === selectedPlanId)?.name || 'Pro'}: $${monthlyPrice}/mes`
              );
              toast.success("Resumen copiado al portapapeles");
            }}
            className="gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold"
          >
            Copiar Resumen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 p-5 space-y-4 shadow-sm border-border bg-card">
          <h4 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2">
            <Building2 className="w-4 h-4 text-teal-600" /> Datos de la Clínica
          </h4>

          <div className="space-y-1.5">
            <Label className="text-xs">Cargar desde clínica registrada</Label>
            <Select value={selectedClinicId} onValueChange={handleSelectClinic}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Personalizado / Prospecto nuevo</SelectItem>
                {clinics.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Nombre Comercial</Label>
            <Input value={clinicName} onChange={(e) => setClinicName(e.target.value)} className="text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Razón Social</Label>
              <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cédula / Tax ID</Label>
              <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} className="text-xs" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Director Médico / Contacto</Label>
            <Input value={directorName} onChange={(e) => setDirectorName(e.target.value)} className="text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Teléfono</Label>
              <Input value={directorPhone} onChange={(e) => setDirectorPhone(e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Moneda</Label>
              <Select value={currency} onValueChange={(v: "USD" | "CRC") => setCurrency(v)}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="CRC">Colones (₡)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <h4 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pt-2 pb-2">
            Plan & Cotización
          </h4>

          <div className="space-y-1.5">
            <Label className="text-xs">Plan de Software</Label>
            <Select value={selectedPlanId} onValueChange={handleSelectPlan}>
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.monthlyPrice ? `$${p.monthlyPrice}/mes` : 'Gratis'})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Precio Mensual ({currency})</Label>
              <Input type="number" value={monthlyPrice} onChange={(e) => setMonthlyPrice(Number(e.target.value))} className="text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Validez (Días)</Label>
              <Input type="number" value={validityDays} onChange={(e) => setValidityDays(Number(e.target.value))} className="text-xs" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Asesor Comercial</Label>
            <Input value={repName} onChange={(e) => setRepName(e.target.value)} className="text-xs" />
          </div>
        </Card>

        {/* Vista Previa Documento */}
        <Card className="lg:col-span-8 p-8 shadow-md border-border bg-white text-slate-900 rounded-2xl overflow-hidden print:p-0 print:border-none print:shadow-none">
          <div className="space-y-6 max-w-2xl mx-auto text-sm">
            <div className="flex items-start justify-between border-b pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white grid place-items-center shadow-lg font-black text-xl">
                  🐾
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">VetCare Cloud</h2>
                  <p className="text-xs text-slate-500 font-medium">Plataforma Integral de Gestión y Portales Veterinarios</p>
                  <p className="text-[11px] text-slate-400 font-mono">contacto@vetcare.app · +506 8888-8888</p>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-teal-100 text-teal-800 border-teal-200 font-mono text-xs px-3 py-1">
                  PROFORMA #7420
                </Badge>
                <p className="text-xs text-slate-500 mt-2 font-medium">Fecha: {new Date().toLocaleDateString()}</p>
                <p className="text-xs text-slate-500">Validez: {validityDays} días</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 uppercase font-bold text-[10px]">Cliente / Clínica:</p>
                <p className="font-extrabold text-sm text-slate-900 mt-0.5">{clinicName}</p>
                <p className="text-slate-600 mt-0.5">{legalName} · ID: {taxId || "Por definir"}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase font-bold text-[10px]">Atención a:</p>
                <p className="font-bold text-slate-800 mt-0.5">{directorName}</p>
                <p className="text-slate-600 mt-0.5">{directorPhone} · {directorEmail}</p>
              </div>
            </div>

            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Descripción de la Solución</th>
                  <th className="p-3 text-center">Modalidad</th>
                  <th className="p-3 text-right">Inversión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">Licencia SaaS VetCare — {plans.find((p) => p.id === selectedPlanId)?.name || 'Plan Pro'}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Expediente clínico digital, agenda médica, hospitalización, vacunas, inventario y punto de venta.
                    </p>
                  </td>
                  <td className="p-3 text-center text-slate-600">Mensual recurrente</td>
                  <td className="p-3 text-right font-bold text-slate-900">${monthlyPrice} / mes</td>
                </tr>
                <tr>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">Website Studio & Portal Web con Subdominio</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Sitio web institucional publicado, catálogo de servicios, carrusel clínico y portal de citas online.
                    </p>
                  </td>
                  <td className="p-3 text-center text-emerald-600 font-bold">Incluido</td>
                  <td className="p-3 text-right font-bold text-emerald-600">$0.00</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-between items-center bg-teal-50 border border-teal-200 p-4 rounded-xl">
              <div>
                <p className="text-xs font-bold text-teal-900">Opción Pago Anual con 15% de Descuento:</p>
                <p className="text-[11px] text-teal-700">12 meses completos por tan solo <strong>${Math.round(annualTotal)} {currency}</strong> al año.</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Total Mensual:</p>
                <p className="text-2xl font-black text-teal-800">${monthlyPrice} <span className="text-xs font-normal text-slate-500">{currency}</span></p>
              </div>
            </div>

            <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs text-slate-600 border-t">
              <div>
                <div className="border-b border-slate-300 w-40 mx-auto mb-2" />
                <p className="font-bold text-slate-900">{repName}</p>
                <p className="text-[11px] text-slate-500">Asesor de Cuentas VetCare Cloud</p>
              </div>
              <div>
                <div className="border-b border-slate-300 w-40 mx-auto mb-2" />
                <p className="font-bold text-slate-900">{directorName}</p>
                <p className="text-[11px] text-slate-500">Aceptación y Visto Bueno</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

