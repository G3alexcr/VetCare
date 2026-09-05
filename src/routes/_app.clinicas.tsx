import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { SuperAdminLayout } from "@/components/superadmin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Building2, Plus, Edit, Trash2, ShieldCheck, PauseCircle, PlayCircle, PawPrint, Users, DollarSign, HardDrive, Package, CheckCircle, LogIn,
} from "lucide-react";
import {
  addBranch, addClinic, addPlan, deleteBranch, deleteClinic, deletePlan,
  reactivateClinic, suspendClinic, updateBranch, updateClinic, updatePlan, setCurrentClinic, setActingClinic,
  useBranches, useClinicUsers, usePlans, useActingClinicId,
  type Branch, type Clinic, type SubscriptionPlan,
} from "@/lib/saas-store";
import { useCurrentRoleId } from "@/lib/rbac";
import { useMyClinics } from "@/hooks/use-my-clinics";
import { toast } from "sonner";

function SaasRoute() {
  const roleId = useCurrentRoleId();
  const isSuper = roleId === "role_super";
  const actingClinicId = useActingClinicId();

  if (isSuper && !actingClinicId) {
    return <SuperAdminLayout><SaasPage /></SuperAdminLayout>;
  }
  return <AppLayout><SaasPage /></AppLayout>;
}

export const Route = createFileRoute("/_app/clinicas")({
  head: () => ({ meta: [{ title: "Multi-Clínica · Super Admin — VetCare" }] }),
  component: SaasRoute,
});

const statusColor: Record<string, string> = {
  Activa: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Prueba: "bg-sky-100 text-sky-700 border-sky-200",
  Suspendida: "bg-amber-100 text-amber-700 border-amber-200",
  Cancelada: "bg-red-100 text-red-700 border-red-200",
};

function SaasPage() {
  const clinics = useMyClinics();
  const plans = usePlans();
  const branches = useBranches();
  const users = useClinicUsers();
  const roleId = useCurrentRoleId();
  const isSuper = roleId === "role_super";

  const totals = useMemo(() => ({
    clinics: clinics.length,
    active: clinics.filter((c) => c.subscriptionStatus === "Activa").length,
    users: users.length,
    mrr: clinics.reduce((sum, c) => sum + (plans.find((p) => p.id === c.subscriptionPlanId)?.monthlyPrice ?? 0), 0),
  }), [clinics, users, plans]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary" />
            {isSuper ? "Panel Super Administrador" : "Mis Clínicas"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSuper
              ? "Administra clínicas, planes de suscripción, sucursales y estadísticas globales."
              : "Entra a cada una de tus clínicas para gestionarlas."}
          </p>
        </div>
      </div>

      {isSuper && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={Building2} label="Clínicas totales" value={totals.clinics} tone="sky" />
          <Kpi icon={PlayCircle} label="Activas" value={totals.active} tone="emerald" />
          <Kpi icon={Users} label="Usuarios globales" value={totals.users} tone="violet" />
          <Kpi icon={DollarSign} label="MRR estimado" value={`$${totals.mrr}`} tone="amber" />
        </div>
      )}

      {isSuper ? (
        <Tabs defaultValue="clinics">
          <TabsList>
            <TabsTrigger value="clinics"><Building2 className="h-4 w-4 mr-1.5" />Clínicas</TabsTrigger>
            <TabsTrigger value="plans"><Package className="h-4 w-4 mr-1.5" />Planes</TabsTrigger>
            <TabsTrigger value="branches"><PawPrint className="h-4 w-4 mr-1.5" />Sucursales</TabsTrigger>
          </TabsList>
          <TabsContent value="clinics" className="mt-4"><ClinicsTab clinics={clinics} plans={plans} isSuper={isSuper} /></TabsContent>
          <TabsContent value="plans" className="mt-4"><PlansTab plans={plans} /></TabsContent>
          <TabsContent value="branches" className="mt-4"><BranchesTab branches={branches} clinics={clinics} /></TabsContent>
        </Tabs>
      ) : (
        <ClinicsTab clinics={clinics} plans={plans} isSuper={isSuper} />
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string | number; tone: string }) {
  const map: Record<string, string> = {
    sky: "bg-sky-50 text-sky-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg grid place-items-center ${map[tone]}`}><Icon className="h-5 w-5" /></div>
        <div><div className="text-xs text-muted-foreground">{label}</div><div className="text-xl font-semibold">{value}</div></div>
      </div>
    </Card>
  );
}

/* ---------- Clinics ---------- */
function ClinicsTab({ clinics, plans, isSuper }: { clinics: Clinic[]; plans: SubscriptionPlan[]; isSuper: boolean }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Clinic | null>(null);

  const entrar = (c: Clinic) => {
    setCurrentClinic(c.id);
    if (isSuper) setActingClinic(c.id);
    toast.success(`Entrando a ${c.name}`);
    navigate({ to: "/dashboard" });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          {isSuper ? `${clinics.length} clínicas registradas` : `${clinics.length} clínica(s) donde eres miembro`}
        </div>
        {isSuper && (
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nueva clínica</Button></DialogTrigger>
            <ClinicDialog editing={editing} plans={plans} onClose={() => { setOpen(false); setEditing(null); }} />
          </Dialog>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clínica</TableHead>
              <TableHead>País / Ciudad</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clinics.map((c) => {
              const plan = plans.find((p) => p.id === c.subscriptionPlanId);
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg grid place-items-center text-white text-xs font-bold" style={{ background: c.brandColor }}>
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.legalName} · {c.taxId}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{c.country}<br /><span className="text-xs text-muted-foreground">{c.city}</span></TableCell>
                  <TableCell><Badge variant="outline">{plan?.name ?? "—"}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={statusColor[c.subscriptionStatus]}>{c.subscriptionStatus}</Badge></TableCell>
                  <TableCell className="text-sm">{c.email}<br /><span className="text-xs text-muted-foreground">{c.phone}</span></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => entrar(c)} title={isSuper ? "Abrir en otra pestaña" : "Entrar a esta clínica"}>
                      <LogIn className="h-4 w-4" /> Entrar
                    </Button>
                    {isSuper && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => { setCurrentClinic(c.id); toast.success(`Clínica activa: ${c.name}`); }} title="Usar esta clínica">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        </Button>
                        {c.subscriptionStatus === "Suspendida" ? (
                          <Button size="sm" variant="ghost" onClick={() => { reactivateClinic(c.id); toast.success("Clínica reactivada"); }}><PlayCircle className="h-4 w-4 text-emerald-600" /></Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => { suspendClinic(c.id); toast("Clínica suspendida"); }}><PauseCircle className="h-4 w-4 text-amber-600" /></Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => { if (confirm(`¿Eliminar ${c.name}?`)) deleteClinic(c.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function ClinicDialog({ editing, plans, onClose }: { editing: Clinic | null; plans: SubscriptionPlan[]; onClose: () => void }) {
  const [form, setForm] = useState<Omit<Clinic, "id" | "createdAt">>(
    editing ?? {
      name: "", legalName: "", taxId: "", email: "", phone: "", whatsapp: "",
      address: "", city: "", country: "Costa Rica", logoUrl: "", timezone: "America/Costa_Rica",
      currency: "CRC", subscriptionPlanId: plans[0]?.id ?? "", subscriptionStatus: "Prueba",
      openingHours: "Lun-Vie 09:00-18:00", specialties: [], socials: {}, brandColor: "#0ea5e9",
    },
  );
  const save = () => {
    if (editing) { updateClinic(editing.id, form); toast.success("Clínica actualizada"); }
    else { addClinic(form); toast.success("Clínica creada"); }
    onClose();
  };
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm({ ...form, [k]: v });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>{editing ? "Editar" : "Nueva"} clínica</DialogTitle></DialogHeader>
      <div className="grid gap-3 max-h-[65vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Nombre comercial</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Razón social</Label><Input value={form.legalName} onChange={(e) => set("legalName", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Cédula / RUC / NIT</Label><Input value={form.taxId} onChange={(e) => set("taxId", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Dirección</Label><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Ciudad</Label><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>País</Label><Input value={form.country} onChange={(e) => set("country", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Zona horaria</Label><Input value={form.timezone} onChange={(e) => set("timezone", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Moneda</Label><Input value={form.currency} onChange={(e) => set("currency", e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Select value={form.subscriptionPlanId} onValueChange={(v) => set("subscriptionPlanId", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · ${p.monthlyPrice}/mes</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={form.subscriptionStatus} onValueChange={(v) => set("subscriptionStatus", v as Clinic["subscriptionStatus"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Activa", "Prueba", "Suspendida", "Cancelada"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Horario de atención</Label><Input value={form.openingHours} onChange={(e) => set("openingHours", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Color corporativo</Label><Input type="color" value={form.brandColor} onChange={(e) => set("brandColor", e.target.value)} className="h-10 p-1" /></div>
        </div>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={save}>Guardar</Button></DialogFooter>
    </DialogContent>
  );
}

/* ---------- Plans ---------- */
function PlansTab({ plans }: { plans: SubscriptionPlan[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">{plans.length} planes disponibles</div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nuevo plan</Button></DialogTrigger>
          <PlanDialog editing={editing} onClose={() => { setOpen(false); setEditing(null); }} />
        </Dialog>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-lg">{p.name}</div>
                <div className="text-2xl font-bold mt-1">${p.monthlyPrice}<span className="text-sm text-muted-foreground font-normal">/mes</span></div>
                <div className="text-xs text-muted-foreground">o ${p.annualPrice}/año</div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => deletePlan(p.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm">
              <li className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />{p.maxUsers} usuarios</li>
              <li className="flex items-center gap-2"><HardDrive className="h-4 w-4 text-muted-foreground" />{p.maxStorageGb} GB almacenamiento</li>
              <li className="flex items-center gap-2"><PawPrint className="h-4 w-4 text-muted-foreground" />{p.maxPets.toLocaleString()} mascotas</li>
              <li className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" />{p.maxBranches} sucursales</li>
              <li className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className={p.aiEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}>IA {p.aiEnabled ? "✓" : "—"}</Badge>
                <Badge variant="outline" className={p.whatsappEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}>WhatsApp {p.whatsappEnabled ? "✓" : "—"}</Badge>
              </li>
            </ul>
          </Card>
        ))}
      </div>
    </Card>
  );
}

function PlanDialog({ editing, onClose }: { editing: SubscriptionPlan | null; onClose: () => void }) {
  const [form, setForm] = useState<Omit<SubscriptionPlan, "id" | "createdAt">>(
    editing ?? { name: "", monthlyPrice: 0, annualPrice: 0, maxUsers: 1, maxStorageGb: 1, maxPets: 100, maxBranches: 1, aiEnabled: false, whatsappEnabled: false, posEnabled: false, tiendaOnlineEnabled: false, maxProducts: 50, maxVeterinarios: 2 },
  );
  const save = () => {
    if (editing) { updatePlan(editing.id, form); toast.success("Plan actualizado"); }
    else { addPlan(form); toast.success("Plan creado"); }
    onClose();
  };
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{editing ? "Editar" : "Nuevo"} plan</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2"><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Precio mensual</Label><Input type="number" value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: +e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Precio anual</Label><Input type="number" value={form.annualPrice} onChange={(e) => setForm({ ...form, annualPrice: +e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Máx. usuarios</Label><Input type="number" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: +e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Máx. almacenamiento (GB)</Label><Input type="number" value={form.maxStorageGb} onChange={(e) => setForm({ ...form, maxStorageGb: +e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Máx. mascotas</Label><Input type="number" value={form.maxPets} onChange={(e) => setForm({ ...form, maxPets: +e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Máx. sucursales</Label><Input type="number" value={form.maxBranches} onChange={(e) => setForm({ ...form, maxBranches: +e.target.value })} /></div>
        <div className="flex items-center gap-2"><Switch checked={form.aiEnabled} onCheckedChange={(v) => setForm({ ...form, aiEnabled: v })} /><Label>IA</Label></div>
        <div className="flex items-center gap-2"><Switch checked={form.whatsappEnabled} onCheckedChange={(v) => setForm({ ...form, whatsappEnabled: v })} /><Label>WhatsApp</Label></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={save}>Guardar</Button></DialogFooter>
    </DialogContent>
  );
}

/* ---------- Branches ---------- */
function BranchesTab({ branches, clinics }: { branches: Branch[]; clinics: Clinic[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">{branches.length} sucursales</div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nueva sucursal</Button></DialogTrigger>
          <BranchDialog editing={editing} clinics={clinics} onClose={() => { setOpen(false); setEditing(null); }} />
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sucursal</TableHead>
            <TableHead>Clínica</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-medium">{b.name}</TableCell>
              <TableCell className="text-sm">{clinics.find((c) => c.id === b.clinicId)?.name ?? "—"}</TableCell>
              <TableCell className="text-sm">{b.address}<br /><span className="text-xs text-muted-foreground">{b.phone}</span></TableCell>
              <TableCell className="text-sm">{b.manager}</TableCell>
              <TableCell className="text-right space-x-1">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(b); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => deleteBranch(b.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function BranchDialog({ editing, clinics, onClose }: { editing: Branch | null; clinics: Clinic[]; onClose: () => void }) {
  const [form, setForm] = useState<Omit<Branch, "id">>(
    editing ?? { clinicId: clinics[0]?.id ?? "", name: "", address: "", phone: "", manager: "" },
  );
  const save = () => {
    if (editing) { updateBranch(editing.id, form); toast.success("Sucursal actualizada"); }
    else { addBranch(form); toast.success("Sucursal creada"); }
    onClose();
  };
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{editing ? "Editar" : "Nueva"} sucursal</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div className="space-y-1.5">
          <Label>Clínica</Label>
          <Select value={form.clinicId} onValueChange={(v) => setForm({ ...form, clinicId: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Dirección</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Responsable</Label><Input value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} /></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={save}>Guardar</Button></DialogFooter>
    </DialogContent>
  );
}
