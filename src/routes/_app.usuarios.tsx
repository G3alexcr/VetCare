import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserCog,
  Users,
  UserCheck,
  UserX,
  Shield,
  Search,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  Mail,
  Phone,
  Building2,
  FilterX,
  Send,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  addUser,
  deleteUser,
  logAudit,
  updateUser,
  useRbacUsers,
  useRoles,
  type RbacUser,
  type UserStatus,
} from "@/lib/rbac-store";
import { Can } from "@/lib/rbac";

export const Route = createFileRoute("/_app/usuarios")({ component: UsuariosPage });

function statusBadge(status: UserStatus) {
  switch (status) {
    case "Activo":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Activo
        </span>
      );
    case "Suspendido":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          Suspendido
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Inactivo
        </span>
      );
  }
}

function roleBadgeColor(roleId: string) {
  if (roleId.includes("super") || roleId.includes("admin")) {
    return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
  }
  if (roleId.includes("vet")) {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  }
  if (roleId.includes("reception")) {
    return "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800";
  }
  if (roleId.includes("cash")) {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800";
  }
  if (roleId.includes("inventory")) {
    return "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800";
  }
  return "bg-muted text-muted-foreground border-border";
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U"
  );
}

export function UsuariosPage() {
  const users = useRbacUsers();
  const roles = useRoles();

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [userForm, setUserForm] = useState<{
    id?: string;
    name: string;
    email: string;
    phone: string;
    roleId: string;
    status: UserStatus;
    branchId: string;
    sendInvite: boolean;
  }>({
    name: "",
    email: "",
    phone: "",
    roleId: roles[0]?.id ?? "role_admin",
    status: "Activo",
    branchId: "Sede Principal",
    sendInvite: true,
  });

  // Estadísticas rápidas
  const stats = useMemo(() => {
    const total = users.length;
    const activos = users.filter((u) => u.status === "Activo").length;
    const suspendidos = users.filter((u) => u.status !== "Activo").length;
    const adminCount = users.filter((u) => u.roleId.includes("admin") || u.roleId.includes("super")).length;
    const vetCount = users.filter((u) => u.roleId.includes("vet")).length;
    return { total, activos, suspendidos, adminCount, vetCount };
  }, [users]);

  // Lista filtrada
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchQuery =
        !query ||
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase()) ||
        u.phone.toLowerCase().includes(query.toLowerCase()) ||
        (u.branchId && u.branchId.toLowerCase().includes(query.toLowerCase()));

      const matchRole = roleFilter === "todos" || u.roleId === roleFilter;
      const matchStatus = statusFilter === "todos" || u.status === statusFilter;

      return matchQuery && matchRole && matchStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  const openNewUser = () => {
    setUserForm({
      name: "",
      email: "",
      phone: "",
      roleId: roles[0]?.id ?? "role_admin",
      status: "Activo",
      branchId: "Sede Principal",
      sendInvite: true,
    });
    setDialogOpen(true);
  };

  const openEditUser = (u: RbacUser) => {
    setUserForm({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      roleId: u.roleId,
      status: u.status,
      branchId: u.branchId ?? "Sede Principal",
      sendInvite: false,
    });
    setDialogOpen(true);
  };

  const saveUser = () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      return toast.error("Por favor completa al menos el nombre y correo electrónico");
    }

    if (userForm.id) {
      updateUser(userForm.id, {
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        roleId: userForm.roleId,
        status: userForm.status,
        branchId: userForm.branchId,
      });
      logAudit({
        userId: "usr_current",
        userName: "Administrador",
        action: `Actualizó usuario: ${userForm.name}`,
        module: "roles",
        recordId: userForm.id,
      });
      toast.success("Usuario actualizado correctamente");
    } else {
      const created = addUser({
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        roleId: userForm.roleId,
        status: userForm.status,
        branchId: userForm.branchId,
        clinicId: "cl1",
        lastAccess: undefined,
      });
      logAudit({
        userId: "usr_current",
        userName: "Administrador",
        action: `Creó nuevo usuario: ${userForm.name}`,
        module: "roles",
        recordId: created.id,
      });
      if (userForm.sendInvite) {
        toast.success(`Usuario creado e invitación enviada a ${userForm.email}`);
      } else {
        toast.success("Usuario creado correctamente");
      }
    }
    setDialogOpen(false);
  };

  const handleToggleStatus = (u: RbacUser) => {
    const newStatus: UserStatus = u.status === "Activo" ? "Suspendido" : "Activo";
    updateUser(u.id, { status: newStatus });
    logAudit({
      userId: "usr_current",
      userName: "Administrador",
      action: `Cambió estado de usuario ${u.name} a ${newStatus}`,
      module: "roles",
      recordId: u.id,
    });
    toast.success(`Usuario ${u.name} ahora está ${newStatus}`);
  };

  const handleSendInvite = (u: RbacUser) => {
    toast.success(`Enlace de acceso y activación reenviado a ${u.email}`);
    logAudit({
      userId: "usr_current",
      userName: "Administrador",
      action: `Reenvió invitación de acceso a ${u.name}`,
      module: "roles",
      recordId: u.id,
    });
  };

  const handleDeleteUser = (u: RbacUser) => {
    if (confirm(`¿Estás seguro de eliminar el acceso de "${u.name}"? Esta acción no se puede deshacer.`)) {
      deleteUser(u.id);
      logAudit({
        userId: "usr_current",
        userName: "Administrador",
        action: `Eliminó usuario: ${u.name}`,
        module: "roles",
        recordId: u.id,
      });
      toast.success("Usuario eliminado de la clínica");
    }
  };

  const selectedRoleObject = roles.find((r) => r.id === userForm.roleId);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        {/* Encabezado Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <UserCog className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios y Personal</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Administra los accesos del equipo clínico, recepción y administración. Asigna roles y controla sus permisos.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link to="/roles">
              <Button variant="outline" size="sm" className="gap-2">
                <Shield className="h-4 w-4" />
                Roles y Permisos
              </Button>
            </Link>
            <Can module="roles" action="create">
              <Button size="sm" onClick={openNewUser} className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Nuevo Usuario
              </Button>
            </Can>
          </div>
        </div>

        {/* Tarjetas de Resumen KPI */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="shadow-none border-border/80">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground font-medium">Usuarios Registrados</div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border-border/80">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.activos}</div>
                <div className="text-xs text-muted-foreground font-medium">Cuentas Activas</div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border-border/80">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.adminCount}</div>
                <div className="text-xs text-muted-foreground font-medium">Administradores</div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border-border/80">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                <UserX className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.suspendidos}</div>
                <div className="text-xs text-muted-foreground font-medium">Inactivos / Suspendidos</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <Card className="shadow-none border-border/80">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, correo, teléfono o sucursal..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[170px] h-9 text-xs">
                    <SelectValue placeholder="Filtrar por rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los roles</SelectItem>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="Activo">Activos</SelectItem>
                    <SelectItem value="Inactivo">Inactivos</SelectItem>
                    <SelectItem value="Suspendido">Suspendidos</SelectItem>
                  </SelectContent>
                </Select>

                {(query || roleFilter !== "todos" || statusFilter !== "todos") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      setRoleFilter("todos");
                      setStatusFilter("todos");
                    }}
                    className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                    title="Limpiar filtros"
                  >
                    <FilterX className="h-4 w-4 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60">
              <span>
                Mostrando <strong className="text-foreground">{filteredUsers.length}</strong> de{" "}
                <strong className="text-foreground">{users.length}</strong> usuarios
              </span>
              <span className="hidden sm:inline">
                Los permisos específicos de cada rol se configuran en{" "}
                <Link to="/roles" className="text-primary hover:underline font-medium">
                  Roles y Permisos
                </Link>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tabla Principal de Usuarios */}
        <Card className="shadow-none border-border/80 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[280px]">Usuario</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Rol Asignado</TableHead>
                <TableHead>Sucursal / Sede</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead className="text-right pr-4">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserX className="h-8 w-8 text-muted-foreground/50" />
                      <p className="font-medium text-sm">No se encontraron usuarios con los filtros aplicados</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setQuery("");
                          setRoleFilter("todos");
                          setStatusFilter("todos");
                        }}
                      >
                        Restablecer filtros
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => {
                  const role = roles.find((r) => r.id === u.roleId);
                  return (
                    <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                      {/* Usuario con Avatar */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                              {initials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-foreground truncate">{u.name}</div>
                            <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <Mail className="h-3 w-3 inline-block shrink-0" />
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Teléfono */}
                      <TableCell>
                        <div className="text-xs text-foreground font-medium flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                          {u.phone || "—"}
                        </div>
                      </TableCell>

                      {/* Rol */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium py-0.5 px-2 ${roleBadgeColor(u.roleId)}`}
                        >
                          {role?.name ?? "Sin Rol"}
                        </Badge>
                      </TableCell>

                      {/* Sucursal */}
                      <TableCell>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3 shrink-0" />
                          {u.branchId || "Sede Principal"}
                        </div>
                      </TableCell>

                      {/* Estado */}
                      <TableCell>{statusBadge(u.status)}</TableCell>

                      {/* Último Acceso */}
                      <TableCell>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          {u.lastAccess ? new Date(u.lastAccess).toLocaleDateString() : "Nunca"}
                        </div>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs">Acciones de Usuario</DropdownMenuLabel>
                            <Can module="roles" action="edit">
                              <DropdownMenuItem onClick={() => openEditUser(u)} className="cursor-pointer text-xs">
                                <Pencil className="h-3.5 w-3.5 mr-2" />
                                Editar usuario
                              </DropdownMenuItem>
                            </Can>
                            <DropdownMenuItem onClick={() => handleSendInvite(u)} className="cursor-pointer text-xs">
                              <Send className="h-3.5 w-3.5 mr-2" />
                              Reenviar invitación
                            </DropdownMenuItem>
                            <Can module="roles" action="edit">
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(u)}
                                className="cursor-pointer text-xs"
                              >
                                {u.status === "Activo" ? (
                                  <>
                                    <UserX className="h-3.5 w-3.5 mr-2 text-rose-500" />
                                    Suspender acceso
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                    Activar cuenta
                                  </>
                                )}
                              </DropdownMenuItem>
                            </Can>
                            <DropdownMenuSeparator />
                            <Can module="roles" action="delete">
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(u)}
                                className="cursor-pointer text-xs text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Eliminar usuario
                              </DropdownMenuItem>
                            </Can>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Dialog para Crear o Editar Usuario */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              {userForm.id ? "Editar Colaborador / Usuario" : "Registrar Nuevo Usuario"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Nombre Completo *</Label>
              <Input
                placeholder="Ej. Dr. Carlos Mendoza"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Correo Electrónico *</Label>
                <Input
                  type="email"
                  placeholder="usuario@clinica.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Teléfono / Celular</Label>
                <Input
                  placeholder="+593 99 123 4567"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Rol Asignado *</Label>
                <Select
                  value={userForm.roleId}
                  onValueChange={(v) => setUserForm({ ...userForm, roleId: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRoleObject && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {selectedRoleObject.description}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold">Estado de Cuenta</Label>
                <Select
                  value={userForm.status}
                  onValueChange={(v) => setUserForm({ ...userForm, status: v as UserStatus })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo (con acceso)</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                    <SelectItem value="Suspendido">Suspendido (bloqueado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Sede / Sucursal Asignada</Label>
              <Input
                placeholder="Ej. Sede Central, Norte, etc."
                value={userForm.branchId}
                onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}
                className="mt-1"
              />
            </div>

            {!userForm.id && (
              <div className="p-3 rounded-lg border border-border/80 bg-muted/30 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="sendInvite"
                  checked={userForm.sendInvite}
                  onChange={(e) => setUserForm({ ...userForm, sendInvite: e.target.checked })}
                  className="mt-1 rounded text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="sendInvite" className="text-xs cursor-pointer">
                  <span className="font-semibold block text-foreground">Enviar invitación por correo electrónico</span>
                  <span className="text-muted-foreground">
                    El usuario recibirá un enlace para crear su contraseña y acceder inmediatamente al sistema.
                  </span>
                </label>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveUser}>
              {userForm.id ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
