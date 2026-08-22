"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  DashboardSectionsByRole,
  DashboardStatesObject,
  RoleFallbackRoute,
} from "./DashboardRegistry";
import { DashboardSectionsProvider } from "./DashboardSectionsContext";
import { resolveUserRole } from "./userRole";

// Acota el dashboard al rol de la sesión: publica las secciones permitidas y
// expulsa a la ruta de respaldo si el usuario cae en una que no le toca.
export default function DashboardByRole({
  user,
  children,
}: {
  user?: Pick<UserBasedSchema, "role"> | null;
  children: React.ReactNode;
}) {
  const role = resolveUserRole(user);
  const pathname = usePathname();
  const router = useRouter();
  const fallback = RoleFallbackRoute[role];

  const allowed = (DashboardSectionsByRole[role] ?? []).some((section) => {
    const route = DashboardStatesObject[section].Route;
    // "/dashboard" es prefijo de todo: solo cuenta como coincidencia exacta.
    return route === "/dashboard"
      ? pathname === route
      : pathname === route || pathname?.startsWith(`${route}/`);
  });

  useEffect(() => {
    if (!allowed && pathname !== fallback) router.replace(fallback);
  }, [allowed, pathname, fallback, router]);

  return (
    <DashboardSectionsProvider role={role}>
      {allowed ? children : null}
    </DashboardSectionsProvider>
  );
}
