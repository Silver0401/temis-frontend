"use client";

import { useEffect, useState } from "react";

import { useGlobalContext } from "@/e2e/globalContext";

// Una enfermera atiende normalmente a uno o dos médicos. `tutorId` singular es
// la forma vieja del vínculo: las cuentas creadas antes del multi-tutor todavía
// lo traen, así que toda lectura pasa por aquí.
export const resolveTutorIds = (
  user?: Pick<UserBasedSchema, "tutorId" | "tutorIds"> | null,
): string[] => {
  const plural = user?.tutorIds ?? [];
  const legacy = user?.tutorId ? [user.tutorId] : [];
  return [...new Set([...plural, ...legacy])];
};

export type TutorOption = { _id: string; name: string };

/**
 * Médico destino de una escritura de enfermería.
 *
 * Leer pacientes es la unión de todos sus médicos, pero escribir no puede
 * serlo: el registro queda a nombre de UN médico. Con un solo tutor se elige
 * solo y no se le pregunta nada; con dos o más hay que elegir, y el backend
 * rechaza la petición si no viene `tutorId`.
 */
export const useTutorTarget = (enabled: boolean) => {
  const { feathersFetchCC } = useGlobalContext();
  const [tutors, setTutors] = useState<TutorOption[]>([]);
  const [tutorId, setTutorId] = useState<string>();

  useEffect(() => {
    if (!enabled) return;
    void (async () => {
      const response = await feathersFetchCC<TutorOption[]>({
        service: "medical-team",
        method: "get",
        // `get` no tiene recurso propio: el id es la palabra clave que el
        // servicio usa para devolver los médicos de quien consulta.
        data: "tutors",
        logId: "medical_team_tutors_listed",
        nonLoggable: true,
      });
      if (response.type !== "success") return;
      setTutors(response.data);
      if (response.data.length === 1) setTutorId(response.data[0]._id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { tutors, tutorId, setTutorId, mustChoose: enabled && tutors.length > 1 };
};
