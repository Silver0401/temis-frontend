// Resolve the access role of a user. Legacy accounts without the field are
// treated as "medico" so existing logins keep the current dashboard.
export const resolveUserRole = (
  user?: Pick<UserBasedSchema, "role"> | null,
): UserRole => user?.role ?? "medico";

export const RoleLabels: Record<UserRole, string> = {
  medico: "Médico",
  enfermeria: "Enfermería",
  admin: "Administrador",
};
