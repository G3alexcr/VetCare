import { type ReactNode } from "react";
import { useAuth } from "./auth";
import {
  hasPermission,
  mapLegacyRoleToRoleId,
  useRoles,
  type RbacAction,
  type RbacModule,
} from "./rbac-store";

export function useCurrentRoleId(): string | undefined {
  const { user } = useAuth();
  useRoles(); // re-render on role changes
  if (!user) return undefined;
  return mapLegacyRoleToRoleId(user.role);
}

export function useCan() {
  const roleId = useCurrentRoleId();
  return (mod: RbacModule, action: RbacAction = "view") => hasPermission(roleId, mod, action);
}

export function Can({
  module: mod,
  action = "view",
  children,
  fallback = null,
}: {
  module: RbacModule;
  action?: RbacAction;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const can = useCan();
  return <>{can(mod, action) ? children : fallback}</>;
}
