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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCan } from "@/lib/rbac";
import { useMyClinics } from "@/hooks/use-my-clinics";
import {
  addClinic, updateClinic, suspendClinic, reactivateClinic, paySubscription, deleteClinic, setCurrentClinic, setActingClinic,
  usePlans, useSubscriptions, type Clinic, type SubscriptionPlan,
} from "@/lib/saas-store";
import { useAllPosSales } from "@/lib/pos-store";
import { useAllClientes } from "@/lib/clientes-store";
import { formatMoney, useCurrency } from "@/lib/config-store";
import { ShieldAlert, Building2, Plus, Pencil, RefreshCw, PlayCircle, PauseCircle, Eye, UserPlus, LogIn, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin")({ component: AdminCentroDeMando });

type TabKey = "todos" | "verificado" | "legal" | "por_renovar" | "intransaccion" | "pausado" | "inactivo";

const TABS: { key: TabKey; label: string }[] = [
  { key: "verificado", label: "Verificadas" },
  { key: "legal", label: "Con ID fiscal" },
  { key: "por_renovar", label: "Próximo a renovar" },
  { key: "intransaccion", label: "Sin transacciones" },
  { key: "pausado", label: "Pausadas" },
  { key: "inactivo", label: "Inactivas" },
];

function diasParaRenovar(c: Clinic, subs: ReturnType<typeof useSubscriptions>): number {
  const sub = subs.find((s) => s.clinicId === c.id);
  if (!sub?.endDate) return Infinity;
  return Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / 86400000);
}

function estadoBadge(s: string) {
  return s === "Activa" ? "bg-emerald-100 text-emerald-700"
    : s === "Prueba" ? "bg-sky-100 text-sky-700"
    : s === "Suspendida" ? "bg-amber-100 text-amber-700"
    : "bg-slate-100 text-slate-700";
}

function AdminCentroDeMando() {
  const can = useCan();
  const currency = useCurrency();
  const myClinics = useMyClinics();
  const plans = usePlans();
  const subs = useSubscriptions();
  const allSales = useAllPosSales();
  const clientes = useAllClientes();

  const [tab, setTab] = useState<TabKey>("todos");
  const [newOpen, setNewOpen] = useState(false);
  const [editClinic, setEditClinic] = useState<Clinic | null>(null);
  const [detail, setDetail] = useState<Clinic | null>(null);

  const planOf = (id: string) => plans.find((p) => p.id === id);

  const marca = (c: Clinic) => {
    const dias = diasParaRenovar(c, subs);
    const hasVentas30 = allSales.some((s) => s.clinicId === c.id && Date.now() - new Date(s.date).getTime() < 30 * 86400000);
    return {
      verificado: c.subscriptionStatus === "Activa" || c.subscriptionStatus === "Prueba",
      legal: !!c.taxId,
      por_renovar: dias >= 0 && dias <= 30,
      intransaccion: !hasVentas30,
      pausado: c.subscriptionStatus === "Suspendida",
      inactivo: c.subscriptionStatus === "Cancelada",
    } as Record<Exclude<TabKey, "todos">, boolean>;
  };

  const matches = (c: Clinic) => {
    if (tab === "todos") return true;
    return marca(c)[tab];
  };

  const filtered = myClinics.filter(matches);

  const counts = useMemo(() => {
    const base: Record<TabKey, number> = { todos: myClinics.length, verificado: 0, legal: 0, por_renovar: 0, intransaccion: 0, pausado: 0, inactivo: 0 };
    for (const c of myClinics) { const m = marca(c); for (const k of ["verificado","legal","por_renovar","intransaccion","pausado","inactivo"] as const) if (m[k]) base[k]++; }
    return base;
  }, [myClinics, subs, allSales]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveNew = (data: { name?: string; legalName?: string; taxId?: string; email?: string; phone?: string; city?: string; country?: string; subscriptionPlanId: string; subscriptionStatus?: string }) => {
    addClinic({
      name: data.name ?? "",
      legalName: data.legalName ?? data.name ?? "",
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
    toast.success("Clínica afiliada. Se creó con estado de prueba.");
    setNewOpen(false);
  };

  if (!can("clinicas", "configure")) {
    return (
      <SuperAdminLayout>
        <div className="grid place-items-center py-24">
          <div className="max-w-md text-center space-y-3 p-8 rounded-xl border bg-card">
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 text-destructive grid place-items-center"><ShieldAlert className="h-6 w-6" /></div>
            <h2 className="text-lg font-semibold">Acceso restringido</h2>
            <p className="text-sm text-muted-foreground">Este panel es solo para administradores de la plataforma.</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="h-6 w-6 text-primary" /> Centro de Mando</h1>
            <p className="text-muted-foreground text-sm mt-1">Control de todas las clínicas veterinarias del grupo. Afilia, verifica y gestiona.</p>
          </div>
          <Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4 mr-1" /> Afiliar nueva clínica</Button>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="todos">Todas ({counts.todos})</TabsTrigger>
            {TABS.map((t) => <TabsTrigger key={t.key} value={t.key}>{t.label} ({counts[t.key]})</TabsTrigger>)}
          </TabsList>

          <TabsContent value="todos" className="mt-4"><ClinicasTable clinics={filtered} plans={plans} currency={currency} marca={marca} diasParaRenovar={diasParaRenovar} setDetail={setDetail} setEdit={setEditClinic} clientes={clientes} /></TabsContent>
          {TABS.map((t) => <TabsContent key={t.key} value={t.key} className="mt-4"><ClinicasTable clinics={filtered} plans={plans} currency={currency} marca={marca} diasParaRenovar={diasParaRenovar} setDetail={setDetail} setEdit={setEditClinic} clientes={clientes} /></TabsContent>)}
        </Tabs>
      </div>

      {/* Afiliar clínica */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Afiliar nueva clínica</DialogTitle></DialogHeader>
          <NewClinicForm onSave={saveNew} onCancel={() => setNewOpen(false)} plans={plans} defaultPlanId={plans[0]?.id ?? ""} />
        </DialogContent>
      </Dialog>

      {/* Editar */}
      <Dialog open={editClinic != null} onOpenChange={(o) => { if (!o) setEditClinic(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Editar clínica</DialogTitle></DialogHeader>
          {editClinic && <EditClinicForm clinic={editClinic} onSave={(patch) => { updateClinic(editClinic.id, patch); toast.success("Clínica actualizada"); setEditClinic(null); }} />}
        </DialogContent>
      </Dialog>

      {/* Detalle */}
      <Dialog open={detail != null} onOpenChange={(o) => { if (!o) setDetail(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{detail?.name}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Razón social</span><span>{detail.legalName || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ID fiscal</span><span>{detail.taxId || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Correo</span><span>{detail.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Teléfono</span><span>{detail.phone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ciudad</span><span>{detail.city} · {detail.country}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span>{planOf(detail.subscriptionPlanId)?.name ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Estado</span><Badge className={estadoBadge(detail.subscriptionStatus)}>{detail.subscriptionStatus}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Clientes</span><span>{clientes.filter((c) => c.clinicId === detail.id).length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Próximo a renovar</span><span>{diasParaRenovar(detail, subs) === Infinity ? "—" : `${diasParaRenovar(detail, subs)} días`}</span></div>
              <Button className="w-full mt-2" onClick={() => setDetail(null)}>Cerrar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
}

function ClinicasTable({ clinics, plans, currency, marca, diasParaRenovar, setDetail, setEdit, clientes }: {
  clinics: Clinic[];
  plans: SubscriptionPlan[];
  currency: string;
  marca: (c: Clinic) => Record<Exclude<TabKey, "todos">, boolean>;
  diasParaRenovar: (c: Clinic, subs: ReturnType<typeof useSubscriptions>) => number;
  setDetail: (c: Clinic) => void;
  setEdit: (c: Clinic) => void;
  clientes: ReturnType<typeof useAllClientes>;
}) {
  const subs = useSubscriptions();
  const navigate = useNavigate();
  const planName = (id: string) => plans.find((p) => p.id === id)?.name ?? "—";

  // Entrar a la clínica elegida: cambia la clínica activa/actuando y va a su Dashboard.
  const entrar = (c: Clinic) => {
    setCurrentClinic(c.id);
    setActingClinic(c.id);
    toast.success(`Entrando a ${c.name}`);
    navigate({ to: "/dashboard" });
  };
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Registro</TableHead>
            <TableHead>Contribuyente</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Fecha de alta</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clinics.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin resultados para este filtro.</TableCell></TableRow>}
          {clinics.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg grid place-items-center text-white font-bold" style={{ background: c.brandColor }}>
                    {c.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-sm">{c.legalName || "—"}</div>
                <div className="text-xs text-muted-foreground">{c.taxId || "Sin ID fiscal"} · {marca(c).legal ? "Con ID" : "Pendiente"}</div>
              </TableCell>
              <TableCell className="text-sm">{c.phone}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
              <TableCell><Badge variant="secondary">{planName(c.subscriptionPlanId)}</Badge></TableCell>
              <TableCell><Badge className={estadoBadge(c.subscriptionStatus)}>{c.subscriptionStatus}</Badge></TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button size="sm" title="Entrar a la clínica" onClick={() => entrar(c)}><LogIn className="h-4 w-4 mr-1" /> Entrar</Button>
                  <Button size="sm" variant="ghost" title="Detalle" onClick={() => setDetail(c)}><Eye className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" title="Editar" onClick={() => setEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-emerald-600" title="Renovar / activar" onClick={() => { paySubscription(c.id, c.subscriptionPlanId, "Stripe"); toast.success(`${c.name} renovada (pago simulado)`); }}><RefreshCw className="h-4 w-4" /></Button>
                  {c.subscriptionStatus === "Suspendida" || c.subscriptionStatus === "Cancelada" ? (
                    <Button size="sm" variant="ghost" className="text-emerald-600" title="Reactivar" onClick={() => { reactivateClinic(c.id); toast.success(`${c.name} reactivada`); }}><PlayCircle className="h-4 w-4" /></Button>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-amber-600" title="Suspender" onClick={() => { suspendClinic(c.id); toast(`${c.name} suspendida`); }}><PauseCircle className="h-4 w-4" /></Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-sky-600" title="Enviar token" onClick={() => toast.success(`Token de acceso enviado a ${c.email}`)}><UserPlus className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive" title="Eliminar" onClick={() => { if (confirm(`¿Eliminar la clínica ${c.name}? Esta acción no se puede deshacer.`)) { deleteClinic(c.id); toast.success(`${c.name} eliminada`); } }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function NewClinicForm({ onSave, onCancel, plans, defaultPlanId }: { onSave: (d: { name?: string; legalName?: string; taxId?: string; email?: string; phone?: string; city?: string; country?: string; subscriptionPlanId: string; subscriptionStatus?: string }) => void; onCancel: () => void; plans: SubscriptionPlan[]; defaultPlanId: string }) {
  const [f, setF] = useState({ name: "", legalName: "", taxId: "", email: "", phone: "", city: "", country: "Costa Rica", subscriptionPlanId: defaultPlanId, subscriptionStatus: "Prueba" });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const save = () => { if (!f.name.trim()) return toast.error("Ingresa el nombre"); onSave(f); };
  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Nombre comercial *</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Razón social</Label><Input value={f.legalName} onChange={(e) => set("legalName", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Cédula / RUC / NIT</Label><Input value={f.taxId} onChange={(e) => set("taxId", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Correo</Label><Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Teléfono</Label><Input value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Ciudad</Label><Input value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
        <div className="space-y-1.5">
          <Label>País</Label>
          <Select value={f.country} onValueChange={(v) => set("country", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Costa Rica","Ecuador","Colombia","México","Argentina","Perú","Chile"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="space-y-1.5">
          <Label>Plan</Label>
          <Select value={f.subscriptionPlanId} onValueChange={(v) => set("subscriptionPlanId", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="space-y-1.5">
          <Label>Estado</Label>
          <Select value={f.subscriptionStatus} onValueChange={(v) => set("subscriptionStatus", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Prueba","Activa","Suspendida","Cancelada"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>
      <DialogFooter><Button variant="outline" onClick={onCancel}>Cancelar</Button><Button onClick={save}>Afiliar clínica</Button></DialogFooter>
    </div>
  );
}

function EditClinicForm({ clinic, onSave }: { clinic: Clinic; onSave: (patch: Partial<Clinic>) => void }) {
  const [f, setF] = useState({ name: clinic.name, legalName: clinic.legalName, taxId: clinic.taxId, email: clinic.email, phone: clinic.phone, city: clinic.city, country: clinic.country });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Nombre</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Razón social</Label><Input value={f.legalName} onChange={(e) => set("legalName", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Cédula / RUC / NIT</Label><Input value={f.taxId} onChange={(e) => set("taxId", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Correo</Label><Input value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Teléfono</Label><Input value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Ciudad</Label><Input value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={() => onSave({})}>Cancelar</Button><Button onClick={() => onSave(f)}>Guardar</Button></DialogFooter>
    </div>
  );
}
