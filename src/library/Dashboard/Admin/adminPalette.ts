/**
 * Paleta categórica de las vistas de administración.
 *
 * Validada con el verificador de la guía de datos contra la superficie real de
 * Temis (`#001409`, modo oscuro): banda de luminosidad, piso de croma,
 * separación bajo daltonismo (peor par ΔE 13.2) y contraste ≥ 3:1. Verde
 * primero porque es la identidad de la app.
 *
 * Seis ranuras y nada más: un séptimo tono generado sería indistinguible de
 * alguno de estos bajo daltonismo. La cola se pliega en "Otros", en gris.
 */
export const ADMIN_SERIES = [
  "#199e70",
  "#3987e5",
  "#d55181",
  "#c98500",
  "#9085e9",
  "#d95926",
];

/** "Otros" no es una categoría, es el resto: gris, nunca un tono de la serie. */
export const ADMIN_OTHER = "#6f7d75";

/** Color estable por posición en una lista (médicos de la agenda, p. ej.). */
export const seriesColor = (index: number) =>
  ADMIN_SERIES[index % ADMIN_SERIES.length];
