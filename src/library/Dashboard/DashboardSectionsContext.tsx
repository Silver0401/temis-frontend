"use client";

import { createContext, useContext, useMemo } from "react";

import { DashboardSectionsByRole } from "./DashboardRegistry";

// Secciones visibles para el rol de la sesión. La SideNav las consume para
// filtrar el menú y `DashboardByRole` para decidir si la ruta está permitida.
const DashboardSectionsContext = createContext<DashboardStates[]>(
  DashboardSectionsByRole.medico,
);

// El rol de la sesión, para las pantallas que cambian de forma según quién entra.
const DashboardRoleContext = createContext<UserRole>("medico");

export const DashboardSectionsProvider = ({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) => {
  const sections = useMemo(
    () => DashboardSectionsByRole[role] ?? DashboardSectionsByRole.medico,
    [role],
  );

  return (
    <DashboardRoleContext.Provider value={role}>
      <DashboardSectionsContext.Provider value={sections}>
        {children}
      </DashboardSectionsContext.Provider>
    </DashboardRoleContext.Provider>
  );
};

export const useDashboardSections = () => useContext(DashboardSectionsContext);
export const useDashboardRole = () => useContext(DashboardRoleContext);
