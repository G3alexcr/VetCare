import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Link2, X, Image as ImageIcon, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fileToBase64DataUrl, getBase64SizeKb } from "@/lib/image-upload";

interface ImageUploaderProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  aspect?: "banner" | "wide" | "square" | "thumb";
  presetSuggestions?: { label: string; url: string }[];
  helperText?: string;
}

export function ImageUploader({
  label,
  value,
  onChange,
  placeholder = "https://... o sube una imagen",
  aspect = "wide",
  presetSuggestions,
  helperText,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const isBase64 = value?.startsWith("data:image");
  const sizeKb = isBase64 ? getBase64SizeKb(value) : null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP)");
      return;
    }

    try {
      setLoading(true);
      const base64 = await fileToBase64DataUrl(file, 1400, 0.85);
      onChange(base64);
      const kb = getBase64SizeKb(base64);
      toast.success(`Imagen cargada desde tu equipo (${kb} KB)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar la imagen";
      toast.error(msg);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getAspectClass = () => {
    switch (aspect) {
      case "banner":
        return "h-28 w-44";
      case "square":
        return "h-24 w-24";
      case "thumb":
        return "h-14 w-20";
      case "wide":
      default:
        return "h-20 w-32";
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-slate-700 text-xs font-bold block">{label}</Label>
          {isBase64 && sizeKb !== null && (
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Imagen en Base64 ({sizeKb} KB)
            </span>
          )}
        </div>
      )}

      {/* Control Principal con Botón de Archivo y Previsualización */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
        {/* Thumbnail Preview */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`${getAspectClass()} rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0 grid place-items-center shadow-xs cursor-pointer hover:border-teal-500 hover:ring-2 hover:ring-teal-100 transition-all relative group`}
          title="Haz clic para cambiar imagen desde tu computadora"
        >
          {value ? (
            <>
              <img src={value} alt="preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold">
                <Upload className="w-4 h-4 mb-0.5" />
                <span>Cambiar</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-slate-400 text-[10px]">
              <ImageIcon className="w-5 h-5 mb-1 text-slate-300" />
              <span>Sin foto</span>
            </div>
          )}
        </div>

        {/* Acciones y Campo de Entrada */}
        <div className="flex-1 min-w-0 w-full space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Botón para subir archivo desde la computadora */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
              onChange={handleFileSelect}
            />

            <Button
              type="button"
              size="sm"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold h-8 rounded-xl shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Procesando...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 mr-1.5" /> Subir desde Computadora
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowUrlInput((v) => !v)}
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs h-8 rounded-xl"
            >
              <Link2 className="w-3.5 h-3.5 mr-1 text-slate-500" />
              {showUrlInput ? "Ocultar URL" : "Pegar URL web"}
            </Button>

            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange("")}
                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 text-xs h-8 rounded-xl ml-auto"
              >
                <X className="w-3.5 h-3.5 mr-1" /> Quitar Foto
              </Button>
            )}
          </div>

          {/* Input de URL opcional si el usuario quiere pegar un link web o inspeccionar el base64 */}
          {showUrlInput && (
            <div className="pt-1">
              <Input
                value={isBase64 ? "data:image/... [Imagen cargada localmente en Base64]" : value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="bg-white border-slate-300 text-slate-900 text-xs font-mono h-8 rounded-xl focus:border-teal-500"
              />
            </div>
          )}

          {helperText && !showUrlInput && (
            <p className="text-[11px] text-slate-500 leading-tight">
              {helperText}
            </p>
          )}
        </div>
      </div>

      {/* Sugerencias de fotos si están provistas */}
      {presetSuggestions && presetSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sugerencias:</span>
          {presetSuggestions.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(preset.url)}
              className="text-[11px] bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 px-2.5 py-0.5 rounded-lg border border-slate-200 transition-colors font-medium"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
