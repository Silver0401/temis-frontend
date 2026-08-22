"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormCC from "@/components/Form-CC";
import anime from "animejs";
import { useMediaQuery } from "react-responsive";
import { User_Login } from "@/e2e/server/AxiosAPI";
import {
  Register_User_Full,
  RegisterUserFullPayload,
  Search_EntFed,
} from "@/e2e/server/FeathersAPI";
import { useGlobalContext } from "@/e2e/globalContext";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import ModalCC from "@/components/Modal-CC";
import VerifyID from "./VerifyID";
import bcrypt from "bcryptjs";
import { toast } from "sonner";
import EstablecimientosSearchCC from "@/components/SearchInputs/EstablecimientosSearch-CC";
import PersonalTypeSearchCC from "@/components/SearchInputs/PersonalTypeSearch-CC";
import PaisesSearchCC from "@/components/SearchInputs/PaisesSearch-CC";
import EntFedSearchCC from "@/components/SearchInputs/EntFedSearch-CC";
import MunicipiosSearchCC from "@/components/SearchInputs/MunicipiosSearch-CC";
import LocalidadesSearchCC from "@/components/SearchInputs/LocalidadesSearch-CC";
import { ValidateCURP } from "@/scripts/Generator";
import DomicilioSearchCC from "@/components/SearchInputs/DomicilioSearch-CC";

type LogRegisterForm = "Login" | "Register";
type RegisterStep = "clinic" | "identity";

interface LocationState {
  locacion: Partial<LocalizacionItem>;
  keys: { entFedCatKey: number; munCatKey: number };
  isMexico: boolean;
}

const MEXICO_KEYWORD = "MÉXIC";

const isMexicoCountry = (res: PaisesResponse) =>
  res.DESCRIPCION.toUpperCase().includes(MEXICO_KEYWORD);

const makeEmptyLocation = (): LocationState => ({
  locacion: {},
  keys: { entFedCatKey: 0, munCatKey: 0 },
  isMexico: true,
});

const LogRegisterSection: React.FC = () => {
  const router = useRouter();
  const [personalType, setPersonalType] = useState<string>("");
  const [displayedForm, setDisplayedForm] = useState<LogRegisterForm>("Login");
  const [registerStep, setRegisterStep] = useState<RegisterStep>("clinic");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [userLocalizacion, setUserLocalizacion] = useState<
    Partial<LocalizacionItem>
  >({});
  const [userLocalizacion2, setUserLocalizacion2] = useState<
    Partial<LocalizacionItem>
  >({});
  const [ineVerifyResult, setIneVerifyResult] = useState<{
    uidString: string;
    ineData: NufiVerifyResult;
  } | null>(null);
  const [clinicFormData, setClinicFormData] = useState<FormData | null>(null);
  const { appDaySchema, feathersFetchCC } = useGlobalContext();
  const isMobile = useMediaQuery({ query: "(max-width: 1100px)" });
  const [currentPass, setCurrentPass] = useState<string | undefined>(undefined);

  const [birthLoc, setBirthLoc] = useState<LocationState>(makeEmptyLocation());
  const [residenceLoc, setResidenceLoc] =
    useState<LocationState>(makeEmptyLocation());

  const register_mutation = useMutation({
    mutationFn: async (identityFormData: FormData) => {
      if (!clinicFormData) throw new Error("Faltan datos de clínica");
      const nombre = (identityFormData.get("regNombre") as string) ?? "";
      const primerApellido =
        (identityFormData.get("regPrimerApellido") as string) ?? "";
      const segundoApellido =
        (identityFormData.get("regSegundoApellido") as string) ?? "";
      const curpPrestador = (identityFormData.get("regCurp") as string) ?? "";
      const payload: RegisterUserFullPayload = {
        email: (identityFormData.get("regMail") as string) ?? "",
        password: (identityFormData.get("regPass") as string) ?? "",
        name: `${nombre} ${primerApellido} ${segundoApellido}`.trim(),
        nombre,
        primerApellido,
        segundoApellido,
        curpPrestador,
        clues: (clinicFormData.get("CluesResult") as string) ?? "NLSSA000000",
        professionType:
          (clinicFormData.get("PersonalTypeResult") as string) ?? "",
        medicalLicense:
          (clinicFormData.get("medicalLicense") as string) ?? "12345",
        uidString: ineVerifyResult?.uidString ?? "",
        nufiPreVerified: !!ineVerifyResult,
        nufiData: ineVerifyResult
          ? {
              sex: ineVerifyResult.ineData.sexo,
              birthDate: ineVerifyResult.ineData.fechaNacimiento,
              birthPlace: `${ineVerifyResult.ineData.estadoDomicilio}, ${ineVerifyResult.ineData.municipioDomicilio}`,
              domicile: `${ineVerifyResult.ineData.calle}; ${ineVerifyResult.ineData.colonia}; ${ineVerifyResult.ineData.localidad}; ${ineVerifyResult.ineData.municipioDomicilio}; ${ineVerifyResult.ineData.codigoPostal};`,
              curp: ineVerifyResult.ineData.curp,
              vigencia: ineVerifyResult.ineData.vigencia,
              model: ineVerifyResult.ineData.model,
              mrz: ineVerifyResult.ineData.mrz,
            }
          : undefined,
        birthLocalizacion: {
          ...birthLoc.locacion,
          domicilioTexto:
            (identityFormData.get("birthDomicilio") as string) ?? "",
        },
        residenceLocalizacion: {
          ...residenceLoc.locacion,
          domicilioTexto:
            (identityFormData.get("residenceDomicilio") as string) ??
            ineVerifyResult?.ineData.calle ??
            "",
        },
      };
      const props = await Register_User_Full(payload);
      return feathersFetchCC(props);
    },
    onSuccess: (data: any) => {
      if (data?.type === "success") {
        handleFormChange("Login");
        setRegisterStep("clinic");
        setClinicFormData(null);
        setIneVerifyResult(null);
        setBirthLoc(makeEmptyLocation());
        setResidenceLoc(makeEmptyLocation());
      }
    },
  });

  // Location handlers — birth
  const handleBirthPaisSelect = useCallback((res: PaisesResponse) => {
    const isMx = isMexicoCountry(res);
    setBirthLoc({
      locacion: {
        pais: {
          id: res._id,
          nombre: res.DESCRIPCION,
          catalogKey: res.CATALOG_KEY,
        },
      },
      keys: { entFedCatKey: 0, munCatKey: 0 },
      isMexico: isMx,
    });
  }, []);

  const handleBirthEntFedSelect = useCallback((res: EntFedResponse) => {
    setBirthLoc((prev) => ({
      ...prev,
      keys: { entFedCatKey: res.CATALOG_KEY, munCatKey: 0 },
      locacion: {
        ...prev.locacion,
        estado: {
          id: res._id,
          nombre: res.ENTIDAD_FEDERATIVA,
          catalogKey: res.CATALOG_KEY,
        },
        municipio: undefined,
        localidad: undefined,
      },
    }));
  }, []);

  const handleBirthMunicipioSelect = useCallback((res: MunicipiosResponse) => {
    setBirthLoc((prev) => ({
      ...prev,
      keys: { ...prev.keys, munCatKey: res.CATALOG_KEY },
      locacion: {
        ...prev.locacion,
        municipio: {
          id: res._id,
          nombre: res.MUNICIPIO,
          catalogKey: res.CATALOG_KEY,
        },
        localidad: undefined,
      },
    }));
  }, []);

  const handleBirthLocalidadSelect = useCallback((res: LocalidadesResponse) => {
    setBirthLoc((prev) => ({
      ...prev,
      locacion: {
        ...prev.locacion,
        localidad: {
          id: res._id,
          nombre: res.LOCALIDAD,
          catalogKey: res.CATALOG_KEY,
        },
      },
    }));
  }, []);

  const handleDomicilioSelect = useCallback((res: LocalizacionItem) => {
    setUserLocalizacion(res);
  }, []);

  // Location handlers — residencia
  const handleResidPaisSelect = useCallback((res: PaisesResponse) => {
    const isMx = isMexicoCountry(res);
    setResidenceLoc({
      locacion: {
        pais: {
          id: res._id,
          nombre: res.DESCRIPCION,
          catalogKey: res.CATALOG_KEY,
        },
      },
      keys: { entFedCatKey: 0, munCatKey: 0 },
      isMexico: isMx,
    });
  }, []);

  const handleResidEntFedSelect = useCallback((res: EntFedResponse) => {
    setResidenceLoc((prev) => ({
      ...prev,
      keys: { entFedCatKey: res.CATALOG_KEY, munCatKey: 0 },
      locacion: {
        ...prev.locacion,
        estado: {
          id: res._id,
          nombre: res.ENTIDAD_FEDERATIVA,
          catalogKey: res.CATALOG_KEY,
        },
        municipio: undefined,
        localidad: undefined,
      },
    }));
  }, []);

  const handleResidMunicipioSelect = useCallback((res: MunicipiosResponse) => {
    setResidenceLoc((prev) => ({
      ...prev,
      keys: { ...prev.keys, munCatKey: res.CATALOG_KEY },
      locacion: {
        ...prev.locacion,
        municipio: {
          id: res._id,
          nombre: res.MUNICIPIO,
          catalogKey: res.CATALOG_KEY,
        },
        localidad: undefined,
      },
    }));
  }, []);

  const handleResidLocalidadSelect = useCallback((res: LocalidadesResponse) => {
    setResidenceLoc((prev) => ({
      ...prev,
      locacion: {
        ...prev.locacion,
        localidad: {
          id: res._id,
          nombre: res.LOCALIDAD,
          catalogKey: res.CATALOG_KEY,
        },
      },
    }));
  }, []);

  const autoFillBirthEntityFromCurp = useCallback(
    async (curp: string) => {
      if (curp.length < 13) return;
      const stateCode = curp.slice(11, 13).toUpperCase();
      if (stateCode === "NE") {
        setBirthLoc((prev) => ({
          ...prev,
          isMexico: false,
          keys: { entFedCatKey: 0, munCatKey: 0 },
        }));
        return;
      }
      const req = await Search_EntFed(stateCode);
      const res = await feathersFetchCC<EntFedResponse[]>(req);
      if (res.type !== "success") return;
      const match = res.data.find((r) => r.ABREVIATURA === stateCode);
      if (match) handleBirthEntFedSelect(match);
    },
    [feathersFetchCC, handleBirthEntFedSelect],
  );

  // Pre-fill residencia from INE when available; pre-fill entidad de nacimiento from CURP
  useEffect(() => {
    if (ineVerifyResult) {
      setResidenceLoc((prev) => ({
        ...prev,
        isMexico: true,
        locacion: {
          ...prev.locacion,
          calle: `${ineVerifyResult.ineData.calle}, ${ineVerifyResult.ineData.colonia}, CP ${ineVerifyResult.ineData.codigoPostal}`,
        },
      }));
      autoFillBirthEntityFromCurp(ineVerifyResult.ineData.curp);
    }
  }, [ineVerifyResult, autoFillBirthEntityFromCurp]);

  // ── Form 1: Clínica y Cédula ──────────────────────────────────────────────
  const clinicInputList = useMemo((): InputCCprops[] => {
    return [
      {
        type: "custom",
        identifier: "CluesResult",
        required: true,
        children: (
          <EstablecimientosSearchCC
            identifier="CluesResult"
            onSelect={() => {}}
            colorSchema="night"
          />
        ),
      },
      {
        type: "custom",
        identifier: "PersonalTypeResult",
        required: true,
        children: (
          <PersonalTypeSearchCC
            identifier="PersonalTypeResult"
            onSelect={(e) => setPersonalType(e)}
          />
        ),
      },
      {
        type: "number",
        label: "Cédula Profesional",
        identifier: "medicalLicense",
        required: personalType !== "1 - MÉDICA (O) PASANTE",
        disabled: personalType === "1 - MÉDICA (O) PASANTE",
      },
    ];
  }, [personalType]);

  // ── Form 2: Identidad + Localización + Cuenta ─────────────────────────────
  const identityDataInputList = useMemo((): InputCCprops[] => {
    return [
      {
        type: "text",
        label: "Verificación de Identidad",
        identifier: "IdVerif",
        currentValue:
          process.env.NEXT_PUBLIC_ENV_TYPE === "development"
            ? "En Dev no Aplica"
            : ineVerifyResult
              ? "Identidad Verificada ✓"
              : undefined,
        nonWritable: true,
        required: true,
        autoComplete: "off",
        onClick: () => {
          if (process.env.NEXT_PUBLIC_ENV_TYPE === "production") {
            setModalVisible(true);
          }
        },
      },
      {
        type: "text",
        label: "Nombre(s)",
        identifier: "regNombre",
        placeholder: "Como aparece en tu INE",
        required: true,
        currentValue: ineVerifyResult?.ineData.nombre ?? undefined,
        nonWritable: !!ineVerifyResult,
      },
      {
        type: "text",
        label: "Primer Apellido",
        identifier: "regPrimerApellido",
        placeholder: "Como aparece en tu INE",
        required: true,
        currentValue: ineVerifyResult?.ineData.apellidoPaterno ?? undefined,
        nonWritable: !!ineVerifyResult,
      },
      {
        type: "text",
        label: "Segundo Apellido",
        identifier: "regSegundoApellido",
        placeholder: "Como aparece en tu INE",
        required: false,
        currentValue: ineVerifyResult?.ineData.apellidoMaterno ?? undefined,
        nonWritable: !!ineVerifyResult,
      },
      {
        type: "text",
        label: "CURP",
        identifier: "regCurp",
        placeholder: "18 caracteres alfanuméricos",
        required: true,
        currentValue: ineVerifyResult?.ineData.curp ?? undefined,
        nonWritable: !!ineVerifyResult,
        onChange: (val) => {
          if (val.length === 18) autoFillBirthEntityFromCurp(val);
        },
      },
      // ── Lugar de Nacimiento ──────────────────────────────────────────────
      // {
      //   type: "sectionLabel" as any,
      //   identifier: "birthLabel",
      //   label: "Lugar de Nacimiento",
      // },
      {
        type: "custom",
        identifier: "BirthPaisSearch",
        label: "País de Nacimiento",
        required: true,
        children: (
          <PaisesSearchCC
            identifier="BirthPaisSearch"
            currentValue="México"
            onSelect={handleBirthPaisSelect}
          />
        ),
      },
      {
        type: "custom",
        identifier: "BirthEntFedSearch",
        label: "Entidad Federativa de Nacimiento",
        required: birthLoc.isMexico,
        children: (
          <EntFedSearchCC
            identifier="BirthEntFedSearch"
            onSelect={handleBirthEntFedSelect}
            disabled={!birthLoc.isMexico}
            currentValue={birthLoc.locacion.estado?.nombre}
            colorSchema="night"
          />
        ),
      },
      {
        type: "custom",
        identifier: "BirthMunicipioSearch",
        label: "Municipio de Nacimiento",
        required: birthLoc.isMexico && birthLoc.keys.entFedCatKey !== 0,
        children: (
          <MunicipiosSearchCC
            identifier="BirthMunicipioSearch"
            efeKey={birthLoc.keys.entFedCatKey}
            onSelect={handleBirthMunicipioSelect}
            disabled={!birthLoc.isMexico || birthLoc.keys.entFedCatKey === 0}
            colorSchema="night"
          />
        ),
      },
      {
        type: "custom",
        identifier: "BirthLocalidadSearch",
        label: "Localidad de Nacimiento",
        required:
          birthLoc.isMexico &&
          birthLoc.keys.entFedCatKey !== 0 &&
          birthLoc.keys.munCatKey !== 0,
        children: (
          <LocalidadesSearchCC
            identifier="BirthLocalidadSearch"
            efeKey={birthLoc.keys.entFedCatKey}
            munKey={birthLoc.keys.munCatKey}
            onSelect={handleBirthLocalidadSelect}
            disabled={
              !birthLoc.isMexico ||
              birthLoc.keys.entFedCatKey === 0 ||
              birthLoc.keys.munCatKey === 0
            }
            colorSchema="night"
          />
        ),
      },
      {
        type: "custom",
        label: "Domicilio de Nacimiento",
        identifier: "birthDomicilio",
        placeholder: "Calle, número, colonia, C.P.",
        required: false,
        children: (
          <DomicilioSearchCC
            identifier="birthDomicilio"
            currentValue={
              userLocalizacion.calle ?? userLocalizacion.municipio?.nombre
            }
            onSelect={handleDomicilioSelect}
            onClear={() => setUserLocalizacion({})}
            placeholder="Domicilio de Nacimiento"
            colorSchema="night"
          />
        ),
      },
      // ── Lugar de Residencia Actual ───────────────────────────────────────
      {
        type: "custom",
        identifier: "ResidPaisSearch",
        label: "País de Residencia",
        required: true,
        children: (
          <PaisesSearchCC
            identifier="ResidPaisSearch"
            currentValue="México"
            placeholder="Pais de Residencia Actual"
            onSelect={handleResidPaisSelect}
            colorSchema="night"
          />
        ),
      },
      {
        type: "custom",
        identifier: "ResidEntFedSearch",
        label: "Entidad Federativa de Residencia",
        required: residenceLoc.isMexico,
        children: (
          <EntFedSearchCC
            identifier="ResidEntFedSearch"
            onSelect={handleResidEntFedSelect}
            placeholder="Entidad Federativa de Residencia Actual"
            disabled={!residenceLoc.isMexico}
            currentValue={ineVerifyResult?.ineData.estadoDomicilio}
            colorSchema="night"
          />
        ),
      },
      {
        type: "custom",
        identifier: "ResidMunicipioSearch",
        label: "Municipio de Residencia",
        required: residenceLoc.isMexico && residenceLoc.keys.entFedCatKey !== 0,
        children: (
          <MunicipiosSearchCC
            identifier="ResidMunicipioSearch"
            efeKey={residenceLoc.keys.entFedCatKey}
            onSelect={handleResidMunicipioSelect}
            placeholder="Municipio de Residencia Actual"
            disabled={
              !residenceLoc.isMexico || residenceLoc.keys.entFedCatKey === 0
            }
            currentValue={ineVerifyResult?.ineData.municipioDomicilio}
            colorSchema="night"
          />
        ),
      },
      {
        type: "custom",
        identifier: "ResidLocalidadSearch",
        label: "Localidad de Residencia",
        required:
          residenceLoc.isMexico &&
          residenceLoc.keys.entFedCatKey !== 0 &&
          residenceLoc.keys.munCatKey !== 0,
        children: (
          <LocalidadesSearchCC
            identifier="ResidLocalidadSearch"
            efeKey={residenceLoc.keys.entFedCatKey}
            munKey={residenceLoc.keys.munCatKey}
            onSelect={handleResidLocalidadSelect}
            placeholder="Localidad de Residencia Actual"
            colorSchema="night"
            disabled={
              !residenceLoc.isMexico ||
              residenceLoc.keys.entFedCatKey === 0 ||
              residenceLoc.keys.munCatKey === 0
            }
          />
        ),
      },
      {
        type: ineVerifyResult?.ineData.calle ? "text" : "custom",
        label: "Domicilio Actual",
        identifier: "residenceDomicilio",
        placeholder: "Calle, número, colonia, C.P.",
        required: false,
        currentValue: ineVerifyResult
          ? `${ineVerifyResult.ineData.calle}, ${ineVerifyResult.ineData.colonia}, CP ${ineVerifyResult.ineData.codigoPostal}`
          : undefined,
        children: (
          <DomicilioSearchCC
            identifier="residenceDomicilio"
            currentValue={
              userLocalizacion2.calle ?? userLocalizacion2.municipio?.nombre
            }
            onSelect={handleDomicilioSelect}
            onClear={() => setUserLocalizacion2({})}
            placeholder="Domicilio Actual"
            colorSchema="night"
          />
        ),
      },
      // ── Cuenta ──────────────────────────────────────────────────────────
      {
        type: "email",
        label: "Correo",
        identifier: "regMail",
        required: true,
      },
      {
        type: "password",
        label: "Contraseña",
        identifier: "regPass",
        required: true,
        showPasswordStrength: true,
      },
      {
        type: "checkBoxLink",
        label: "He leído y acepto los",
        identifier: "regTermsAccepted",
        required: true,
        checkBoxLink: {
          text: "Términos y Condiciones",
          url: "/documents/terminos-y-condiciones.docx",
        },
      },
    ];
  }, [
    ineVerifyResult,
    birthLoc,
    residenceLoc,
    autoFillBirthEntityFromCurp,
    handleBirthPaisSelect,
    handleBirthEntFedSelect,
    handleBirthMunicipioSelect,
    handleBirthLocalidadSelect,
    handleResidPaisSelect,
    handleResidEntFedSelect,
    handleResidMunicipioSelect,
    handleResidLocalidadSelect,
  ]);

  const handleFormChange = (formToTransition: LogRegisterForm) => {
    setTimeout(
      () => {
        setDisplayedForm(formToTransition);
      },
      isMobile ? 1000 : 500,
    );

    if (isMobile) {
      if (formToTransition === "Login") {
        const tl = anime.timeline({ duration: 1000 });
        tl.add({
          targets: ".LogRegisterSection",
          easing: "easeInQuint",
          translateX: ["0%", "-100%"],
        });
        tl.add({
          targets: ".LogRegisterSection",
          easing: "easeOutQuint",
          translateX: ["100%", "0%"],
        });
      }
      if (formToTransition === "Register") {
        const tl = anime.timeline({ duration: 1000 });
        tl.add({
          targets: ".LogRegisterSection",
          easing: "easeInQuint",
          translateX: ["0%", "100%"],
        });
        tl.add({
          targets: ".LogRegisterSection",
          easing: "easeOutQuint",
          translateX: ["-100%", "0%"],
        });
      }
    } else {
      if (formToTransition === "Login") {
        const tl = anime.timeline({ easing: "easeInOutQuint", duration: 1000 });
        tl.add({ targets: ".NewsSection", translateX: "0%" });
        tl.add({ targets: ".LogRegisterSection", translateX: "-0%" }, "-=1000");
      }
      if (formToTransition === "Register") {
        const tl = anime.timeline({ easing: "easeInOutQuint", duration: 1000 });
        tl.add({ targets: ".NewsSection", translateX: "-100%" });
        tl.add(
          { targets: ".LogRegisterSection", translateX: "100%" },
          "-=1000",
        );
      }
    }
  };

  const SecretPassswordHash = async () => {
    if (currentPass) {
      const hash = await bcrypt.hash(currentPass, 10);
      toast.success(hash);
    } else {
      toast.error("Shhhhh, secret ;)");
    }
  };

  useEffect(() => {
    if (isMobile) {
      anime({
        targets: [".NewsSection", ".LogRegisterSection"],
        easing: "easeInOutQuint",
        duration: 0,
        translateX: "0%",
      });
    } else {
      handleFormChange(displayedForm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  return (
    <>
      <div className="LogRegisterSection" id="overlap1">
        <div className="LogRegisterFormContainer">
          {displayedForm === "Login" ? (
            <FormCC
              key="LoginForm"
              identifier="LoginForm"
              title="Inicia tu Sesión"
              subtitle={
                <div
                  className="inlineLogRegister"
                  onClick={() => handleFormChange("Register")}
                >
                  <p>{"¿Aún no tienes Cuenta?"}</p>
                  <p>{"Regístrate"}</p>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm4.28 10.28a.75.75 0 0 0 0-1.06l-3-3a.75.75 0 1 0-1.06 1.06l1.72 1.72H8.25a.75.75 0 0 0 0 1.5h5.69l-1.72 1.72a.75.75 0 1 0 1.06 1.06l3-3Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              }
              onSuccess={({ formData, ApiResponse }) => {
                if (formData.get("logRemember")) {
                  window.localStorage.removeItem("jwtExpired");
                  window.sessionStorage.removeItem("notAccessToken");
                  window.localStorage.setItem(
                    "notAccessToken",
                    ApiResponse.data.accessToken,
                  );
                } else {
                  window.localStorage.removeItem("jwtExpired");
                  window.localStorage.removeItem("notAccessToken");
                  window.sessionStorage.setItem(
                    "notAccessToken",
                    ApiResponse.data.accessToken,
                  );
                }
                setTimeout(() => router.push("/dashboard"), 1000);
              }}
              onAxiosApiAction={User_Login}
              inputList={[
                {
                  type: "email",
                  label: "Correo",
                  identifier: "logMail",
                  required: true,
                },
                {
                  type: "password",
                  label: "Contraseña",
                  identifier: "logPass",
                  required: true,
                  onChange: (e) => setCurrentPass(e),
                },
                {
                  type: "checkbox",
                  label: "Recuérdame en este dispositivo",
                  identifier: "logRemember",
                },
                {
                  type: "checkBoxLink",
                  label:
                    "Me comprometo a proteger la privacidad de los pacientes conforme a la",
                  identifier: "logPrivacyAccepted",
                  required: true,
                  checkBoxLink: {
                    text: "Política de Privacidad",
                    url: "/documents/politica-de-privacidad.docx",
                  },
                },
              ]}
            />
          ) : registerStep === "clinic" ? (
            // ── Form 1: Clínica y Cédula ──────────────────────────────────
            <FormCC
              title="Regístrate"
              key="RegisterClinicForm"
              identifier="RegisterClinicForm"
              subtitle={
                <div
                  className="inlineLogRegister"
                  onClick={() => handleFormChange("Login")}
                >
                  <p>{"¿Ya tienes una Cuenta?"}</p>
                  <p>{"Inicia Sesión"}</p>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-4.28 9.22a.75.75 0 0 0 0 1.06l3 3a.75.75 0 1 0 1.06-1.06l-1.72-1.72h5.69a.75.75 0 0 0 0-1.5h-5.69l1.72-1.72a.75.75 0 0 0-1.06-1.06l-3 3Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              }
              onSubmit={(formData) => {
                setClinicFormData(formData);
                setRegisterStep("identity");
              }}
              inputList={clinicInputList}
            />
          ) : (
            // ── Form 2: Identidad + Localización + Cuenta ─────────────────
            <FormCC
              title="Datos Personales"
              key="RegisterIdentityForm"
              identifier="RegisterIdentityForm"
              steps={9}
              subtitle={
                <div
                  className="inlineLogRegister"
                  onClick={() => setRegisterStep("clinic")}
                >
                  <p>{"← Regresar"}</p>
                </div>
              }
              inputList={identityDataInputList}
              onSubmit={(formData) => {
                const curp = (formData.get("regCurp") as string) ?? "";
                const nombre = (formData.get("regNombre") as string) ?? "";
                const primerApellido =
                  (formData.get("regPrimerApellido") as string) ?? "";
                const segundoApellido =
                  (formData.get("regSegundoApellido") as string) ?? "";
                const validation = ValidateCURP(
                  curp,
                  nombre,
                  primerApellido,
                  segundoApellido,
                  ineVerifyResult?.ineData.fechaNacimiento ?? "",
                );
                if (!validation.valid) {
                  Object.values(validation.errors).forEach((msg) =>
                    toast.error(msg),
                  );
                  return;
                }
                register_mutation.mutate(formData);
              }}
              buttonLoading={register_mutation.isPending}
            />
          )}
        </div>
      </div>

      <ModalCC
        size="large"
        identifier="IDVerifModal"
        animation="popUp"
        useStates={{
          state: modalVisible,
          setState: setModalVisible,
        }}
      >
        <VerifyID
          onVerified={(data) => {
            setIneVerifyResult(data ?? null);
            setModalVisible(false);
          }}
          setModalVisible={setModalVisible}
        />
      </ModalCC>
    </>
  );
};

export default LogRegisterSection;
