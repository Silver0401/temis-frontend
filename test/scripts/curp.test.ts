import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCURPVerifier,
  ValidateCURP,
  validateBirthDate,
} from "../../src/scripts/curp.ts";

const VALID_CURP = "MUCI010504HHGXNSA1";
const validData = [
  "ISMAEL",
  "MUÑOZ",
  "CONTRERAS",
  "04/05/2001",
  "MASC",
  "HG",
] as const;

const withVerifier = (curp17: string) =>
  `${curp17}${calculateCURPVerifier(curp17)}`;

test("acepta una CURP con todos los datos coincidentes", () => {
  assert.deepEqual(ValidateCURP(VALID_CURP, ...validData), {
    valid: true,
    errors: {},
  });
});

test("rechaza discrepancias individuales de los datos fuente", () => {
  assert.ok(ValidateCURP(VALID_CURP, "OSCAR", "MUÑOZ", "CONTRERAS", "04/05/2001", "MASC", "HG").errors.nombre);
  assert.ok(ValidateCURP(VALID_CURP, "ISMAEL", "MORALES", "CONTRERAS", "04/05/2001", "MASC", "HG").errors.primerApellido);
  assert.ok(ValidateCURP(VALID_CURP, "ISMAEL", "MUÑOZ", "DIAZ", "04/05/2001", "MASC", "HG").errors.segundoApellido);
  assert.ok(ValidateCURP(VALID_CURP, "ISMAEL", "MUÑOZ", "CONTRERAS", "05/05/2001", "MASC", "HG").errors.fechaNacimiento);
  assert.ok(ValidateCURP(VALID_CURP, "ISMAEL", "MUÑOZ", "CONTRERAS", "04/05/2001", "FEM", "HG").errors.sexo);
  assert.ok(ValidateCURP(VALID_CURP, "ISMAEL", "MUÑOZ", "CONTRERAS", "04/05/2001", "MASC", "NL").errors.entidadNacimiento);
  assert.ok(ValidateCURP(VALID_CURP, "ISMAEL", "MORALES", "CONTRERAS", "04/05/2001", "MASC", "HG").errors.consonantes);
});

test("rechaza siglo y dígito verificador incorrectos", () => {
  const wrongCentury = withVerifier(`${VALID_CURP.slice(0, 16)}0`);
  assert.ok(ValidateCURP(wrongCentury, ...validData).errors.siglo);
  const wrongVerifier = `${VALID_CURP.slice(0, 17)}0`;
  assert.ok(ValidateCURP(wrongVerifier, ...validData).errors.verificador);
});

test("valida fechas reales, futuras y edad máxima exacta", () => {
  const today = new Date(2026, 5, 23);
  assert.match(validateBirthDate("31/02/2000", today) ?? "", /real/);
  assert.match(validateBirthDate("24/06/2026", today) ?? "", /futura/);
  assert.equal(validateBirthDate("23/06/1906", today), null);
  assert.match(validateBirthDate("22/06/1906", today) ?? "", /120/);
  const impossibleDate = withVerifier("MUCI010231HHGXNSA");
  assert.ok(ValidateCURP(impossibleDate, "", "", "", "").errors.fechaNacimiento);
});

test("acepta país extranjero únicamente con entidad NE", () => {
  const foreign = withVerifier("LODA900101MNEPZN0");
  assert.equal(
    ValidateCURP(foreign, "ANA", "LOPEZ", "DIAZ", "01/01/1990", "FEM", "NE").valid,
    true,
  );
  assert.ok(
    ValidateCURP(foreign, "ANA", "LOPEZ", "DIAZ", "01/01/1990", "FEM", "NL").errors.entidadNacimiento,
  );
});
