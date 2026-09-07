import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ImageInput } from "@/components/image-input";
import { useAuth } from "@/lib/auth";
import {
  addClinicUser, deleteClinicUser, updateClinic, updateClinicUser, paySubscription,
  useBranches, useClinicUsers, useClinics, useCurrentClinicId, usePlans,
  type SaasRole,
} from "@/lib/saas-store";
import { useState } from "react";
import { usePets } from "@/lib/pets-store";
import { CURRENCIES, formatMoney, setCurrency, useCurrency, type Currency } from "@/lib/config-store";
import { useStorageUsage, formatBytes } from "@/lib/storage";
import {
  Building2, Users, Package, TrendingUp, HardDrive, PawPrint, Plus, Edit, Trash2, Instagram, Facebook, Globe, Coins, Rocket,
  Mail, KeyRound, ExternalLink, CheckCircle2, AlertTriangle, Send, ShieldCheck, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { getClinicEmailConfig, saveClinicEmailConfig, type ClinicEmailConfig } from "@/lib/clinic-email-store";
import { sendTestEmailFn } from "@/lib/email.functions";

export const Route = createFileRoute("/_app/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — VetCare" }] }),
  component: () => <AppLayout><SettingsPage /></AppLayout>,
});

const roleColor: Record<string, string> = {
  Owner: "bg-primary/10 text-primary border-primary/20",
  Administrador: "bg-violet-100 text-violet-700 border-violet-200",
  Veterinario: "bg-sky-100 text-sky-700 border-sky-200",
  Recepción: "bg-amber-100 text-amber-700 border-amber-200",
  Asistente: "bg-teal-100 text-teal-700 border-teal-200",
  Inventario: "bg-slate-100 text-slate-700 border-slate-200",
  Caja: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Super Administrador": "bg-red-100 text-red-700 border-red-200",
};

function SettingsPage() {
  const { user } = useAuth();
  const clinicId = useCurrentClinicId();
  const clinics = useClinics();
  const users = useClinicUsers();
  const branches = useBranches();
  const plans = usePlans();
  const clinic = clinics.find((c) => c.id === clinicId);
  const plan = plans.find((p) => p.id === clinic?.subscriptionPlanId);
  const clinicUsers = users.filter((u) => u.clinicId === clinicId || u.clinicIds?.includes(clinicId));
  const storageUsed = useStorageUsage();
  const [payPlanId, setPayPlanId] = useState(clinic?.subscriptionPlanId ?? plans[0]?.id ?? "");
  const [payMethod, setPayMethod] = useState("Stripe");
  const clinicBranches = branches.filter((b) => b.clinicId === clinicId);

  if (!clinic) return <div>Clínica no encontrada</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">Datos de la clínica, equipo y suscripción.</p>
      </div>

      <Tabs defaultValue="clinic">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="clinic"><Building2 className="h-4 w-4 mr-1.5" />Clínica</TabsTrigger>
          <TabsTrigger value="email"><Mail className="h-4 w-4 mr-1.5" />Correos / Resend</TabsTrigger>
          <TabsTrigger value="team"><Users className="h-4 w-4 mr-1.5" />Equipo</TabsTrigger>
          <TabsTrigger value="subscription"><Package className="h-4 w-4 mr-1.5" />Suscripción</TabsTrigger>
          <TabsTrigger value="money"><Coins className="h-4 w-4 mr-1.5" />Moneda</TabsTrigger>
          <TabsTrigger value="dashboard"><TrendingUp className="h-4 w-4 mr-1.5" />Dashboard Owner</TabsTrigger>
        </TabsList>

        <TabsContent value="clinic" className="mt-4"><ClinicForm clinic={clinic} /></TabsContent>

        <TabsContent value="email" className="mt-4">
          <EmailSettingsCard clinicId={clinicId} clinicName={clinic.name} userEmail={user?.email || "alxndrgm@gmail.com"} />
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <TeamCard users={clinicUsers} clinicId={clinicId} currentUserId={user?.id} />
        </TabsContent>

        <TabsContent value="subscription" className="mt-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Plan actual</div>
                <div className="text-2xl font-bold">{plan?.name ?? "—"}</div>
                <div className="text-sm text-muted-foreground">${plan?.monthlyPrice ?? 0}/mes · ${plan?.annualPrice ?? 0}/año</div>
              </div>
              <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">{clinic.subscriptionStatus}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <Kpi icon={Users} label="Usuarios" value={`${clinicUsers.length} / ${plan?.maxUsers ?? "∞"}`} />
              <Kpi icon={PawPrint} label="Mascotas máx." value={plan?.maxPets.toLocaleString() ?? "—"} />
              <Kpi icon={HardDrive} label="Almacenamiento" value={`${plan?.maxStorageGb ?? 0} GB`} />
              <Kpi icon={Building2} label="Sucursales" value={`${clinicBranches.length} / ${plan?.maxBranches ?? "∞"}`} />
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Almacenamiento usado (imágenes)</span>
                <span className="text-xs font-medium">{formatBytes(storageUsed)} / {plan?.maxStorageGb ?? 0} GB</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (storageUsed / ((plan?.maxStorageGb ?? 0) * 1024 * 1024 * 1024 || 1)) * 100)}%` }} />
              </div>
            </div>
            <div className="pt-4 border-t">
              <h3 className="font-semibold text-sm mb-2">Cambiar plan / Pagar</h3>
              <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] items-end">
                <div className="space-y-1.5">
                  <Label>Plan</Label>
                  <Select value={payPlanId} onValueChange={setPayPlanId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · ${p.monthlyPrice}/mes</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Método de pago</Label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Stripe">Stripe (tarjeta)</SelectItem>
                      <SelectItem value="SINPE">SINPE (transferencia)</SelectItem>
                      <SelectItem value="PayPal">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => { paySubscription(clinicId, payPlanId, payMethod); toast.success(`Pago ${payMethod} simulado. ¡Suscripción activa!`); }}
                >
                  <Rocket className="h-4 w-4 mr-1" /> Pagar y activar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">* Simulación de cobro. En producción se integra con Stripe/SINPE/PayPal.</p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Próximamente: pagos automáticos con Stripe, SINPE y PayPal.</p>
              <div className="flex flex-wrap gap-2">
                {["Stripe", "SINPE", "PayPal", "Facturación automática", "Dominios personalizados"].map((f) => (
                  <Badge key={f} variant="outline">{f}</Badge>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="money" className="mt-4">
          <CurrencyCard />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4">
          <OwnerDashboard clinicUsers={clinicUsers.length} branches={clinicBranches.length} plan={plan?.name ?? "—"} status={clinic.subscriptionStatus} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4" />{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}

function ClinicForm({ clinic }: { clinic: ReturnType<typeof useClinics>[number] }) {
  const [form, setForm] = useState(clinic);
  const save = () => { updateClinic(clinic.id, form); toast.success("Configuración guardada"); };
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm({ ...form, [k]: v });

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Identidad</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Nombre comercial</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="space-y-2"><Label>Razón social</Label><Input value={form.legalName} onChange={(e) => set("legalName", e.target.value)} /></div>
          <div className="space-y-2"><Label>Cédula / RUC / NIT</Label><Input value={form.taxId} onChange={(e) => set("taxId", e.target.value)} /></div>
          <div className="space-y-2"><Label>Color corporativo</Label><Input type="color" value={form.brandColor} onChange={(e) => set("brandColor", e.target.value)} className="h-10 p-1 w-24" /></div>
          <div className="space-y-2 sm:col-span-2"><ImageInput label="Logo" value={form.logoUrl} onChange={(v) => set("logoUrl", v ?? "")} /></div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Contacto</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          <div className="space-y-2"><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></div>
          <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div className="space-y-2"><Label>Horario de atención</Label><Input value={form.openingHours} onChange={(e) => set("openingHours", e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Dirección</Label><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
          <div className="space-y-2"><Label>Ciudad</Label><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
          <div className="space-y-2"><Label>País</Label><Input value={form.country} onChange={(e) => set("country", e.target.value)} /></div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Especialidades y redes</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label>Especialidades (separadas por coma)</Label>
            <Input value={form.specialties.join(", ")} onChange={(e) => set("specialties", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
          </div>
          <div className="space-y-2"><Label className="flex items-center gap-1.5"><Instagram className="h-4 w-4" />Instagram</Label><Input value={form.socials.instagram ?? ""} onChange={(e) => set("socials", { ...form.socials, instagram: e.target.value })} /></div>
          <div className="space-y-2"><Label className="flex items-center gap-1.5"><Facebook className="h-4 w-4" />Facebook</Label><Input value={form.socials.facebook ?? ""} onChange={(e) => set("socials", { ...form.socials, facebook: e.target.value })} /></div>
          <div className="space-y-2"><Label>TikTok</Label><Input value={form.socials.tiktok ?? ""} onChange={(e) => set("socials", { ...form.socials, tiktok: e.target.value })} /></div>
          <div className="space-y-2"><Label className="flex items-center gap-1.5"><Globe className="h-4 w-4" />Sitio web</Label><Input value={form.socials.web ?? ""} onChange={(e) => set("socials", { ...form.socials, web: e.target.value })} /></div>
        </div>
      </Card>

      <div className="flex justify-end"><Button onClick={save}>Guardar cambios</Button></div>
    </div>
  );
}

function TeamCard({ users, clinicId, currentUserId }: { users: ReturnType<typeof useClinicUsers>; clinicId: string; currentUserId?: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<(typeof users)[number] | null>(null);
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Usuarios del sistema</h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nuevo usuario</Button></DialogTrigger>
          <UserDialog editing={editing} clinicId={clinicId} onClose={() => { setOpen(false); setEditing(null); }} />
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name}{currentUserId === u.id && <span className="text-xs text-muted-foreground ml-2">(tú)</span>}</TableCell>
              <TableCell className="text-sm">{u.email}</TableCell>
              <TableCell><Badge variant="outline" className={roleColor[u.role]}>{u.role}</Badge></TableCell>
              <TableCell>
                <Switch checked={u.active} onCheckedChange={(v) => updateClinicUser(u.id, { active: v })} />
              </TableCell>
              <TableCell className="text-right space-x-1">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(u); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => deleteClinicUser(u.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function UserDialog({ editing, clinicId, onClose }: { editing: any; clinicId: string; onClose: () => void }) {
  const [form, setForm] = useState(
    editing ?? { clinicId, name: "", email: "", role: "Veterinario" as SaasRole, active: true },
  );
  const save = () => {
    if (editing) { updateClinicUser(editing.id, form); toast.success("Usuario actualizado"); }
    else { addClinicUser(form); toast.success("Usuario creado"); }
    onClose();
  };
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{editing ? "Editar" : "Nuevo"} usuario</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div className="space-y-1.5"><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Correo</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="space-y-1.5">
          <Label>Rol</Label>
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as SaasRole })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["Owner", "Administrador", "Veterinario", "Recepción", "Asistente", "Inventario", "Caja", "Super Administrador"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label>Activo</Label></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={save}>Guardar</Button></DialogFooter>
    </DialogContent>
  );
}

function OwnerDashboard({ clinicUsers, branches, plan, status }: { clinicUsers: number; branches: number; plan: string; status: string }) {
  const petsCount = usePets().length;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Kpi icon={Users} label="Usuarios activos" value={clinicUsers} />
      <Kpi icon={PawPrint} label="Mascotas registradas" value={petsCount || "—"} />
      <Kpi icon={Building2} label="Sucursales" value={branches} />
      <Kpi icon={Package} label="Plan actual" value={plan} />
      <Kpi icon={TrendingUp} label="Estado suscripción" value={status} />
      <Kpi icon={HardDrive} label="Almacenamiento usado" value="1.2 GB" />
    </div>
  );
}

function CurrencyCard() {
  const currency = useCurrency();
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Coins className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Moneda</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Elige la moneda en la que se muestran los precios. Por defecto se usan colones.
      </p>
      <div className="grid sm:grid-cols-2 gap-4 items-end">
        <div className="space-y-2">
          <Label>Moneda principal</Label>
          <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Vista previa (precio promedio)</Label>
          <div className="rounded-md border px-3 py-2 text-lg font-semibold">
            {formatMoney(833.33, currency)}
          </div>
        </div>
      </div>
      <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Se aplica a los precios del módulo <span className="font-medium text-foreground">Servicios</span> y demás vistas de dinero. Los montos se guardan en la moneda elegida.
      </div>
    </Card>
  );
}

function EmailSettingsCard({ clinicId, clinicName, userEmail }: { clinicId: string; clinicName: string; userEmail: string }) {
  const [config, setConfig] = useState<ClinicEmailConfig>(() => getClinicEmailConfig(clinicId));
  const [showApiKey, setShowApiKey] = useState(false);
  const [testEmail, setTestEmail] = useState(userEmail && !userEmail.includes("example") ? userEmail : "alxndrgm@gmail.com");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const handleSave = () => {
    saveClinicEmailConfig(clinicId, config);
    toast.success("Configuración de correo guardada con éxito");
  };

  const handleTestConnection = async () => {
    if (!config.resendApiKey.trim()) {
      toast.error("Ingresa tu clave de Resend (empieza por re_...)");
      return;
    }
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("Ingresa un correo destinatario válido para la prueba");
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await sendTestEmailFn({
        data: {
          toEmail: testEmail.trim(),
          apiKey: config.resendApiKey.trim(),
          fromName: config.senderName.trim() || clinicName,
          fromEmail: config.senderEmail.trim() || "citas@go2vet.online",
        },
      });

      if (res.success) {
        setTestResult({ success: true, message: res.message });
        toast.success(res.message);
      } else {
        setTestResult({ success: false, error: res.error });
        toast.error(res.error);
      }
    } catch (err: any) {
      setTestResult({ success: false, error: err?.message || "Error al conectar con Resend" });
      toast.error(err?.message || "Error al probar conexión");
    } finally {
      setTesting(false);
    }
  };

  const isConfigured = Boolean(config.resendApiKey && config.resendApiKey.startsWith("re_"));

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-5 border shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-3 pb-3 border-b">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">Servicio de Correos Electrónicos (Resend)</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Configura la clave API de Resend exclusiva de esta veterinaria para el despacho automático de citas y consultas.
            </p>
          </div>
          <div>
            {isConfigured ? (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 gap-1 text-xs py-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Clave Configurada
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 gap-1 text-xs py-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Sin Clave de Envío
              </Badge>
            )}
          </div>
        </div>

        {/* Credentials Form */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label className="flex items-center gap-1.5 text-sm font-semibold">
              <KeyRound className="h-4 w-4 text-primary" /> Resend API Key (re_...)
            </Label>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                value={config.resendApiKey}
                onChange={(e) => setConfig({ ...config, resendApiKey: e.target.value })}
                placeholder="re_123456789_abcdefghijklmnopqrstuvwxyz"
                className="font-mono text-sm pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setShowApiKey(!showApiKey)}
                title={showApiKey ? "Ocultar clave" : "Mostrar clave"}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Obtén tu clave gratis (3,000 correos/mes) registrándote en{" "}
              <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-primary underline font-medium inline-flex items-center gap-0.5">
                resend.com <ExternalLink className="h-2.5 w-2.5" />
              </a>{" "}
              → pestaña <strong>API Keys</strong> → <strong>Create API Key</strong>.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Nombre del Remitente</Label>
            <Input
              value={config.senderName}
              onChange={(e) => setConfig({ ...config, senderName: e.target.value })}
              placeholder={clinicName || "VetCare Clínica Veterinaria"}
            />
            <p className="text-[11px] text-muted-foreground">Nombre que verán tus clientes al recibir el correo.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Correo Remitente</Label>
            <Input
              value={config.senderEmail}
              onChange={(e) => setConfig({ ...config, senderEmail: e.target.value })}
              placeholder="citas@go2vet.online"
            />
            <p className="text-[11px] text-muted-foreground">
              Dominio verificado activo: <strong className="text-foreground">citas@go2vet.online</strong> (permite envíos globales a Gmail, Hotmail, etc.)
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} className="font-semibold shadow-xs">
            Guardar Configuración de Correo
          </Button>
        </div>
      </Card>

      {/* Connection Verification Card */}
      <Card className="p-6 space-y-4 border bg-muted/20">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <h3 className="font-semibold text-base">Comprobador de Conexión en Vivo</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Ingresa un correo electrónico y haz clic en <strong>Probar Conexión</strong>. El sistema enviará un mensaje de prueba inmediato usando tu clave API para verificar que todo esté funcionando al 100%.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <Input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="tu-correo@gmail.com"
            className="sm:max-w-md bg-card"
          />
          <Button
            onClick={handleTestConnection}
            disabled={testing}
            variant="outline"
            className="border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1.5 font-medium"
          >
            {testing ? "Enviando prueba..." : <><Send className="h-4 w-4 text-emerald-600" /> Probar Conexión Ahora</>}
          </Button>
        </div>

        {testResult && (
          <div className={`p-4 rounded-xl text-xs border ${
            testResult.success
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300"
          }`}>
            <div className="font-bold text-sm mb-1 flex items-center gap-1.5">
              {testResult.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-rose-600" />}
              {testResult.success ? "¡Prueba Exitosa!" : "Error al conectar con Resend"}
            </div>
            <p>{testResult.message || testResult.error}</p>
          </div>
        )}
      </Card>
    </div>
  );
}

