import { SOMAS_FIELDS } from "@/scripts/somasFields";
// Functions that generate and return Components

import OrderPDF from "@/library/PDFlayouts/OrderPDF";
import PrescriptionPDF from "@/library/PDFlayouts/PrescriptionPDF";
import { pdf } from "@react-pdf/renderer";
import {
  formatAfiliaciones,
  stringToAfiliaciones,
} from "@/scripts/afiliaciones";

//  Grid Functions
interface GridProps {
  identifier: string;
  width: number;
  height: number;
  blocksSize?: "small" | "medium" | "large";
  opacity?: number;
}

export const GridGenerator: React.FC<GridProps> = ({
  width,
  height,
  opacity,
  identifier,
  blocksSize,
}) => {
  const blocks = [];
  // let index = 0;

  for (let c = 0; c < width; c++) {
    for (let i = 0; i < height; i++) {
      blocks.push(
        <div
          className={`block ${blocksSize ? blocksSize : ""}`}
          key={`${c}-${i}`}
        />,
      );
      // index++;
    }
  }

  return (
    <div
      className={`grid-CC ${identifier}Grid`}
      style={{ gridTemplateColumns: `repeat(${width}, 1fr)`, opacity: opacity }}
    >
      {blocks}
    </div>
  );
};

//  Date and Time Related Functions

/**
 * Convierte una fecha de nacimiento a Date. Acepta dd/mm/yyyy (formato de la
 * app) y también ISO yyyy-mm-dd, que es lo que llega de algunos catálogos.
 */
const parseBirthdate = (birthdate: string): Date | undefined => {
  if (!birthdate) return undefined;
  const raw = birthdate.trim();

  if (raw.includes("/")) {
    const [day, month, year] = raw.split("/").map((n) => parseInt(n, 10));
    if (!day || !month || !year) return undefined;
    // Los meses de Date son 0-based: sin el -1 la edad se corría un mes.
    return new Date(year, month - 1, day);
  }

  const iso = new Date(raw);
  return Number.isNaN(iso.getTime()) ? undefined : iso;
};

/** Edad exacta en años, meses y días cumplidos a la fecha actual. */
export const AgeDetailFromBirthdate = (
  birthdate: string,
): { years: number; months: number; days: number } | undefined => {
  const bod = parseBirthdate(birthdate);
  if (!bod) return undefined;

  const today = new Date();
  if (bod.getTime() > today.getTime()) return undefined;

  let years = today.getFullYear() - bod.getFullYear();
  let months = today.getMonth() - bod.getMonth();
  let days = today.getDate() - bod.getDate();

  if (days < 0) {
    // Días del mes anterior al actual, para pedirle prestado.
    months -= 1;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
};

/** Edad exacta en texto: "34 años, 2 meses y 11 días". */
export const AgeTextFromBirthdate = (birthdate: string): string => {
  const age = AgeDetailFromBirthdate(birthdate);
  if (!age) return "";

  const parts = [
    `${age.years} ${age.years === 1 ? "año" : "años"}`,
    `${age.months} ${age.months === 1 ? "mes" : "meses"}`,
    `${age.days} ${age.days === 1 ? "día" : "días"}`,
  ];

  return `${parts[0]}, ${parts[1]} y ${parts[2]}`;
};

export const AgeFromBirthdate = (birthdate: string) => {
  return AgeDetailFromBirthdate(birthdate)?.years ?? 0;
};

export const CurrentDate = (): string => {
  const today = new Date();

  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0"); // months are 0-based
  const year = today.getFullYear();

  return `${day}/${month}/${year}`;
};

export const ModifyDateFromLocalToUsStandard = (date: string): string => {
  return date.split("/").reverse().join("-");
};

export const MongoDbIdDateRetriever = (id: string): string => {
  const dateObject = new Date(parseInt(id.substring(0, 8), 16) * 1000);
  const Year = dateObject.getFullYear();
  const Month = dateObject.getMonth();
  const Day = dateObject.getDate();

  return `${Day}/${Month}/${Year}`;
};

export const MongoDbIdDateAndTimeRetriever = (id: string): string => {
  const dateObject = new Date(parseInt(id.substring(0, 8), 16) * 1000);
  const Year = dateObject.getFullYear();
  const Month = dateObject.getMonth() + 1;
  const Day = dateObject.getDate();
  const hours = dateObject.getHours();
  const minutes = dateObject.getMinutes();
  const seconds = dateObject.getSeconds();

  return `${Day}/${Month}/${Year} ${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export const IsFirstDateMoreRecentThanSecondDate = (
  firstDate: string,
  secondDate: string,
): boolean => {
  const firstDateModified = new Date(
    `${firstDate.split("/").reverse().join("-")}`,
  );
  const secondDateModified = new Date(
    `${secondDate.split("/").reverse().join("-")}`,
  );

  return secondDateModified < firstDateModified;
};

export const IsFirstDateWithTimeMoreRecentThanSecondDate = (
  firstDate: string,
  secondDate: string,
): boolean => {
  const parseDateString = (dateStr: string): Date => {
    const [datePart, timePart] = dateStr.split(" ");
    const [day, month, year] = datePart.split("/").map(Number);
    const [hours, minutes, seconds] = timePart.split(":").map(Number);
    // Note: month - 1 because JS months are 0–11
    return new Date(year, month - 1, day, hours, minutes, seconds);
  };

  const now = new Date();
  const d1 = parseDateString(firstDate);
  const d2 = parseDateString(secondDate);

  return d1.getTime() > d2.getTime();

  // if () {
  //   return `${dateStr1} is more recent than ${dateStr2}`;
  // } else if (d2.getTime() > d1.getTime()) {
  //   return `${dateStr2} is more recent than ${dateStr1}`;
  // } else {
  //   return `Both dates are equal`;
  // }
};

//  Base 64 Functions

export const FiletoBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const newBlob = new Blob([file], { type: file.type });
    const reader = new FileReader();
    reader.readAsDataURL(newBlob);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

export function base64ToFile(base64String: string, fileName: string): File {
  const arr = base64String.split(",");
  const match = arr[0].match(/:(.*?);/);
  const mime = match ? match[1] : "application/octet-stream"; // fallback
  const bstr = atob(arr[arr.length - 1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], fileName, { type: mime });
}

//  Clinical History, String Mods and Regex Related Functions

export const ClinicalHistorySectionFromText = (
  clinicalHistory: string,
  textIndex: number,
): string => {
  const ClinicalHistorySections = [
    { name: "| Ficha de Identificación |", tuple: [0, 0] },
    { name: "| Antecedentes Heredofamiliares |", tuple: [0, 0] },
    { name: "| Antecedentes Gineco-Obstétricos |", tuple: [0, 0] },
    { name: "| Antecedentes Personales No Patológicos |", tuple: [0, 0] },
    { name: "| Antecedentes Personales Patológicos |", tuple: [0, 0] },
    {
      name: "| Padecimiento, Evolución y Estado Actual |",
      tuple: [0, 0],
    },
    { name: "| Interrogatorio por Aparatos y Sistemas |", tuple: [0, 0] },
    { name: "| Exploración Física |", tuple: [0, 0] },
  ];

  // Find the actual Indexes and save them to the Tuples
  const IndexedSections = ClinicalHistorySections.map((section) => {
    return {
      ...section,
      tuple: [
        clinicalHistory.indexOf(section.name),
        clinicalHistory.indexOf(section.name) + section.name.length,
      ],
    };
  });

  // Sort Sections in Order (according to the clinical History)
  IndexedSections.sort((sectionA, sectionB) => {
    if (sectionA.tuple[0] < sectionB.tuple[0]) {
      return -1;
    } else if (sectionA.tuple[0] > sectionB.tuple[0]) {
      return 1;
    } else {
      return 0;
    }
  });

  const FilteredSection = IndexedSections.filter((section, index) => {
    const prevSection =
      IndexedSections[
        index === 0
          ? 0
          : index === IndexedSections.length
            ? IndexedSections.length
            : index - 1
      ].tuple;
    const currentSection = section.tuple;

    if (index === 0) {
      const nextSection = IndexedSections[index + 1].tuple;
      if (textIndex > currentSection[1] && textIndex < nextSection[0]) {
        return section;
      }
    }

    if (index + 1 === IndexedSections.length) {
      if (textIndex > currentSection[1]) {
        return section;
      }
    }
    if (textIndex > prevSection[1] && textIndex < currentSection[0]) {
      return section;
    }
  });

  // console.log(textIndex);
  // console.log(FilteredSection);
  // console.log(IndexedSections);

  return `${FilteredSection[0]?.name}`;
};

export function splitByIdentification(history: string): {
  identification: string;
  rest: string;
} {
  // Encuentra la línea exacta del encabezado de la ficha (tolerando espacios y ó/ o)
  const headerRe = /^\s*\|\s*Ficha\s+de\s+Identificaci[oó]n\s*\|\s*$/im;
  const headerMatch = headerRe.exec(history);

  if (!headerMatch) {
    // Si no hay ficha, devolvemos todo en "rest"
    return { identification: "", rest: history.trim() };
  }

  // Índice donde termina la línea del encabezado
  const startIdx = headerMatch.index;

  // Buscamos el inicio de la SIGUIENTE sección "| Algo |" DESPUÉS del encabezado
  // Nota: [^\n|]+ = cualquier título hasta el fin de línea, ignorando barras verticales
  const nextSectionRe = /\n\s*\|\s*[^\n|]+\s*\|\s*\n/gi;
  nextSectionRe.lastIndex = headerMatch.index + headerMatch[0].length;

  const nextMatch = nextSectionRe.exec(history);

  // Delimitamos el bloque de identificación
  const endIdx = nextMatch
    ? nextMatch.index + 1 /* mantener salto previo */
    : history.length;

  const identification = history.slice(startIdx, endIdx).trim();

  // "rest" = todo antes + todo después del bloque
  const rest = (history.slice(0, startIdx) + history.slice(endIdx)).trim();

  return { identification, rest };
}

export const CapitalizeSentence = (sentence: string | undefined): string => {
  if (!sentence) return "";
  return sentence[0].toUpperCase() + sentence.slice(1).toLowerCase();
};

const escapeForCharClass = (str: string): string =>
  str.replace(/[-\]\\^]/g, "\\$&");

export const validateInputField = (
  value: string,
  v: InputValidations,
): string | null | undefined => {
  const val = v.trim !== false ? value.trim() : value;
  if (val.length === 0) return null;

  if (v.minLength !== undefined && val.length < v.minLength) {
    return `Mínimo ${v.minLength} caracteres`;
  }
  if (v.maxLength !== undefined && val.length > v.maxLength) {
    return `Máximo ${v.maxLength} caracteres`;
  }
  if (v.allowedSpecials !== undefined) {
    const escaped = escapeForCharClass(v.allowedSpecials);
    if (!new RegExp(`^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ${escaped}]+$`).test(val)) {
      return v.allowedSpecials.length > 0
        ? `Solo letras (A-Z, Ñ, acentos) y los caracteres: ${v.allowedSpecials}`
        : "Solo letras (A-Z, Ñ, acentos)";
    }
  }
  if (v.noConsecutiveSpecials && v.allowedSpecials) {
    const escaped = escapeForCharClass(v.allowedSpecials);
    if (new RegExp(`[${escaped}]{2,}`).test(val)) {
      return "No se permiten dos caracteres especiales consecutivos";
    }
  }
  if (v.isDate) {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      return "Formato de fecha inválido (DD/MM/AAAA)";
    }
    const [day, month, year] = val.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return "Fecha inválida";
    }
    if (v.notFuture && date > new Date()) {
      return "La fecha no puede ser futura";
    }
    if (v.maxAgeYears !== undefined) {
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - v.maxAgeYears);
      if (date < minDate) {
        return `La edad no puede ser mayor a ${v.maxAgeYears} años`;
      }
    }
    return null;
  }
  if (v.pattern !== undefined && !new RegExp(`^${v.pattern}$`).test(val)) {
    return v.patternMessage ?? "Formato inválido";
  }
  return null;
};

// Returns ALL failing validation messages (for the error-icon tooltip).
// Empty array = valid (or empty value, which is treated as neutral).
export const validateInputFieldAll = (
  value: string,
  v: InputValidations,
): string[] => {
  const val = v.trim !== false ? value.trim() : value;
  if (val.length === 0) return [];

  const errors: string[] = [];

  if (v.minLength !== undefined && val.length < v.minLength) {
    errors.push(`Mínimo ${v.minLength} caracteres`);
  }
  if (v.maxLength !== undefined && val.length > v.maxLength) {
    errors.push(`Máximo ${v.maxLength} caracteres`);
  }
  if (v.allowedSpecials !== undefined) {
    const escaped = escapeForCharClass(v.allowedSpecials);
    if (!new RegExp(`^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ${escaped}]+$`).test(val)) {
      errors.push(
        v.allowedSpecials.length > 0
          ? `Solo letras (A-Z, Ñ, acentos) y los caracteres: ${v.allowedSpecials}`
          : "Solo letras (A-Z, Ñ, acentos)",
      );
    }
  }
  if (v.noConsecutiveSpecials && v.allowedSpecials) {
    const escaped = escapeForCharClass(v.allowedSpecials);
    if (new RegExp(`[${escaped}]{2,}`).test(val)) {
      errors.push("No se permiten dos caracteres especiales consecutivos");
    }
  }
  if (v.isDate) {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      errors.push("Formato de fecha inválido (DD/MM/AAAA)");
    } else {
      const [day, month, year] = val.split("/").map(Number);
      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        errors.push("Fecha inválida");
      } else {
        if (v.notFuture && date > new Date()) {
          errors.push("La fecha no puede ser futura");
        }
        if (v.maxAgeYears !== undefined) {
          const minDate = new Date();
          minDate.setFullYear(minDate.getFullYear() - v.maxAgeYears);
          if (date < minDate) {
            errors.push(`La edad no puede ser mayor a ${v.maxAgeYears} años`);
          }
        }
      }
    }
  }

  return errors;
};

export const patientIdentificationToAIContext = (
  id: PatientIdentification,
): string => {
  const domicilioStr = id.domicilioLocalizacion
    ? [
        id.domicilioLocalizacion.localidad?.nombre,
        id.domicilioLocalizacion.municipio?.nombre,
        id.domicilioLocalizacion.estado?.nombre,
        id.domicilioLocalizacion.pais?.nombre,
        id.domicilioLocalizacion.calle,
        id.domicilioLocalizacion.colonia,
      ]
        .filter(Boolean)
        .join(", ")
    : id.domicile;
  return [
    `Nombre: ${id.names} ${id.middleName} ${id.lastName}`,
    `Fecha Nac: ${id.birthDate}`,
    `Sexo: ${id.sex}`,
    `Lugar Nac: ${id.birthPlace}`,
    domicilioStr ? `Domicilio: ${domicilioStr}` : null,
    `Género: ${id.genre}`,
    `Derechohabiencia: ${formatAfiliaciones(id.derechohabiencia)}`,
    `CURP: ${id.curp}`,
    id.tel ? `Tel: ${id.tel}` : null,
    id.estadoCivil ? `Estado Civil: ${id.estadoCivil}` : null,
    id.ocupacion ? `Ocupación: ${id.ocupacion}` : null,
    id.escolaridad ? `Escolaridad: ${id.escolaridad}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
};

export const ValueCHExtraction = (texto: string, campo: string): string => {
  const regex = new RegExp(`-\\s*${campo}\\s*:\\s*(.+)`, "i");
  const match = texto.match(regex);
  return match ? match[1].trim() : "";
};

export const SplitNameIntoComponents = (
  fullName: string,
): {
  names: string;
  middleName: string;
  lastName: string;
} | null => {
  const fullNameSplit = fullName.trim().split(" ");

  if (fullNameSplit.length < 3) return null;

  if (fullNameSplit.length === 3) {
    return {
      names: fullNameSplit[0],
      middleName: fullNameSplit[1],
      lastName: fullNameSplit[2],
    };
  } else if (fullNameSplit.length === 4) {
    if (fullNameSplit[1].length <= 3 || fullNameSplit[2].length <= 3) {
      return {
        names: fullNameSplit[0],
        middleName: `${fullNameSplit[1]} ${fullNameSplit[2]}`,
        lastName: fullNameSplit[3],
      };
    } else {
      return {
        names: `${fullNameSplit[0]} ${fullNameSplit[1]}`,
        middleName: fullNameSplit[2],
        lastName: fullNameSplit[3],
      };
    }
  } else {
    return {
      names: fullNameSplit[0],
      middleName: fullNameSplit.slice(2, fullNameSplit.length - 1).join(" "),
      lastName: fullNameSplit[fullNameSplit.length - 1],
    };
  }
};

export const SynthesyzeTemporalPatient = (
  clinicalHistoryText: string,
): Patient => {
  return {
    LUID: "synthesized-temporal-patient",
    _id: "none",
    personalInfo: {
      names:
        SplitNameIntoComponents(
          ValueCHExtraction(clinicalHistoryText, "Nombre"),
        )?.names || "",
      middleName:
        SplitNameIntoComponents(
          ValueCHExtraction(clinicalHistoryText, "Nombre"),
        )?.middleName || "",
      lastName:
        SplitNameIntoComponents(
          ValueCHExtraction(clinicalHistoryText, "Nombre"),
        )?.lastName || "",
      birthDate: ValueCHExtraction(clinicalHistoryText, "Nac"),
      curp: ValueCHExtraction(clinicalHistoryText, "CURP"),
      sex: ValueCHExtraction(clinicalHistoryText, "sexo") as Sex,
      derechohabiencia: stringToAfiliaciones(
        ValueCHExtraction(clinicalHistoryText, "Derechohabiencia"),
      ),
      genre: ValueCHExtraction(clinicalHistoryText, "Género"),
      domicile: ValueCHExtraction(clinicalHistoryText, "Domicilio"),
      birthPlace: ValueCHExtraction(clinicalHistoryText, "Lugar de Nac"),
    },
    localizacion: {},
    records: [],
  };
};

//  CURP Validation (DM-01 a DM-06, CE-08)
export {
  ValidateCURP,
  calculateCURPVerifier,
  curpStateCodeFromCatalogKey,
  validateBirthDate,
} from "./curp";
export type { CURPValidationResult } from "./curp";

//  PDF Creators / Generators
export const PrintPDFPrescription = async (
  prescriptionProps: PrescriptionProps,
  qrCodeString: string,
) => {
  const blob = await pdf(
    <PrescriptionPDF {...prescriptionProps} qr={qrCodeString} />,
  ).toBlob();
  const url = URL.createObjectURL(blob);

  const newWindow = window.open(url);
  if (newWindow) {
    newWindow.onload = () => {
      newWindow.print();
    };
  }
};

export const PrintPDFOrder = async (
  ordProps: OrdersProps,
  qrCodeString: string,
) => {
  const blob = await pdf(<OrderPDF {...ordProps} qr={qrCodeString} />).toBlob();
  const url = URL.createObjectURL(blob);

  const newWindow = window.open(url);
  if (newWindow) {
    newWindow.onload = () => {
      newWindow.print();
    };
  }
};

//  Labs Related Functions

/**
 * Serie por parámetro para las gráficas del expediente.
 *
 * Los somas ya no guardan un arreglo con nombre y unidad por medición: guardan
 * números con clave fija, y el diccionario vive en `SOMAS_FIELDS`. Se omiten los
 * parámetros sin ninguna medición para no pintar gráficas vacías.
 */
export function FormatSomasData(
  data: SomasResponse[] | null | undefined,
): Array<Record<string, LabSomaEntry>> {
  if (!Array.isArray(data) || data.length === 0) return [];

  return SOMAS_FIELDS.map((field) => {
    const list = data
      .filter((entry) => entry.values?.[field.key] != null)
      .map((entry) => ({
        dateTaken: entry.dateTaken,
        value: String(entry.values[field.key]),
      }));

    return list.length
      ? { [`${field.label} (${field.unit})`]: { name: field.fullName, list } }
      : null;
  }).filter(Boolean) as Array<Record<string, LabSomaEntry>>;
}

export function FormatLabsData(
  data: LabSomaResponse[] | null | undefined,
): Array<Record<string, LabSomaEntry>> {
  if (!Array.isArray(data)) return [];

  const JoinedLabsObject: LabSomaIndexed = {};

  // Find The Largest Set of Labs for the Base Array Values
  const largestLabList = [...data].sort((labVal1, labVal2) => {
    if (labVal1.values.length > labVal2.values.length) {
      return -1;
    } else if (labVal1.values.length < labVal2.values.length) {
      return 1;
    } else {
      return 0;
    }
  })[0];

  // Map every Abbreviation as Key and its inital empty List
  largestLabList?.values.forEach((labVal) => {
    JoinedLabsObject[labVal.abreviation] = {
      name: labVal.fullName,
      list: [],
    };
  });

  // Map every Abbreviation as Key and add its value
  data.map((labEntry) => {
    labEntry.values.map((labVal) => {
      if (JoinedLabsObject[labVal.abreviation])
        JoinedLabsObject[labVal.abreviation] = {
          ...JoinedLabsObject[labVal.abreviation],
          list: [
            ...JoinedLabsObject[labVal.abreviation].list,
            { dateTaken: labEntry.dateTaken, value: labVal.value },
          ],
        };
    });
  });

  const LabsToBeReturned = Object.entries(
    JoinedLabsObject,
  ) as unknown as Record<string, LabSomaEntry>[];

  // console.log(LabsToBeReturned);

  return LabsToBeReturned;
}
