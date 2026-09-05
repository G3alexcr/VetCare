import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { WebsiteStudio } from "@/components/website-studio/WebsiteStudio";

export const Route = createFileRoute("/_app/website")({
  component: () => (
    <AppLayout fullHeight>
      <WebsiteStudio />
    </AppLayout>
  ),
});
