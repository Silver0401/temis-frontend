import React from "react";
import { pdf } from "@react-pdf/renderer";
import InsuranceReportPDF, {
  InsuranceReport,
} from "@/library/PDFlayouts/InsuranceReportPDF";
import { InsuranceFormatDefinition } from "@/assets/insurance-forms/registry";

type TemplateMapEntry =
  | string
  | { acroForm: string }
  | { acroFieldName: string }
  | { page: number; x: number; y: number; fontSize?: number };

const valueAtPath = (report: InsuranceReport, path: string): string => {
  const values = path.split(".").reduce<unknown[]>((current, key) => {
    const isArray = key.endsWith("[]");
    const property = isArray ? key.slice(0, -2) : key;

    return current.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const value = (item as Record<string, unknown>)[property];
      return isArray && Array.isArray(value) ? value : [value];
    });
  }, [report]);

  return values
    .filter((value) => value != null && value !== "")
    .map(String)
    .join(", ");
};

const normalizeOption = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^\//, "")
    .trim()
    .toLowerCase();

const fillAcroField = (form: any, fieldName: string, value: string): void => {
  const field = form.getField(fieldName);

  if (typeof field.setText === "function") {
    field.setText(value);
    return;
  }

  if (
    typeof field.getOptions === "function" &&
    typeof field.select === "function"
  ) {
    if (!value && typeof field.clear === "function") {
      field.clear();
      return;
    }

    const normalizedValue = normalizeOption(value);
    const option = field.getOptions().find((candidate: string) => {
      const normalizedCandidate = normalizeOption(candidate);
      return (
        normalizedCandidate === normalizedValue ||
        (normalizedCandidate.length === 1 &&
          normalizedValue.startsWith(normalizedCandidate))
      );
    });

    if (!option) {
      throw new Error(`El valor "${value}" no es válido para ${fieldName}`);
    }

    field.select(option);
    return;
  }

  if (typeof field.check === "function") {
    const normalizedValue = normalizeOption(value);
    if (["", "0", "false", "no", "off"].includes(normalizedValue)) {
      field.uncheck();
    } else {
      field.check();
    }
    return;
  }

  throw new Error(`El campo ${fieldName} no admite relleno automático`);
};

const fillOfficialTemplate = async (
  report: InsuranceReport,
  format: InsuranceFormatDefinition,
): Promise<Blob> => {
  try {
    // @ts-ignore pdf-lib is intentionally optional until an official template is enabled.
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const mapModule = await import(
      `../assets/insurance-forms/${format.id}.map.json`
    );
    const templateUrl = new URL(
      `../assets/insurance-forms/${format.id}.pdf`,
      import.meta.url,
    );
    const templateResponse = await fetch(templateUrl);
    if (!templateResponse.ok) throw new Error("No se encontró el PDF oficial");

    const document = await PDFDocument.load(
      await templateResponse.arrayBuffer(),
    );
    const font = await document.embedFont(StandardFonts.Helvetica);
    const fieldMap = (mapModule.default ?? mapModule) as Record<
      string,
      TemplateMapEntry
    >;
    const form = document.getForm();

    Object.entries(fieldMap).forEach(([field, target]) => {
      const value = valueAtPath(report, field);
      if (
        typeof target === "string" ||
        "acroForm" in target ||
        "acroFieldName" in target
      ) {
        const fieldName =
          typeof target === "string"
            ? target
            : "acroFieldName" in target
              ? target.acroFieldName
              : target.acroForm;
        fillAcroField(form, fieldName, value);
        return;
      }

      const pageIndex = target.page > 0 ? target.page - 1 : 0;
      document.getPages()[pageIndex]?.drawText(value, {
        x: target.x,
        y: target.y,
        size: target.fontSize ?? 10,
        font,
        color: rgb(0, 0, 0),
      });
    });

    form.updateFieldAppearances(font);
    const bytes = await document.save();
    return new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "error desconocido";
    throw new Error(
      `No se pudo rellenar el formato oficial. Verifica que pdf-lib, el PDF y su map.json estén disponibles (${reason}).`,
    );
  }
};

export const FillInsuranceReport = async (
  report: InsuranceReport,
  format: InsuranceFormatDefinition,
): Promise<Blob> => {
  if (format.mode === "own-format") {
    const document = React.createElement(InsuranceReportPDF, {
      report,
    }) as Parameters<typeof pdf>[0];
    return pdf(document).toBlob();
  }

  return fillOfficialTemplate(report, format);
};
