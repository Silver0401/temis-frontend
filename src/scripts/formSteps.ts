/**
 * Cálculo de pasos de un formulario a partir del número de inputs.
 *
 * Mismo criterio que el embudo del backend (`guide-router/merge.ts`), para que
 * un formulario estático y uno generado por el router se partan igual.
 *
 * Menos de 5 inputs: sin pasos, se pintan todos juntos.
 * De 5 en adelante: trozos de ~5, que es lo que FormCC respeta al hacer
 * Math.ceil(length / steps). El mínimo de 2 evita que una lista de 5 o 6 quede
 * en un solo paso pese a haber cruzado el umbral.
 *
 * Ejemplos: 5→2 (3 y 2), 6→2 (3 y 3), 10→2 (5 y 5), 15→3 (5 por paso),
 * 20→4 (5 por paso).
 */
const INPUTS_POR_PASO = 5;
const MINIMO_PARA_PARTIR = 5;

export const calcularSteps = (length: number): number | undefined => {
  if (length < MINIMO_PARA_PARTIR) return undefined;
  return Math.max(2, Math.ceil(length / INPUTS_POR_PASO));
};
