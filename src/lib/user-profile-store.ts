import { useSyncExternalStore } from "react";

export type UserProfileData = {
  avatarUrl: string | null;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  emailRecuperacion: string;
  telefonoRecuperacion: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
};

const STORAGE_KEY = "vetcare_user_profile_data";

function getStoredProfile(): UserProfileData {
  if (typeof window === "undefined") {
    return {
      avatarUrl: null,
      nombre: "Alex",
      apellidos: "",
      email: "alex@mail.com",
      telefono: "8888-8888",
      emailRecuperacion: "alex@mail.com",
      telefonoRecuperacion: "8888-8888",
      pushEnabled: true,
      emailEnabled: true,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    /* fallback */
  }

  return {
    avatarUrl: null,
    nombre: "Alex",
    apellidos: "",
    email: "alex@mail.com",
    telefono: "8888-8888",
    emailRecuperacion: "alex@mail.com",
    telefonoRecuperacion: "8888-8888",
    pushEnabled: true,
    emailEnabled: true,
  };
}

let currentProfile: UserProfileData = getStoredProfile();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeProfile(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getProfileSnapshot(): UserProfileData {
  return currentProfile;
}

export function useUserProfile(): UserProfileData {
  return useSyncExternalStore(subscribeProfile, getProfileSnapshot, getProfileSnapshot);
}

export function updateUserProfile(patch: Partial<UserProfileData>) {
  currentProfile = { ...currentProfile, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentProfile));
  } catch (e) {
    console.error("Error saving profile to localStorage:", e);
  }
  emit();
}

export function fileToAvatarDataUrl(file: File, maxDim = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas context unavailable"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = () => reject(new Error("imagen inválida"));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

