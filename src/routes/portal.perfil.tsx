import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { User as UserIcon, MessageCircle, Bot, Lock, Camera, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PortalLayout } from "@/components/portal-layout";
import { usePortalAuth } from "@/lib/portal-auth";
import { fileToAvatarDataUrl } from "@/lib/user-profile-store";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Portal" }] }),
  component: () => (
    <PortalLayout>
      <PortalProfilePage />
    </PortalLayout>
  ),
});

function PortalProfilePage() {
  const { owner, updateOwner } = usePortalAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(owner?.avatarUrl ?? "");
  const [form, setForm] = useState(() => ({
    fullName: owner?.fullName ?? "",
    phone: owner?.phone ?? "",
    email: owner?.email ?? "",
    address: owner?.address ?? "",
    whatsapp: owner?.whatsapp ?? "",
  }));
  const [password, setPassword] = useState("");

  if (!owner) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToAvatarDataUrl(file, 512);
      setAvatarUrl(dataUrl);
      updateOwner({ avatarUrl: dataUrl });
      toast.success("Foto de perfil actualizada");
    } catch {
      toast.error("Error al procesar la imagen");
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl("");
    updateOwner({ avatarUrl: "" });
    toast.success("Foto eliminada");
  };

  const save = () => {
    updateOwner({ ...form, avatarUrl });
    toast.success("Perfil actualizado");
  };
  const changePw = () => {
    if (password.length < 6) { toast.error("Mínimo 6 caracteres"); return; }
    setPassword("");
    toast.success("Contraseña actualizada");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Mi perfil</h1>
        <p className="text-muted-foreground text-sm">Actualiza tus datos de contacto y preferencias.</p>
      </div>

      <Card className="p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-border shadow-xs">
              {avatarUrl && (
                <AvatarImage src={avatarUrl} alt={owner.fullName} className="object-cover" />
              )}
              <AvatarFallback className="bg-emerald-600 text-white font-semibold text-lg">
                {owner.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-transform active:scale-95"
              title="Cambiar foto de perfil"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <div className="font-semibold text-lg">{owner.fullName}</div>
            <div className="text-sm text-muted-foreground">{owner.email}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs"
            >
              <Camera className="h-3.5 w-3.5 mr-1.5" />
              {avatarUrl ? "Cambiar foto" : "Subir foto"}
            </Button>
            {avatarUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemovePhoto}
                className="text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Quitar
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <Field label="Nombre completo" value={form.fullName} onChange={(v) => setForm((f) => ({ ...f, fullName: v }))} />
          <Field label="Correo electrónico" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
          <Field label="Teléfono" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
          <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm((f) => ({ ...f, whatsapp: v }))} />
          <div className="sm:col-span-2">
            <Field label="Dirección" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={save}><UserIcon className="h-4 w-4 mr-2" /> Guardar cambios</Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 font-semibold"><Lock className="h-4 w-4" /> Cambiar contraseña</div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <Label>Nueva contraseña</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <Button onClick={changePw}>Actualizar</Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="font-semibold">Chat y asistencia</div>
        <p className="text-sm text-muted-foreground mt-1">Integraciones preparadas para futuras versiones.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Button variant="outline" onClick={() => toast.info("Próximamente: WhatsApp")}>
            <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
          </Button>
          <Button variant="outline" onClick={() => toast.info("Próximamente: Chat interno")}>
            <MessageCircle className="h-4 w-4 mr-2" /> Chat interno
          </Button>
          <Button variant="outline" onClick={() => toast.info("Próximamente: Asistente IA")}>
            <Bot className="h-4 w-4 mr-2" /> Asistente IA
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
