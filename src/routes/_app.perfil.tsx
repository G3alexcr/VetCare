import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/app-layout";
import { SuperAdminLayout } from "@/components/superadmin-layout";
import { useAuth } from "@/lib/auth";
import { useCurrentRoleId } from "@/lib/rbac";
import { useActingClinicId } from "@/lib/saas-store";
import { useUserProfile, updateUserProfile, fileToAvatarDataUrl } from "@/lib/user-profile-store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  User,
  Bell,
  Mail,
  Phone,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  FileBadge,
  Sparkles,
  Save,
  Camera,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/perfil")({
  head: () => ({ meta: [{ title: "Perfil de Usuario — VetCare" }] }),
  component: ProfilePageWrapper,
});

function ProfilePageWrapper() {
  const roleId = useCurrentRoleId();
  const isSuper = roleId === "role_super";
  const actingClinicId = useActingClinicId();

  if (isSuper && !actingClinicId) {
    return (
      <SuperAdminLayout>
        <UserProfileContent />
      </SuperAdminLayout>
    );
  }

  return (
    <AppLayout>
      <UserProfileContent />
    </AppLayout>
  );
}

function UserProfileContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const profile = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tabs: "datos" | "carnet"
  const [activeTab, setActiveTab] = useState<"datos" | "carnet">("datos");

  // Perfil del usuario
  const [nombre, setNombre] = useState(profile.nombre);
  const [apellidos, setApellidos] = useState(profile.apellidos);
  const [email, setEmail] = useState(profile.email || user?.email || "");
  const [telefono, setTelefono] = useState(profile.telefono);
  const [emailRecuperacion, setEmailRecuperacion] = useState(profile.emailRecuperacion);
  const [telefonoRecuperacion, setTelefonoRecuperacion] = useState(profile.telefonoRecuperacion);

  // Preferencias de notificación
  const [pushEnabled, setPushEnabled] = useState(profile.pushEnabled);
  const [emailEnabled, setEmailEnabled] = useState(profile.emailEnabled);

  useEffect(() => {
    setNombre(profile.nombre);
    setApellidos(profile.apellidos);
    setEmail(profile.email || user?.email || "");
    setTelefono(profile.telefono);
    setEmailRecuperacion(profile.emailRecuperacion);
    setTelefonoRecuperacion(profile.telefonoRecuperacion);
    setPushEnabled(profile.pushEnabled);
    setEmailEnabled(profile.emailEnabled);
  }, [profile, user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona un archivo de imagen válido");
      return;
    }
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      updateUserProfile({ avatarUrl: dataUrl });
      toast.success("Foto de perfil actualizada con éxito");
    } catch {
      toast.error("No se pudo procesar la imagen");
    }
    e.target.value = "";
  };

  const handleRemoveAvatar = () => {
    updateUserProfile({ avatarUrl: null });
    toast.success("Foto de perfil eliminada");
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateUserProfile({
      nombre,
      apellidos,
      email,
      telefono,
      emailRecuperacion,
      telefonoRecuperacion,
      pushEnabled,
      emailEnabled,
    });
    toast.success("Perfil actualizado correctamente");
  };

  const roleLabel =
    user?.role === "super"
      ? "SUPER ADMIN"
      : user?.role === "admin"
      ? "ADMINISTRADOR"
      : user?.role === "vet"
      ? "VETERINARIO"
      : "RECEPCIÓN";

  const userIdFormatted = user?.id ? user.id.slice(0, 8).toUpperCase() : "0045C835";
  const fullName = `${nombre} ${apellidos}`.trim() || user?.name || "Usuario";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header con botón atrás */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => window.history.back()}
          className="h-10 w-10 rounded-full border-border/80 bg-background shadow-xs hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Volver</span>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">PERFIL DE USUARIO</h1>
          <p className="text-xs text-muted-foreground font-medium">Gestiona tu información personal y profesional</p>
        </div>
      </div>

      {/* Tarjeta de Identidad Superior (Igual a Imagen 1) */}
      <Card className="p-8 rounded-3xl border border-border/60 bg-card shadow-xs text-center relative overflow-hidden">
        <div className="flex flex-col items-center justify-center">
          <div className="relative mb-3 group">
            <Avatar className="h-28 w-28 border-4 border-background shadow-lg overflow-hidden bg-primary/10">
              {profile.avatarUrl ? (
                <AvatarImage src={profile.avatarUrl} alt={fullName} className="h-full w-full object-cover" />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary text-3xl font-black">
                {fullName.split(" ").map((n) => n[0]).slice(0, 2).join("") || "U"}
              </AvatarFallback>
            </Avatar>

            {/* Botón flotante para cambiar foto */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-transform hover:scale-110 cursor-pointer border-2 border-background"
              title="Cambiar foto de perfil"
            >
              <Camera className="h-4.5 w-4.5" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />

            <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full tracking-wider uppercase shadow-xs pointer-events-none">
              {roleLabel}
            </span>
          </div>

          {/* Opciones para cambiar o quitar foto */}
          <div className="flex items-center gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-7 text-xs rounded-full gap-1.5 cursor-pointer"
            >
              <Camera className="h-3.5 w-3.5" />
              {profile.avatarUrl ? "Cambiar foto" : "Subir foto"}
            </Button>
            {profile.avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveAvatar}
                className="h-7 text-xs rounded-full text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Quitar
              </Button>
            )}
          </div>

          <h2 className="text-2xl font-bold text-foreground mt-3">{fullName}</h2>

          <div className="flex items-center justify-center gap-2 mt-1.5 text-xs text-muted-foreground font-medium">
            <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> VERIFICADO
            </span>
            <span>•</span>
            <span>ID: {userIdFormatted}</span>
          </div>
        </div>

        {/* Pestañas estilo píldora central (Exactas a Imagen 1) */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex p-1 rounded-full bg-slate-900 text-white shadow-md gap-1">
            <button
              onClick={() => setActiveTab("datos")}
              type="button"
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === "datos"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <span>✏</span> MIS DATOS
            </button>
            <button
              onClick={() => setActiveTab("carnet")}
              type="button"
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === "carnet"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> MI CARNET
            </button>
          </div>
        </div>
      </Card>

      {/* Pestaña: MIS DATOS */}
      {activeTab === "datos" && (
        <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-6">
          {/* Columna Izquierda: DATOS PERSONALES Y DE CONTACTO */}
          <Card className="p-6 rounded-3xl border border-border/60 bg-card space-y-5">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                Datos personales y de contacto
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Nombre
                </Label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="rounded-xl h-10 bg-muted/20"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Apellidos
                </Label>
                <Input
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  className="rounded-xl h-10 bg-muted/20"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Correo Institucional / Profesional
                </Label>
                <div className="relative">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl h-10 pr-10 bg-muted/20"
                  />
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Teléfono Personal
                </Label>
                <div className="relative">
                  <Input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="rounded-xl h-10 pr-10 bg-muted/20"
                  />
                  <Phone className="h-4 w-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Correo de recuperación (Personal)
                </Label>
                <div className="relative">
                  <Input
                    type="email"
                    value={emailRecuperacion}
                    onChange={(e) => setEmailRecuperacion(e.target.value)}
                    className="rounded-xl h-10 pr-10 bg-muted/20"
                  />
                  <Mail className="h-4 w-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  Este correo se utilizará para la recuperación de su cuenta (correo personal).
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Teléfono de recuperación (WhatsApp)
                </Label>
                <div className="relative">
                  <Input
                    value={telefonoRecuperacion}
                    onChange={(e) => setTelefonoRecuperacion(e.target.value)}
                    className="rounded-xl h-10 pr-10 bg-muted/20"
                  />
                  <Phone className="h-4 w-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  Este número se utilizará para alertas de seguridad y recuperación (WhatsApp).
                </p>
              </div>

              <Button type="submit" className="w-full mt-4 rounded-xl gap-2 font-bold">
                <Save className="h-4 w-4" /> Guardar Cambios
              </Button>
            </div>
          </Card>

          {/* Columna Derecha: PREFERENCIAS DE NOTIFICACIÓN */}
          <Card className="p-6 rounded-3xl border border-border/60 bg-card space-y-5 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="h-10 w-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                  <Bell className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                  Preferencias de notificación
                </h3>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Elige cómo quieres recibir las alertas de citas, recordatorios clínicos, vacunas y avisos de VetCare.
              </p>

              {/* Notificaciones Push */}
              <div className="flex items-center justify-between p-4 rounded-2xl border bg-muted/20 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-teal-500/10 text-teal-600 grid place-items-center flex-shrink-0">
                    <Bell className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-foreground">NOTIFICACIONES PUSH</div>
                    <div className="text-[11px] text-muted-foreground">Alertas instantáneas en tu dispositivo móvil o PC</div>
                  </div>
                </div>
                <Switch checked={pushEnabled} onCheckedChange={(val) => { setPushEnabled(val); toast.success("Preferencia actualizada"); }} />
              </div>

              {/* Envío por correo */}
              <div className="flex items-center justify-between p-4 rounded-2xl border bg-muted/20 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-teal-500/10 text-teal-600 grid place-items-center flex-shrink-0">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-foreground">ENVÍO POR CORREO</div>
                    <div className="text-[11px] text-muted-foreground">Reportes detallados y comunicados en tu email</div>
                  </div>
                </div>
                <Switch checked={emailEnabled} onCheckedChange={(val) => { setEmailEnabled(val); toast.success("Preferencia actualizada"); }} />
              </div>

              {/* Aviso de privacidad (Exacto a Imagen 1) */}
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  VetCare respeta tu privacidad. La configuración de notificaciones se aplica de inmediato a tu cuenta.
                </p>
              </div>
            </div>
          </Card>
        </form>
      )}

      {/* Pestaña: MI CARNET */}
      {activeTab === "carnet" && (
        <div className="max-w-md mx-auto">
          <Card className="p-8 rounded-3xl border border-border/70 bg-gradient-to-br from-card to-muted/40 shadow-lg space-y-6 text-center">
            <div className="flex items-center justify-between border-b pb-4">
              <span className="font-black text-sm text-primary tracking-wider">VETCARE CREDENCIAL</span>
              <Badge variant="outline" className="text-[10px] font-bold border-primary text-primary">
                ACTIVO 2026
              </Badge>
            </div>

            <div className="flex flex-col items-center">
              <Avatar className="h-28 w-28 border-4 border-primary/30 shadow-md overflow-hidden bg-primary/10">
                {profile.avatarUrl ? (
                  <AvatarImage src={profile.avatarUrl} alt={fullName} className="h-full w-full object-cover" />
                ) : null}
                <AvatarFallback className="bg-primary/20 text-primary font-black text-3xl">
                  {fullName.split(" ").map((n) => n[0]).slice(0, 2).join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold mt-3">{fullName}</h3>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                {roleLabel}
              </p>
            </div>

            <div className="bg-background p-4 rounded-2xl border text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID Profesional:</span>
                <span className="font-mono font-bold">{userIdFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Correo:</span>
                <span className="font-medium">{email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado:</span>
                <span className="text-emerald-600 font-bold">Verificado Oficial</span>
              </div>
            </div>

            <div className="flex flex-col items-center pt-2">
              <div className="p-3 bg-white rounded-2xl border shadow-xs inline-block">
                <QrCode className="h-28 w-28 text-slate-900" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Escanea para validar autenticidad de credencial médica en VetCare
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
