// -------------------  Dashboard Data Constants -----------------

import IconsCC from "@/assets/icons/IconsCC";

export const DashboardStatesObject: DashboardStatesIndexed = {
  "My Patients": {
    Title: "Mis Pacientes",
    Subtitle: "asdfadsf",
    Route: "/dashboard",
    Icon: IconsCC.List3D,
  },
  Consents: {
    Title: "Consentimientos",
    Subtitle: "Emite y consulta consentimientos informados",
    Route: "/dashboard/consents",
    Icon: IconsCC.Document,
  },
  "My Team": {
    Title: "Mi Equipo",
    Subtitle: "Administra integrantes y pacientes asignados bajo tu tutela",
    Route: "/dashboard/myTeam",
    Icon: IconsCC.AddPerson,
  },
  "New Patient": {
    Title: "Nuevo Paciente",
    Subtitle: "asdfadsf",
    Route: "/dashboard/newPatient",
    Icon: IconsCC.AddPerson,
  },
  "Add Document": {
    Title: "Agregar Documento",
    Subtitle: "Agrega un documento al expediente de un paciente",
    Route: "/dashboard/addDocument",
    Icon: IconsCC.AddDocument,
  },
  "My Agenda": {
    Title: "Mi Agenda",
    Subtitle: "asdfadsf",
    Route: "/dashboard/myAgenda",
    Icon: IconsCC.Calendar,
  },
  "Admin Stats": {
    Title: "Estadísticas",
    Subtitle: "Indicadores por médico o por establecimiento",
    Route: "/dashboard/admin/stats",
    Icon: IconsCC.Statistics,
  },
  "Admin Patients": {
    Title: "Pacientes",
    Subtitle:
      "Buscador global de pacientes por médico, establecimiento y fecha",
    Route: "/dashboard/admin/patients",
    Icon: IconsCC.IdSearch,
  },
  "Admin Agendas": {
    Title: "Agendas",
    Subtitle: "Citas agendadas por médico o por establecimiento",
    Route: "/dashboard/admin/agendas",
    Icon: IconsCC.Calendar,
  },
};

// Qué secciones ve cada rol. Es la única fuente de verdad: la SideNav filtra
// con esto y `DashboardByRole` lo usa como guard de ruta.
export const DashboardSectionsByRole: Record<UserRole, DashboardStates[]> = {
  // "Add Document" y "Consents" van aquí aunque HIDDEN_STATES los saque del
  // menú: el guard de ruta de DashboardByRole expulsa cualquier ruta que no
  // esté en esta lista, y ambas siguen siendo alcanzables por URL.
  medico: [
    "My Patients",
    "My Team",
    "New Patient",
    "My Agenda",
    "Add Document",
    "Consents",
  ],
  // Enfermería levanta la ficha del paciente y lleva agenda; no navega el
  // listado de pacientes del tutor. "My Team" es para ella la bandeja de
  // invitaciones: una enfermera puede atender a uno o dos médicos.
  enfermeria: ["New Patient", "My Agenda", "My Team"],
  admin: ["Admin Patients", "Admin Stats", "Admin Agendas"],
};

// A dónde cae cada rol si entra a una ruta que no le corresponde.
export const RoleFallbackRoute: Record<UserRole, string> = {
  medico: DashboardStatesObject["My Patients"].Route,
  enfermeria: DashboardStatesObject["My Agenda"].Route,
  admin: DashboardStatesObject["Admin Patients"].Route,
};

export const GetDashboardSectionData = (type: DashboardStates) => {
  return {
    data: DashboardStatesObject[type],
    index: Object.keys(DashboardStatesObject)
      .map((key) => key)
      .indexOf(type),
  };
};
