import { createFileRoute, redirect } from "@tanstack/react-router";

/** /portal/login ya no existe como página separada — todo va por /login */
export const Route = createFileRoute("/portal/login")({
  beforeLoad: ({ search }: { search: Record<string, unknown> }) => {
    throw redirect({ to: "/login", search, replace: true });
  },
  component: () => null,
});
