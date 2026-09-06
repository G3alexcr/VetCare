import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, ExternalLink } from "lucide-react";

export function ImagePreviewDialog({
  src,
  alt = "Fotografía",
  title,
  open,
  onOpenChange,
}: {
  src: string | null | undefined;
  alt?: string;
  title?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!src) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-4xl max-h-[95vh] bg-black/95 text-white border-white/10 overflow-hidden flex flex-col items-center justify-center rounded-2xl shadow-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">{title || alt}</DialogTitle>
        <div className="w-full flex items-center justify-between p-3 px-4 bg-black/60 text-white/90 border-b border-white/10 z-10 shrink-0">
          <div className="text-xs font-semibold truncate max-w-md">
            {title || alt}
          </div>
          <div className="flex items-center gap-1.5">
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              download
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Abrir imagen original"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="relative w-full flex-1 flex items-center justify-center p-2 sm:p-4 min-h-[300px] max-h-[85vh] overflow-auto">
          <img
            src={src}
            alt={alt}
            className="max-h-[80vh] max-w-full w-auto h-auto object-contain rounded-lg shadow-lg select-none"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
