import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Pencil, Plus, Shield, Trash2, Users, ClipboardList, KeyRound, LogIn } from "lucide-react";
import { toast } from "sonner";
import {
  ACTION_LABEL,
  MODULE_LABEL,
  RBAC_ACTIONS,
  RBAC_MODULES,
  addRole,
  addUser,
  deleteRole,
  deleteUser,
  duplicateRole,
  logAudit,
  togglePermission,
  updateRole,
  updateUser,
  useAuditLog,
  useRbacUsers,
  useRoles,
  type RbacAction,
  type RbacModule,
  type Role,
  type UserStatus,
} from "@/lib/rbac-store";
import { Can, useCan } from "@/lib/rbac";

export const Route = createFileRoute("/_app/roles")({ component: RolesPage });

function statusColor(s: UserStatus) {
  return s === "Activo" ? "bg-emerald-100 text-emerald-700" : s === "Suspendido" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700";
}

function RolesPage() {
  const allRoles = useRoles();
  // El Super Administrador es el dueño de la app a nivel global y no es un rol asignable ni configurable por una clínica.
  const roles = useMemo(() => allRoles.filter((r) => r.id !== "role_super"), [allRoles]);
  const users = useRbacUsers();
  const audit = useAuditLog();
  const can = useCan();

  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id ?? "role_owner");
  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? roles[0];

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleForm, setRoleForm] = useState<{ id?: string; name: string; description: string }>({ name: "", description: "" });

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userForm, setUserForm] = useState<{ id?: string; name: string; email: string; phone: string; roleId: string; status: UserStatus; branchId: string }>(
    { name: "", email: "", phone: "", roleId: roles[0]?.id ?? "role_owner", status: "Activo", branchId: "" }
  );

  const permCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of roles) {
      let n = 0;
      for (const m of RBAC_MODULES) for (const a of RBAC_ACTIONS) if (r.permissions[m][a]) n++;
      map[r.id] = n;
    }
    return map;
  }, [roles]);

  const openNewRole = () => { setRoleForm({ name: "", description: "" }); setRoleDialogOpen(true); };
  const openEditRole = (r: Role) => { setRoleForm({ id: r.id, name: r.name, description: r.description }); setRoleDialogOpen(true); };
  const saveRole = () => {
    if (!roleForm.name.trim()) return toast.error("Ingresa un nombre");
    if (roleForm.id) {
      updateRole(roleForm.id, { name: roleForm.name, description: roleForm.description });
      logAudit({ userId: "usr_1", userName: "Sistema", action: `Editó rol ${roleForm.name}`, module: "roles", recordId: roleForm.id });
      toast.success("Rol actualizado");
    } else {
      const emptyPerms = Object.fromEntries(RBAC_MODULES.map((m) => [m, Object.fromEntries(RBAC_ACTIONS.map((a) => [a, false]))])) as Role["permissions"];
      const r = addRole({ name: roleForm.name, description: roleForm.description, permissions: emptyPerms });
      setSelectedRoleId(r.id);
      logAudit({ userId: "usr_1", userName: "Sistema", action: `Creó rol ${roleForm.name}`, module: "roles", recordId: r.id });
      toast.success("Rol creado");
    }
    setRoleDialogOpen(false);
  };

  const openNewUser = () => { setUserForm({ name: "", email: "", phone: "", roleId: roles[0]?.id ?? "", status: "Activo", branchId: "br1" }); setUserDialogOpen(true); };
  const openEditUser = (id: string) => {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    setUserForm({ id: u.id, name: u.name, email: u.email, phone: u.phone, roleId: u.roleId, status: u.status, branchId: u.branchId ?? "" });
    setUserDialogOpen(true);
  };
  const saveUser = () => {
    if (!userForm.name.trim() || !userForm.email.trim()) return toast.error("Completa nombre y correo");
    if (userForm.id) {
      updateUser(userForm.id, userForm);
      logAudit({ userId: "usr_1", userName: "Sistema", action: `Editó usuario ${userForm.name}`, module: "roles", recordId: userForm.id });
      toast.success("Usuario actualizado");
    } else {
      const u = addUser({ ...userForm, clinicId: "cl1" });
      logAudit({ userId: "usr_1", userName: "Sistema", action: `Creó usuario ${userForm.name}`, module: "roles", recordId: u.id });
      toast.success("Usuario creado");
    }
    setUserDialogOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /> Roles y Permisos</h1>
            <p className="text-muted-foreground text-sm mt-1">Control de acceso basado en roles (RBAC). Los permisos se aplican en la navegación y en las acciones.</p>
          </div>
          <Link to="/usuarios">
            <Button variant="outline" size="sm" className="gap-2">
              <Users className="h-4 w-4" />
              Gestión de Usuarios
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4"><div className="text-xs text-muted-foreground">Roles</div><div className="text-2xl font-bold mt-1">{roles.length}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Usuarios</div><div className="text-2xl font-bold mt-1">{users.length}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Módulos</div><div className="text-2xl font-bold mt-1">{RBAC_MODULES.length}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Eventos auditados</div><div className="text-2xl font-bold mt-1">{audit.length}</div></Card>
        </div>

        <Tabs defaultValue="matriz">
          <TabsList>
            <TabsTrigger value="matriz"><KeyRound className="h-4 w-4 mr-2" />Matriz de permisos</TabsTrigger>
            <TabsTrigger value="usuarios"><Users className="h-4 w-4 mr-2" />Usuarios</TabsTrigger>
            <TabsTrigger value="auditoria"><ClipboardList className="h-4 w-4 mr-2" />Auditoría</TabsTrigger>
            <TabsTrigger value="sso"><LogIn className="h-4 w-4 mr-2" />SSO / OAuth</TabsTrigger>
          </TabsList>

          {/* MATRIZ */}
          <TabsContent value="matriz" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
              <Card className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium">Roles</div>
                  <Can module="roles" action="create">
                    <Button size="sm" variant="ghost" onClick={openNewRole}><Plus className="h-4 w-4" /></Button>
                  </Can>
                </div>
                <div className="space-y-1">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRoleId(r.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedRoleId === r.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{r.name}</span>
                        {r.system && <Badge variant="secondary" className="text-[10px]">Sistema</Badge>}
                      </div>
                      <div className={`text-xs mt-0.5 ${selectedRoleId === r.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        {permCounts[r.id] ?? 0} permisos activos
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                {selectedRole && (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-semibold">{selectedRole.name}</h2>
                          {selectedRole.system && <Badge variant="secondary">Sistema</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{selectedRole.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Can module="roles" action="edit">
                          <Button size="sm" variant="outline" onClick={() => openEditRole(selectedRole)}><Pencil className="h-4 w-4 mr-1" />Editar</Button>
                        </Can>
                        <Can module="roles" action="create">
                          <Button size="sm" variant="outline" onClick={() => { const c = duplicateRole(selectedRole.id); if (c) { setSelectedRoleId(c.id); toast.success("Rol duplicado"); } }}>
                            <Copy className="h-4 w-4 mr-1" />Duplicar
                          </Button>
                        </Can>
                        {!selectedRole.system && (
                          <Can module="roles" action="delete">
                            <Button size="sm" variant="destructive" onClick={() => { deleteRole(selectedRole.id); setSelectedRoleId(roles[0]?.id ?? ""); toast.success("Rol eliminado"); }}>
                              <Trash2 className="h-4 w-4 mr-1" />Eliminar
                            </Button>
                          </Can>
                        )}
                      </div>
                    </div>

                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[180px]">Módulo</TableHead>
                            {RBAC_ACTIONS.map((a) => (
                              <TableHead key={a} className="text-center">{ACTION_LABEL[a]}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {RBAC_MODULES.map((m) => (
                            <TableRow key={m}>
                              <TableCell className="font-medium">{MODULE_LABEL[m]}</TableCell>
                              {RBAC_ACTIONS.map((a) => (
                                <TableCell key={a} className="text-center">
                                  <Checkbox
                                    checked={selectedRole.permissions[m][a]}
                                    disabled={!can("roles", "edit")}
                                    onCheckedChange={() => togglePermission(selectedRole.id, m as RbacModule, a as RbacAction)}
                                  />
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* USUARIOS */}
          <TabsContent value="usuarios" className="mt-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold">Usuarios</div>
                  <div className="text-xs text-muted-foreground">Asigna un rol y una sucursal a cada usuario</div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/usuarios">
                    <Button size="sm" variant="outline">
                      Abrir Gestión Completa
                    </Button>
                  </Link>
                  <Can module="roles" action="create">
                    <Button size="sm" onClick={openNewUser}><Plus className="h-4 w-4 mr-1" />Nuevo usuario</Button>
                  </Can>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Último acceso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const role = roles.find((r) => r.id === u.roleId);
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell className="text-muted-foreground">{u.phone}</TableCell>
                        <TableCell>{role?.name ?? "—"}</TableCell>
                        <TableCell>{u.branchId ?? "—"}</TableCell>
                        <TableCell><span className={`px-2 py-0.5 rounded-full text-xs ${statusColor(u.status)}`}>{u.status}</span></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{u.lastAccess ? new Date(u.lastAccess).toLocaleString() : "—"}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Can module="roles" action="edit">
                            <Button size="sm" variant="ghost" onClick={() => openEditUser(u.id)}><Pencil className="h-4 w-4" /></Button>
                          </Can>
                          <Can module="roles" action="delete">
                            <Button size="sm" variant="ghost" onClick={() => { deleteUser(u.id); toast.success("Usuario eliminado"); }}><Trash2 className="h-4 w-4" /></Button>
                          </Can>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* AUDITORÍA */}
          <TabsContent value="auditoria" className="mt-4">
            <Card className="p-4">
              <div className="font-semibold mb-3">Registro de auditoría</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audit.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{a.userName}</TableCell>
                      <TableCell>{a.action}</TableCell>
                      <TableCell><Badge variant="secondary">{a.module}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.recordId ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.ip}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* SSO */}
          <TabsContent value="sso" className="mt-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Autenticación externa</h3>
              <p className="text-sm text-muted-foreground mb-4">Preparado para futura integración con proveedores. Actualmente informativo.</p>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { name: "Google Workspace", desc: "OAuth 2.0 · dominios permitidos", enabled: false },
                  { name: "Microsoft Entra ID", desc: "OAuth 2.0 · Azure AD tenant", enabled: false },
                  { name: "SAML 2.0 SSO", desc: "IdP genérico · metadata XML", enabled: false },
                ].map((p) => (
                  <div key={p.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{p.name}</div>
                      <Badge variant={p.enabled ? "default" : "secondary"}>{p.enabled ? "Activo" : "Pendiente"}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{p.desc}</div>
                    <Button size="sm" variant="outline" className="mt-3 w-full" disabled>Configurar</Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Rol */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{roleForm.id ? "Editar rol" : "Nuevo rol"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre</Label><Input value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} /></div>
            <div><Label>Descripción</Label><Textarea value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveRole}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Usuario */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{userForm.id ? "Editar usuario" : "Nuevo usuario"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2"><Label>Nombre</Label><Input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} /></div>
            <div><Label>Correo</Label><Input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} /></div>
            <div><Label>Teléfono</Label><Input value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} /></div>
            <div>
              <Label>Rol</Label>
              <Select value={userForm.roleId} onValueChange={(v) => setUserForm({ ...userForm, roleId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={userForm.status} onValueChange={(v) => setUserForm({ ...userForm, status: v as UserStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                  <SelectItem value="Suspendido">Suspendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2"><Label>Sucursal</Label><Input value={userForm.branchId} onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })} placeholder="br1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveUser}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
