import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bell, Send, MessageCircle, Mail, Phone, Plus, Edit, Trash2, CheckCircle2, XCircle, Clock, TrendingUp, MessageSquare, Users2, Percent,
} from "lucide-react";
import {
  addReminder, addTemplate, deleteReminder, deleteTemplate, markConversationRead,
  sendMessage, setConversationStatus, updateReminder, updateTemplate,
  useConversations, useMessages, useReminders, useTemplates,
  type Channel, type MessageTemplate, type Reminder, type ReminderType,
} from "@/lib/automation-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/automatizacion")({
  head: () => ({ meta: [{ title: "Automatización y WhatsApp — VetCare" }] }),
  component: () => <AppLayout><AutomationPage /></AppLayout>,
});

const statusColor: Record<string, string> = {
  Programado: "bg-sky-100 text-sky-700 border-sky-200",
  Enviado: "bg-blue-100 text-blue-700 border-blue-200",
  Confirmado: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Cancelado: "bg-slate-200 text-slate-700 border-slate-300",
  Fallido: "bg-red-100 text-red-700 border-red-200",
  Abierta: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "En espera": "bg-amber-100 text-amber-700 border-amber-200",
  Cerrada: "bg-slate-200 text-slate-700 border-slate-300",
};

const channelIcon = (c: Channel) => (c === "WhatsApp" ? MessageCircle : c === "Email" ? Mail : Phone);

function AutomationPage() {
  const reminders = useReminders();
  const templates = useTemplates();
  const conversations = useConversations();
  const messages = useMessages();

  const stats = useMemo(() => {
    const sent = reminders.filter((r) => r.status === "Enviado" || r.status === "Confirmado").length;
    const confirmed = reminders.filter((r) => r.status === "Confirmado").length;
    const cancelled = reminders.filter((r) => r.status === "Cancelado").length;
    const failed = reminders.filter((r) => r.status === "Fallido").length;
    const responseRate = sent > 0 ? Math.round((confirmed / sent) * 100) : 0;
    return { sent, confirmed, cancelled, failed, responseRate };
  }, [reminders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automatización y WhatsApp</h1>
          <p className="text-sm text-muted-foreground mt-1">Recordatorios, confirmaciones, plantillas y CRM de conversaciones.</p>
        </div>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          Modo simulación — sin envíos reales
        </Badge>
      </div>

      {/* Dashboard */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Send} label="Mensajes enviados" value={stats.sent} tone="sky" />
        <KpiCard icon={CheckCircle2} label="Confirmaciones" value={stats.confirmed} tone="emerald" />
        <KpiCard icon={XCircle} label="Cancelaciones" value={stats.cancelled} tone="rose" />
        <KpiCard icon={Percent} label="Tasa de respuesta" value={`${stats.responseRate}%`} tone="violet" />
      </div>

      <Tabs defaultValue="reminders">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="reminders"><Bell className="h-4 w-4 mr-1.5" />Recordatorios</TabsTrigger>
          <TabsTrigger value="templates"><MessageSquare className="h-4 w-4 mr-1.5" />Plantillas</TabsTrigger>
          <TabsTrigger value="crm"><Users2 className="h-4 w-4 mr-1.5" />CRM Conversaciones</TabsTrigger>
          <TabsTrigger value="dashboard"><TrendingUp className="h-4 w-4 mr-1.5" />Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="reminders" className="mt-4">
          <RemindersTab reminders={reminders} />
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
          <TemplatesTab templates={templates} />
        </TabsContent>
        <TabsContent value="crm" className="mt-4">
          <CrmTab conversations={conversations} messages={messages} />
        </TabsContent>
        <TabsContent value="dashboard" className="mt-4">
          <DashboardTab reminders={reminders} conversations={conversations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string | number; tone: string }) {
  const map: Record<string, string> = {
    sky: "bg-sky-50 text-sky-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg grid place-items-center ${map[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold">{value}</div>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Recordatorios ---------- */
function RemindersTab({ reminders }: { reminders: Reminder[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">{reminders.length} recordatorios programados</div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nuevo recordatorio</Button>
          </DialogTrigger>
          <ReminderDialog editing={editing} onClose={() => { setOpen(false); setEditing(null); }} />
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Mascota / Cliente</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Programado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reminders.map((r) => {
              const Ch = channelIcon(r.channel);
              return (
                <TableRow key={r.id}>
                  <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                  <TableCell>
                    <div className="font-medium">{r.petName}</div>
                    <div className="text-xs text-muted-foreground">{r.clientName} · {r.phone}</div>
                  </TableCell>
                  <TableCell><div className="flex items-center gap-1.5 text-sm"><Ch className="h-4 w-4" />{r.channel}</div></TableCell>
                  <TableCell className="text-sm">{new Date(r.scheduledFor).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" })}</TableCell>
                  <TableCell><Badge variant="outline" className={statusColor[r.status]}>{r.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => { updateReminder(r.id, { status: "Enviado" }); toast.success("Envío simulado"); }}>
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteReminder(r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {reminders.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Sin recordatorios</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function ReminderDialog({ editing, onClose }: { editing: Reminder | null; onClose: () => void }) {
  const [form, setForm] = useState<Omit<Reminder, "id" | "createdAt">>(
    editing ?? {
      type: "Vacuna", petName: "", clientName: "", phone: "",
      scheduledFor: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      channel: "WhatsApp", status: "Programado", message: "",
    },
  );

  const save = () => {
    const data = { ...form, scheduledFor: new Date(form.scheduledFor).toISOString() };
    if (editing) { updateReminder(editing.id, data); toast.success("Recordatorio actualizado"); }
    else { addReminder(data); toast.success("Recordatorio creado"); }
    onClose();
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{editing ? "Editar" : "Nuevo"} recordatorio</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ReminderType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Vacuna", "Desparasitación", "Cita", "Control postoperatorio"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Canal</Label>
            <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v as Channel })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["WhatsApp", "Email", "SMS"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Mascota</Label><Input value={form.petName} onChange={(e) => setForm({ ...form, petName: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Cliente</Label><Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="space-y-1.5">
            <Label>Fecha y hora</Label>
            <Input type="datetime-local" value={form.scheduledFor.slice(0, 16)} onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5"><Label>Mensaje</Label><Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={save}>Guardar</Button>
      </DialogFooter>
    </DialogContent>
  );
}

/* ---------- Plantillas ---------- */
function TemplatesTab({ templates }: { templates: MessageTemplate[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">{templates.length} plantillas disponibles</div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nueva plantilla</Button></DialogTrigger>
          <TemplateDialog editing={editing} onClose={() => { setOpen(false); setEditing(null); }} />
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {templates.map((t) => {
          const Ch = channelIcon(t.channel);
          return (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{t.category}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Ch className="h-3 w-3" />{t.channel}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={t.active} onCheckedChange={(v) => updateTemplate(t.id, { active: v })} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{t.body}</p>
              <div className="flex justify-end gap-1 mt-3">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(t); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => deleteTemplate(t.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
}

function TemplateDialog({ editing, onClose }: { editing: MessageTemplate | null; onClose: () => void }) {
  const [form, setForm] = useState<Omit<MessageTemplate, "id" | "createdAt">>(
    editing ?? { name: "", category: "Recordatorio", channel: "WhatsApp", body: "", active: true },
  );
  const save = () => {
    if (editing) { updateTemplate(editing.id, form); toast.success("Plantilla actualizada"); }
    else { addTemplate(form); toast.success("Plantilla creada"); }
    onClose();
  };
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{editing ? "Editar" : "Nueva"} plantilla</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div className="space-y-1.5"><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as MessageTemplate["category"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Bienvenida", "Recordatorio", "Confirmación", "Seguimiento", "Alta médica", "Resultados", "Cumpleaños"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Canal</Label>
            <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v as Channel })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["WhatsApp", "Email", "SMS"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Cuerpo del mensaje</Label>
          <Textarea rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <p className="text-xs text-muted-foreground">Variables: {"{cliente}"}, {"{mascota}"}, {"{fecha}"}, {"{hora}"}, {"{vacuna}"}</p>
        </div>
        <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label>Activa</Label></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={save}>Guardar</Button>
      </DialogFooter>
    </DialogContent>
  );
}

/* ---------- CRM ---------- */
function CrmTab({
  conversations, messages,
}: { conversations: ReturnType<typeof useConversations>; messages: ReturnType<typeof useMessages> }) {
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id ?? null);
  const [draft, setDraft] = useState("");
  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const thread = messages.filter((m) => m.conversationId === selectedId);

  const send = () => {
    if (!selected || !draft.trim()) return;
    sendMessage(selected.id, draft.trim());
    setDraft("");
    toast.success("Mensaje enviado (simulado)");
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="grid md:grid-cols-[320px_1fr] min-h-[520px]">
        <div className="border-r bg-muted/30">
          <div className="p-3 border-b bg-card text-sm font-medium">Conversaciones</div>
          <div className="divide-y">
            {conversations.map((c) => {
              const Ch = channelIcon(c.channel);
              const active = selectedId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => { setSelectedId(c.id); markConversationRead(c.id); }}
                  className={`w-full text-left px-3 py-3 hover:bg-accent transition-colors ${active ? "bg-accent" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm truncate">{c.clientName}</div>
                    {c.unread > 0 && <Badge className="h-5 min-w-5 px-1.5">{c.unread}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{c.petName} · {c.phone}</div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1"><Ch className="h-3 w-3" />{c.lastMessage}</div>
                    <Badge variant="outline" className={`${statusColor[c.status]} text-[10px]`}>{c.status}</Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col">
          {selected ? (
            <>
              <div className="p-3 border-b bg-card flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{selected.clientName} · {selected.petName}</div>
                  <div className="text-xs text-muted-foreground">{selected.phone} · Asignado a {selected.assignee}</div>
                </div>
                <Select value={selected.status} onValueChange={(v) => setConversationStatus(selected.id, v as any)}>
                  <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Abierta", "En espera", "Cerrada"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex-1 p-4 space-y-2 overflow-auto bg-muted/20">
                {thread.map((m) => (
                  <div key={m.id} className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${m.direction === "out" ? "ml-auto bg-primary text-primary-foreground rounded-br-sm" : "bg-white border rounded-bl-sm"}`}>
                    <div>{m.body}</div>
                    <div className={`text-[10px] mt-1 flex items-center gap-1 ${m.direction === "out" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      <Clock className="h-3 w-3" />{new Date(m.sentAt).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })} · {m.status}
                    </div>
                  </div>
                ))}
                {thread.length === 0 && <div className="text-center text-sm text-muted-foreground py-8">Sin mensajes en el hilo</div>}
              </div>
              <div className="p-3 border-t bg-card flex gap-2">
                <Input placeholder="Escribe un mensaje..." value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
                <Button onClick={send}><Send className="h-4 w-4" /></Button>
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground">Selecciona una conversación</div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ---------- Dashboard ---------- */
function DashboardTab({
  reminders, conversations,
}: { reminders: Reminder[]; conversations: ReturnType<typeof useConversations> }) {
  const byType = reminders.reduce<Record<string, number>>((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {});
  const byChannel = reminders.reduce<Record<string, number>>((acc, r) => { acc[r.channel] = (acc[r.channel] || 0) + 1; return acc; }, {});
  const openConv = conversations.filter((c) => c.status === "Abierta").length;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-4">
        <div className="font-semibold mb-3">Recordatorios por tipo</div>
        <div className="space-y-2">
          {Object.entries(byType).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-sm">
              <span>{k}</span>
              <Badge variant="outline">{v}</Badge>
            </div>
          ))}
          {Object.keys(byType).length === 0 && <div className="text-sm text-muted-foreground">Sin datos</div>}
        </div>
      </Card>
      <Card className="p-4">
        <div className="font-semibold mb-3">Envíos por canal</div>
        <div className="space-y-2">
          {Object.entries(byChannel).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-sm">
              <span>{k}</span><Badge variant="outline">{v}</Badge>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-4 md:col-span-2">
        <div className="font-semibold mb-3">CRM · Conversaciones activas</div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><div className="text-2xl font-bold">{openConv}</div><div className="text-xs text-muted-foreground">Abiertas</div></div>
          <div><div className="text-2xl font-bold">{conversations.filter((c) => c.status === "En espera").length}</div><div className="text-xs text-muted-foreground">En espera</div></div>
          <div><div className="text-2xl font-bold">{conversations.reduce((a, c) => a + c.unread, 0)}</div><div className="text-xs text-muted-foreground">No leídos</div></div>
        </div>
      </Card>
    </div>
  );
}
