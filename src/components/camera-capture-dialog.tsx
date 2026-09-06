import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, X, SwitchCamera, AlertCircle, Upload } from "lucide-react";
import { toast } from "sonner";

interface CameraCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (dataUrl: string) => void;
  title?: string;
}

export function CameraCaptureDialog({
  open,
  onOpenChange,
  onCapture,
  title = "Tomar fotografía",
}: CameraCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileFallbackRef = useRef<HTMLInputElement>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  // Stop camera tracks cleanly
  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Enumerate video devices
  const loadDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = allDevices.filter((d) => d.kind === "videoinput");
      setDevices(videoDevs);
      if (videoDevs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevs[0].deviceId);
      }
    } catch {
      // ignore
    }
  };

  // Start camera stream
  const startCamera = async () => {
    stopTracks();
    setError(null);
    setIsStarting(true);
    setCapturedImage(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Tu navegador no soporta captura de cámara en directo. Puedes subir una foto desde tu dispositivo.");
      setIsStarting(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : {
              facingMode: { ideal: facingMode },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      await loadDevices();
      setIsStarting(false);
    } catch (err: any) {
      console.warn("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Permiso denegado. Permite el acceso a la cámara en tu navegador para tomar fotos.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("No se detectó ninguna cámara disponible en este dispositivo.");
      } else {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play().catch(() => {});
          }
          await loadDevices();
          setIsStarting(false);
          return;
        } catch {
          setError("No se pudo iniciar la cámara. Verifica que no esté en uso por otra aplicación.");
        }
      }
      setIsStarting(false);
    }
  };

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopTracks();
      setCapturedImage(null);
      setError(null);
    }
    return () => {
      stopTracks();
    };
  }, [open, selectedDeviceId, facingMode]);

  // Capture frame to canvas
  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const maxDim = 1280;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Error al procesar la captura");
      return;
    }

    // Flash animation
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    // If front camera, mirror horizontally for natural feel
    const isUserFacing = facingMode === "user";
    if (isUserFacing) {
      ctx.translate(targetW, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, targetW, targetH);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(dataUrl);
    stopTracks();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (!capturedImage) return;
    onCapture(capturedImage);
    onOpenChange(false);
  };

  const handleSwitchFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      setCapturedImage(result);
      stopTracks();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-background border shadow-2xl">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Camera className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-black aspect-[4/3] w-full flex items-center justify-center overflow-hidden">
          {/* Shutter flash effect */}
          {isFlashing && <div className="absolute inset-0 bg-white z-30 opacity-90 transition-opacity" />}

          {/* Captured Preview */}
          {capturedImage ? (
            <img src={capturedImage} alt="Foto capturada" className="w-full h-full object-contain bg-black" />
          ) : error ? (
            <div className="p-6 text-center text-white space-y-4 max-w-md">
              <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
              <p className="text-sm font-medium text-white/90">{error}</p>
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileFallbackRef.current?.click()}
                  className="gap-2 mx-auto"
                >
                  <Upload className="h-4 w-4" /> Seleccionar o tomar desde archivo
                </Button>
                <input
                  ref={fileFallbackRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFallbackFile}
                />
                <Button type="button" variant="outline" size="sm" onClick={startCamera} className="gap-2 mx-auto text-black">
                  <RefreshCw className="h-4 w-4" /> Reintentar cámara
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Live Video Stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              />

              {isStarting && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" /> Iniciando cámara...
                </div>
              )}

              {/* Camera Switch Controls */}
              <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                {devices.length > 1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="rounded-full bg-black/60 hover:bg-black/80 text-white border-0 h-9 w-9 backdrop-blur-sm"
                    onClick={handleSwitchFacingMode}
                    title="Cambiar cámara"
                  >
                    <SwitchCamera className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-muted/40 border-t flex items-center justify-between gap-3">
          {capturedImage ? (
            <>
              <Button type="button" variant="outline" onClick={handleRetake} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Tomar otra
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleConfirm} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Check className="h-4 w-4" /> Usar esta foto
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="gap-1.5">
                <X className="h-4 w-4" /> Cancelar
              </Button>

              {!error && (
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={handleSnap}
                    disabled={isStarting}
                    size="lg"
                    className="rounded-full px-6 h-12 bg-primary text-primary-foreground font-semibold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <div className="h-4 w-4 rounded-full bg-red-500 animate-pulse" />
                    <Camera className="h-5 w-5" /> Capturar
                  </Button>
                </div>
              )}

              {/* Device fallback */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileFallbackRef.current?.click()}
                className="gap-1.5 text-xs"
              >
                <Upload className="h-3.5 w-3.5" /> Subir archivo
              </Button>
              <input
                ref={fileFallbackRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFallbackFile}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
