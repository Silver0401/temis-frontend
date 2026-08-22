export interface CURPValidationResult {
  valid: boolean;
  errors: Partial<{
    formato: string;
    primerApellido: string;
    segundoApellido: string;
    nombre: string;
    fechaNacimiento: string;
    sexo: string;
    entidadNacimiento: string;
    consonantes: string;
    siglo: string;
    verificador: string;
  }>;
}

const CURP_PARTICLES = new Set([
  "DA", "DAS", "DE", "DEL", "DER", "DI", "DIE", "DD", "EL", "LA",
  "LAS", "LE", "LES", "LOS", "MAC", "MC", "VAN", "VON", "Y",
]);

const COMMON_FIRST_NAMES = new Set(["MARIA", "MA", "JOSE", "J"]);

const INCONVENIENT_WORDS = new Set([
  "BACA", "BAKA", "BUEI", "BUEY", "CACA", "CACO", "CAGA", "CAGO",
  "CAKA", "CAKO", "COGE", "COGI", "COJA", "COJE", "COJI", "COJO",
  "COLA", "CULO", "FALO", "FETO", "GETA", "GUEI", "GUEY", "JETA",
  "JOTO", "KACA", "KACO", "KAGA", "KAGO", "KAKA", "KAKO", "KOGE",
  "KOGI", "KOJA", "KOJE", "KOJI", "KOJO", "KOLA", "KULO", "LILO",
  "LOCA", "LOCO", "LOKA", "LOKO", "MAME", "MAMO", "MEAR", "MEAS",
  "MEON", "MIAR", "MION", "MOCO", "MOKO", "MULA", "MULO", "NACA",
  "NACO", "PEDA", "PEDO", "PENE", "PIPI", "PITO", "POPO", "PUTA",
  "PUTO", "QULO", "RATA", "ROBA", "ROBE", "ROBO", "RUIN", "SENO",
  "TETA", "VACA", "VAGA", "VAGO", "VAKA", "VUEI", "VUEY", "WUEI",
  "WUEY",
]);

export const CURP_STATE_CODES = [
  "AS", "BC", "BS", "CC", "CL", "CM", "CS", "CH", "DF", "DG", "GT",
  "GR", "HG", "JC", "MC", "MN", "MS", "NT", "NL", "OC", "PL", "QT",
  "QR", "SP", "SL", "SR", "TC", "TS", "TL", "VZ", "YN", "ZS",
] as const;

const VALID_STATE_CODES = new Set<string>([...CURP_STATE_CODES, "NE"]);
const VOWELS = new Set(["A", "E", "I", "O", "U"]);

const normalizeForCURP = (value: string): string =>
  value
    .toUpperCase()
    .replace(/[ÁÀÄÂ]/g, "A")
    .replace(/[ÉÈËÊ]/g, "E")
    .replace(/[ÍÌÏÎ]/g, "I")
    .replace(/[ÓÒÖÔ]/g, "O")
    .replace(/[ÚÙÜÛ]/g, "U")
    .replace(/[^A-ZÑ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const meaningfulWords = (value: string): string[] => {
  const words = normalizeForCURP(value).split(" ").filter(Boolean);
  const withoutParticles = words.filter((word) => !CURP_PARTICLES.has(word));
  return withoutParticles.length > 0 ? withoutParticles : words;
};

const surnameWord = (value: string): string => meaningfulWords(value)[0] ?? "";

const effectiveName = (value: string): string => {
  const words = meaningfulWords(value);
  if (words.length > 1 && COMMON_FIRST_NAMES.has(words[0])) return words[1];
  return words[0] ?? "";
};

const safeLetter = (letter: string | undefined): string =>
  letter && letter !== "Ñ" && /^[A-Z]$/.test(letter) ? letter : "X";

const firstInternalVowel = (word: string): string =>
  word.slice(1).split("").find((letter) => VOWELS.has(letter)) ?? "X";

const firstInternalConsonant = (word: string): string => {
  const consonant = word
    .slice(1)
    .split("")
    .find((letter) => /^[A-ZÑ]$/.test(letter) && !VOWELS.has(letter));
  return safeLetter(consonant);
};

const parseDate = (value: string): Date | null => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null;
  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) return null;
  return date;
};

export const validateBirthDate = (
  value: string,
  today = new Date(),
): string | null => {
  const date = parseDate(value);
  if (!date) return "La fecha de nacimiento debe ser real y usar DD/MM/AAAA";
  const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (date > currentDay) return "La fecha de nacimiento no puede ser futura";
  const oldestAllowed = new Date(
    currentDay.getFullYear() - 120,
    currentDay.getMonth(),
    currentDay.getDate(),
  );
  if (date < oldestAllowed) return "La edad no puede ser mayor a 120 años";
  return null;
};

const sexCode = (sex: string): string => {
  const normalized = normalizeForCURP(sex);
  if (["H", "HOMBRE", "MASC", "MASCULINO"].includes(normalized)) return "H";
  if (["M", "MUJER", "FEM", "FEMENINO"].includes(normalized)) return "M";
  return "";
};

const CURP_DICTIONARY = "0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";

export const calculateCURPVerifier = (curp17: string): number => {
  let sum = 0;
  for (let index = 0; index < 17; index++) {
    const value = CURP_DICTIONARY.indexOf(curp17[index]);
    if (value < 0) return -1;
    sum += value * (18 - index);
  }
  return (10 - (sum % 10)) % 10;
};

export const curpStateCodeFromCatalogKey = (
  catalogKey?: number,
): string | undefined =>
  catalogKey && catalogKey >= 1 && catalogKey <= CURP_STATE_CODES.length
    ? CURP_STATE_CODES[catalogKey - 1]
    : undefined;

/** Valida una CURP real contra los datos fuente usados para conformarla. */
export const ValidateCURP = (
  curp: string,
  nombre: string,
  primerApellido: string,
  segundoApellido: string,
  fechaNacimiento = "",
  sexo = "",
  entidadNacimiento = "",
): CURPValidationResult => {
  const result: CURPValidationResult = { valid: true, errors: {} };
  const c = curp.trim();
  const addError = (
    field: keyof CURPValidationResult["errors"],
    message: string,
  ) => {
    result.errors[field] = message;
    result.valid = false;
  };

  if (c !== c.toUpperCase()) {
    addError("formato", "La CURP debe capturarse en mayúsculas");
  }

  const curpPattern = new RegExp(
    `^[A-Z][AEIOUX][A-Z]{2}\\d{6}[HM](?:${[
      ...CURP_STATE_CODES,
      "NE",
    ].join("|")})[B-DF-HJ-NP-TV-ZX]{3}[0-9A-J]\\d$`,
  );
  if (!curpPattern.test(c)) {
    addError(
      "formato",
      "CURP inválida: debe tener 18 caracteres y la estructura oficial RENAPO",
    );
    return result;
  }

  const stateCode = c.slice(11, 13);
  if (!VALID_STATE_CODES.has(stateCode)) {
    addError("formato", `La clave de entidad '${stateCode}' no es válida`);
  }

  const embeddedYear = Number(`${/^[0-9]$/.test(c[16]) ? "19" : "20"}${c.slice(4, 6)}`);
  const embeddedDateText = `${c.slice(8, 10)}/${c.slice(6, 8)}/${embeddedYear}`;
  const embeddedDateError = validateBirthDate(embeddedDateText);
  if (embeddedDateError) {
    addError("fechaNacimiento", `La fecha contenida en la CURP no es válida: ${embeddedDateError}`);
  }

  const pa = surnameWord(primerApellido);
  const sa = surnameWord(segundoApellido);
  const name = effectiveName(nombre);
  if (pa || sa || name) {
    let expectedFirstFour = `${safeLetter(pa[0])}${firstInternalVowel(pa)}${safeLetter(sa[0])}${safeLetter(name[0])}`;
    if (INCONVENIENT_WORDS.has(expectedFirstFour)) {
      expectedFirstFour = `${expectedFirstFour[0]}X${expectedFirstFour.slice(2)}`;
    }
    if (pa && c.slice(0, 2) !== expectedFirstFour.slice(0, 2)) {
      addError("primerApellido", `Las posiciones 1-2 de la CURP deben ser '${expectedFirstFour.slice(0, 2)}' para el primer apellido`);
    }
    if (sa && c[2] !== expectedFirstFour[2]) {
      addError("segundoApellido", `La posición 3 de la CURP debe ser '${expectedFirstFour[2]}' para el segundo apellido`);
    }
    if (name && c[3] !== expectedFirstFour[3]) {
      addError("nombre", `La posición 4 de la CURP debe ser '${expectedFirstFour[3]}' para el nombre efectivo`);
    }
    const expectedConsonants = `${firstInternalConsonant(pa)}${firstInternalConsonant(sa)}${firstInternalConsonant(name)}`;
    if (pa && sa && name && c.slice(13, 16) !== expectedConsonants) {
      addError("consonantes", `Las posiciones 14-16 de la CURP deben ser '${expectedConsonants}'`);
    }
  }

  if (fechaNacimiento) {
    const sourceDate = parseDate(fechaNacimiento);
    const dateError = validateBirthDate(fechaNacimiento);
    if (!sourceDate || dateError) {
      addError("fechaNacimiento", dateError ?? "La fecha de nacimiento no es válida");
    } else {
      const expectedDate = `${String(sourceDate.getFullYear()).slice(-2)}${String(sourceDate.getMonth() + 1).padStart(2, "0")}${String(sourceDate.getDate()).padStart(2, "0")}`;
      if (c.slice(4, 10) !== expectedDate) {
        addError("fechaNacimiento", "La fecha de la CURP no coincide con la fecha de nacimiento");
      }
      const bornBefore2000 = sourceDate.getFullYear() < 2000;
      if (bornBefore2000 !== /^[0-9]$/.test(c[16])) {
        addError(
          "siglo",
          bornBefore2000
            ? "La posición 17 debe ser numérica para nacimientos anteriores a 2000"
            : "La posición 17 debe ser una letra de A a J para nacimientos desde 2000",
        );
      }
    }
  }

  // Intersexual no se puede cotejar: RENAPO sólo codifica H o M en la posición
  // 11 de la CURP, así que se omite la comprobación en vez de rechazar.
  if (sexo && normalizeForCURP(sexo) !== "INTERSEXUAL") {
    const expectedSex = sexCode(sexo);
    if (!expectedSex) {
      addError("sexo", "El sexo biológico seleccionado no es válido");
    } else if (c[10] !== expectedSex) {
      addError("sexo", `La posición 11 de la CURP debe ser '${expectedSex}'`);
    }
  }

  if (entidadNacimiento) {
    const expectedState = entidadNacimiento.toUpperCase();
    if (!VALID_STATE_CODES.has(expectedState)) {
      addError("entidadNacimiento", "La entidad de nacimiento seleccionada no tiene clave CURP válida");
    } else if (stateCode !== expectedState) {
      addError("entidadNacimiento", `La CURP indica '${stateCode}' y la entidad seleccionada corresponde a '${expectedState}'`);
    }
  }

  const expectedVerifier = calculateCURPVerifier(c.slice(0, 17));
  const actualVerifier = Number(c[17]);
  if (expectedVerifier !== actualVerifier) {
    addError("verificador", `Dígito verificador incorrecto: se esperaba ${expectedVerifier} y se capturó ${actualVerifier}`);
  }
  return result;
};
