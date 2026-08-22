// Formas que devuelve el servicio `admin-console` del backend.

export type AdminDoctor = {
  _id: string;
  name: string;
  email: string;
  clues: string[];
  patientsCount: number;
};

export type AdminPatientRow = {
  _id: string;
  LUID?: string;
  names: string;
  middleName: string;
  lastName: string;
  curp: string;
  sex: string;
  birthDate: string;
  clues: string[];
  registeredAt: string;
  doctorName: string | null;
};

export type AdminPatientsResponse = {
  total: number;
  limit: number;
  skip: number;
  rows: AdminPatientRow[];
};

export type AdminStatsResponse = {
  /** Año al que pertenece el mes consultado; encabeza la serie anual. */
  anio: number;
  /** Consultas del mes anterior, para la comparación. null si no hay mes fijado. */
  previousMonthConsultas: number | null;
  totals: {
    consultas: number;
    pacientes: number;
    recetas: number;
    farmacosRecetados: number;
    solicitudes: number;
    somatometrias: number;
  };
  /** Fármacos recetados en el periodo, de mayor a menor. */
  drugs: Array<{ name: string; count: number }>;
  /** Diagnósticos CIE-10 del periodo, de mayor a menor. */
  diagnoses: Array<{ cie: string; name: string; count: number }>;
  /** Doce meses del año, incluidos los que van en cero. */
  months: Array<{ month: number; count: number }>;
};

export type AdminAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  startDate: string;
  endDate: string;
  doctorId: string;
  doctorName: string;
  clues: string[];
};

export type AdminAgendasResponse = {
  total: number;
  /** Médicos presentes en el resultado; dan la leyenda y el color por dueño. */
  doctors: Array<{ _id: string; name: string }>;
  rows: AdminAppointment[];
};
