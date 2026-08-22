export type InsuranceFormatMode = "own-format" | "template-fill";

export interface InsuranceFormatDefinition {
  id: string;
  label: string;
  mode: InsuranceFormatMode;
}

export const InsuranceFormats: InsuranceFormatDefinition[] = [
  {
    id: "universal",
    label: "Formato universal CronosMD",
    mode: "own-format",
  },
  {
    id: "gnp",
    label: "GNP — Informe Médico GMM",
    mode: "template-fill",
  },
  {
    id: "axa",
    label: "AXA — Informe Médico GMM",
    mode: "template-fill",
  },
];
