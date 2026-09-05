import { useSyncExternalStore } from "react";
import { useClinics, useCurrentClinicId, updateClinic, getCurrentClinicId } from "./saas-store";

export type Currency = "CRC" | "USD" | "COP" | "MXN" | "ARS" | "CLP" | "PEN";

export const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: "CRC", label: "Colón costarricense (₡)", symbol: "₡" },
  { value: "USD", label: "Dólar estadounidense ($)", symbol: "$" },
  { value: "COP", label: "Peso colombiano ($)", symbol: "$" },
  { value: "MXN", label: "Peso mexicano ($)", symbol: "$" },
  { value: "ARS", label: "Peso argentino ($)", symbol: "$" },
  { value: "CLP", label: "Peso chileno ($)", symbol: "$" },
  { value: "PEN", label: "Sol peruano (S/)", symbol: "S/" },
];

const SUPPORTED = new Set<string>(CURRENCIES.map((c) => c.value));

// En SaaS la moneda proviene de la clínica activa (reactivo al cambiar de clínica).
export function useCurrency(): Currency {
  const clinicId = useCurrentClinicId();
  const clinics = useClinics();
  const clinic = clinics.find((c) => c.id === clinicId);
  const code = clinic?.currency as Currency | undefined;
  return code && SUPPORTED.has(code) ? code : "CRC";
}

// Actualiza la moneda de la clínica activa.
export function setCurrency(value: Currency) {
  updateClinic(getCurrentClinicId(), { currency: value });
}

export function getCurrencySymbol(c: Currency): string {
  return CURRENCIES.find((x) => x.value === c)?.symbol ?? "$";
}

const FORMAT_MAP: Record<Currency, { locale: string; decimals: number }> = {
  CRC: { locale: "es-CR", decimals: 0 },
  COP: { locale: "es-CO", decimals: 0 },
  CLP: { locale: "es-CL", decimals: 0 },
  PEN: { locale: "es-PE", decimals: 0 },
  USD: { locale: "en-US", decimals: 2 },
  MXN: { locale: "es-MX", decimals: 2 },
  ARS: { locale: "es-AR", decimals: 2 },
};

export function formatMoney(n: number, c: Currency = "CRC"): string {
  const safe = Number.isFinite(n) ? n : 0;
  const fmt = FORMAT_MAP[c] ?? FORMAT_MAP.CRC;
  return new Intl.NumberFormat(fmt.locale, {
    style: "currency",
    currency: c,
    minimumFractionDigits: fmt.decimals,
    maximumFractionDigits: fmt.decimals,
  }).format(safe);
}
