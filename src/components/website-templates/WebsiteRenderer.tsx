import React from "react";
import { GovetRenderer } from "./GovetRenderer";
import { WelfareEliteRenderer } from "./WelfareEliteRenderer";
import { SmartVetRenderer } from "./SmartVetRenderer";
import { MedicaZooRenderer } from "./MedicaZooRenderer";
import { VetCatRenderer } from "./VetCatRenderer";
import { PetClinicProRenderer } from "./PetClinicProRenderer";
import { ModernPetcareRenderer } from "./ModernPetcareRenderer";
import BoutiqueSpaRenderer from "./BoutiqueSpaRenderer";
import type { WebsiteSettings, WebsiteService, WebsiteSlide, WebsiteGroupItem, WebsiteTestimonial, WebsiteGalleryItem, WebsitePost } from "@/lib/website-store";

interface Props {
  settings: WebsiteSettings;
  services: WebsiteService[];
  slides: WebsiteSlide[];
  clinic: { name: string; logo_url: string } | null;
  team: WebsiteGroupItem[];
  testimonials: WebsiteTestimonial[];
  gallery: WebsiteGalleryItem[];
  posts: WebsitePost[];
}

export function WebsiteRenderer(props: Props) {
  switch (props.settings.template_id) {
    case "govet": return <GovetRenderer {...props} />;
    case "welfare-elite": return <WelfareEliteRenderer {...props} />;
    case "smartvet-center": return <SmartVetRenderer {...props} />;
    case "medica-zoo": return <MedicaZooRenderer {...props} />;
    case "vetcat-warm": return <VetCatRenderer {...props} />;
    case "petclinic-pro": return <PetClinicProRenderer {...props} />;
    case "modern-petcare": return <ModernPetcareRenderer {...props} />;
    case "boutique-spa": return <BoutiqueSpaRenderer {...props} />;
    default: return <WelfareEliteRenderer {...props} />;
  }
}
