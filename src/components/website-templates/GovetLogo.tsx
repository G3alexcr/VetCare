import React from "react";

interface GovetLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
}

export function GovetLogo({ className = "", size = "md", withTagline = true }: GovetLogoProps) {
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

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Símbolo Govet: Escudo circular, monograma G estilizado con huella y cruz de curación */}
      <div className={`${iconSizes[size]} relative rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-0.5 shadow-md shadow-emerald-700/20 grid place-items-center shrink-0`}>
        <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center relative overflow-hidden">
          {/* Patrón de brillo médico */}
          <div className="absolute -top-3 -right-3 w-8 h-8 bg-white/20 rounded-full blur-xs" />
          
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white drop-shadow-xs">
            {/* Huella estilizada y Monograma 'G' */}
            <circle cx="16" cy="14" r="3.5" fill="white" fillOpacity="0.9" />
            <circle cx="25" cy="11" r="3.5" fill="white" fillOpacity="0.9" />
            <circle cx="34" cy="15" r="3.5" fill="white" fillOpacity="0.9" />
            <path
              d="M14 26C14 21.5817 17.5817 18 22 18H28C32.4183 18 36 21.5817 36 26C36 30.4183 32.4183 34 28 34H22C17.5817 34 14 30.4183 14 26Z"
              fill="white"
              fillOpacity="0.95"
            />
            {/* Cruz médica sutil en el corazón del símbolo */}
            <path
              d="M23 23H27V29H23V23Z"
              fill="#0F766E"
            />
            <path
              d="M21 25H29V27H21V25Z"
              fill="#0F766E"
            />
          </svg>
        </div>
      </div>

      {/* Tipografía Corporativa Govet */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center leading-none tracking-tight">
          <span className={`font-black ${textSizes[size]} text-slate-900 tracking-tighter`}>
            Go<span className="text-emerald-600">vet</span>
          </span>
          <span className="ml-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        </div>
        {withTagline && (
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-teal-700 leading-none mt-1">
            Centro de Especialidades
          </span>
        )}
      </div>
    </div>
  );
}
