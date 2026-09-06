import React from "react";
import { PawPrint } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Go2VetLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  badgeText?: string;
  subtitle?: string;
  variant?: "default" | "light";
}

export function Go2VetLogo({
  className = "",
  size = "md",
  badgeText,
  subtitle,
  variant = "default",
}: Go2VetLogoProps) {
  const iconSizes = {
    sm: "h-8 w-8 rounded-lg",
    md: "h-9.5 w-9.5 sm:h-10 sm:w-10 rounded-xl",
    lg: "h-12 w-12 rounded-2xl",
  };

  const pawSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6.5 w-6.5",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg sm:text-xl",
    lg: "text-2xl sm:text-3xl",
  };

  const isLight = variant === "light";

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 min-w-0 select-none ${className}`}>
      {/* Emblema Go2Vet: Gradiente esmeralda/verde azulado con huella y el número 2 dinámico */}
      <div
        className={`${iconSizes[size]} bg-gradient-to-br from-[#009d9e] via-[#028485] to-[#046162] text-white grid place-items-center shadow-md shadow-[#009d9e]/25 shrink-0 relative overflow-hidden`}
      >
        {/* Patrón de brillo médico */}
        <div className="absolute -top-2 -right-2 w-7 h-7 bg-white/20 rounded-full blur-xs" />

        <div className="relative flex items-center justify-center">
          <PawPrint className={`${pawSizes[size]} drop-shadow-xs`} />
          <span className="absolute -bottom-1 -right-1 text-[9px] font-black bg-amber-400 text-slate-950 px-1 py-0.2 rounded-full leading-none shadow-xs">
            2
          </span>
        </div>
      </div>

      {/* Nombre y subtítulo */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 leading-none">
          <span
            className={`font-black ${textSizes[size]} tracking-tight ${
              isLight ? "text-white" : "text-slate-900 dark:text-white"
            }`}
          >
            Go<span className="text-[#009d9e]">2</span>Vet
          </span>
          {badgeText && (
            <Badge
              variant="outline"
              className={`border-[#009d9e]/40 text-[#009d9e] bg-[#009d9e]/10 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider py-0 px-1.5 sm:px-2 shrink-0 ${
                isLight ? "border-white/30 text-white bg-white/10" : ""
              }`}
            >
              {badgeText}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p
            className={`text-[10px] sm:text-[11px] font-medium truncate mt-1 ${
              isLight ? "text-white/80" : "text-muted-foreground"
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// Alias para compatibilidad
export const Vet2CareLogo = Go2VetLogo;
