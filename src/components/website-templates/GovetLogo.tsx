import React from "react";

interface GovetLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
  name?: string;
  tagline?: string;
}

export function GovetLogo({ 
  className = "", 
  size = "md", 
  withTagline = true,
  name = "Paws Pattient",
  tagline = "Centro de Especialidades"
}: GovetLogoProps) {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-13 h-13",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const initial = name ? name.trim().charAt(0).toUpperCase() : "P";

  // Si tiene múltiples palabras, resaltamos la segunda o última parte
  const parts = name.trim().split(" ");
  const firstWord = parts[0] || "Paws";
  const restWords = parts.slice(1).join(" ");

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Símbolo: Escudo circular con inicial de la clínica y huella médica */}
      <div className={`${iconSizes[size]} relative rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-0.5 shadow-md shadow-emerald-700/20 grid place-items-center shrink-0`}>
        <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center relative overflow-hidden">
          {/* Patrón de brillo médico */}
          <div className="absolute -top-3 -right-3 w-8 h-8 bg-white/20 rounded-full blur-xs" />
          
          <div className="relative flex items-center justify-center font-black text-white text-base sm:text-lg drop-shadow-xs">
            {initial}
            <span className="absolute -bottom-0.5 -right-1 text-[10px]">🐾</span>
          </div>
        </div>
      </div>

      {/* Tipografía Corporativa de la Clínica */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center leading-none tracking-tight">
          <span className={`font-black ${textSizes[size]} text-slate-900 tracking-tighter`}>
            {firstWord}{restWords ? <span className="text-emerald-600 ml-1.5">{restWords}</span> : null}
          </span>
          <span className="ml-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        </div>
        {withTagline && (
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-teal-700 leading-none mt-1">
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
}
