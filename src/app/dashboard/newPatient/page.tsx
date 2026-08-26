"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import ButtonCC from "@/components/Button-CC";
import { ClinicalHistorySections } from "@/library/Records/SectionsRegistry";

import {
  DefaultFichaDeIdentificacionValues,
  DefaultSessionData,
} from "@/scripts/Constants";

import IconsCC from "@/assets/icons/IconsCC";
import PatientSearchCC from "@/components/PatientSearch-CC";
import { DashboardContext } from "@/e2e/dashboardContext";
import AddNewDocForm from "@/library/Dashboard/AddNewDocForm";
import CardsDisplayCC from "@/components/CardsDisplay-CC";
import MiniPatient from "@/library/Dashboard/MiniPatient";
import FormCC from "@/components/Form-CC";
import { feathers, Application } from "@feathersjs/feathers";
import { io } from "socket.io-client";
import socketio from "@feathersjs/socketio-client";
import { GlobalContext, useGlobalContext } from "@/e2e/globalContext";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import {
  CURP_Renapo_Extraction,
  Extract_INE_Data,
  Search_EntFed,
  Search_Paises_By_Name,
} from "@/e2e/server/FeathersAPI";
import {
  CapitalizeSentence,
  curpStateCodeFromCatalogKey,
  ValidateCURP,
} from "@/scripts/Generator";
import ConfirmMedRecord from "@/library/BaseForms/ConfirmMedRecord";
import PaisesSearchCC from "@/components/SearchInputs/PaisesSearch-CC";
import EntFedSearchCC from "@/components/SearchInputs/EntFedSearch-CC";
import DomicilioSearchCC from "@/components/SearchInputs/DomicilioSearch-CC";
import AfiliacionesSearchCC from "@/components/SearchInputs/AfiliacionesSearch-CC";

const isMexicoCountry = (country: PaisesResponse) =>
  country.CATALOG_KEY === 142 ||
  country.DESCRIPCION.toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .includes("MEXICO");

const NewPatientIndex: React.FC = () => {
  const router = useRouter();
  const socketRef = useRef<Application>(null);
  const [phoneImg, setPhoneImg] = useState<FileCCProps | undefined>(undefined);
  const [manualDomicilio, setManualDomicilio] = useState<
    Partial<LocalizacionItem>
  >({});
  const [manualAfiliaciones, setManualAfiliaciones] = useState<Afiliacion[]>(
    [],
  );
  const [manualBirthLocalizacion, setManualBirthLocalizacion] = useState<
    Partial<LocalizacionItem>
  >({});
  const [manualBirthIsMexico, setManualBirthIsMexico] = useState<
    boolean | null
  >(null);
  // GIIS-B015-04-11 campo 20 (migrante): controla si se muestra el buscador
  // de país de procedencia (campo 21), solo requerido cuando es internacional.
  const [manualMigrante, setManualMigrante] = useState<number | null>(null);
  const [manualPaisProcedencia, setManualPaisProcedencia] = useState<
    Partial<LocalizacionEntry> | undefined
  >(undefined);
  const { getAccessToken, feathersFetchCC } = useGlobalContext();

  const { currentSessionData, setCurrentSessionData } =
    useContext(DashboardContext);
  const base = "/dashboard";
  const pathname = usePathname();

  // ── Arranque del flujo según la ruta/entrada ────────────────────────────────
  // Cada acción del SideNav entra directo a SU flujo, sin la tarjeta-selector
  // intermedia.
  // - /dashboard/addDocument → documento (step 0).
  // - /dashboard/newPatient → paciente (step 0).
  // Solo (re)inicializa si el flujo guardado no concuerda con el de esta ruta;
  // así una navegación de regreso a mitad de flujo continúa sin resetear.
  const desiredFlow: toBeAddedTypes = pathname.includes("addDocument")
    ? "document"
    : "patient";

  useEffect(() => {
    if (currentSessionData.toBeAdded === desiredFlow) return;

    setCurrentSessionData({
      ...DefaultSessionData,
      toBeAdded: desiredFlow,
      currentStep: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const Extract_INE_Data_Mutation = useMutation({
    mutationFn: async (INEBase64Img: string) => {
      const reqProps = await Extract_INE_Data([INEBase64Img]);
      return await feathersFetchCC<{
        Response: { data: FrontINEOCRResponse };
      }>(reqProps);
    },
    onSuccess(data) {
      const ocr = data?.data.Response.data?.ocr;
      const rawSex = (ocr?.sexo ?? "").toUpperCase();
      const sex: Sex =
        rawSex === "H" || rawSex === "HOMBRE" || rawSex === "MASCULINO"
          ? "Masculino"
          : "Femenino";

      const patientIdentification: PatientIdentification = {
        names: (ocr?.nombre ?? "").toUpperCase(),
        middleName: (ocr?.apellido_paterno ?? "").toUpperCase(),
        lastName: (ocr?.apellido_materno ?? "").toUpperCase(),
        sex,
        birthDate: CapitalizeSentence(ocr?.fecha_nacimiento),
        birthPlace: `${CapitalizeSentence(ocr?.municipio)}, ${CapitalizeSentence(ocr?.estado)}`,
        domicile:
          `${CapitalizeSentence(ocr?.calle_numero)}, ${CapitalizeSentence(ocr?.colonia)}, ${ocr?.codigo_postal ?? ""}`.trim(),
        genre: sex === "Masculino" ? "Masculino" : "Femenino",
        derechohabiencia: [],
        curp: ocr?.curp ?? "XXXX999999XXXXXX99",
      };

      toast.success(
        "Datos de la INE extraídos con éxito, continua con la consulta o registro de información",
      );

      setCurrentSessionData({
        ...currentSessionData,
        patientIdentification,
        method: "text",
      });
      router.push(`${base}/newPatient/clinicalRecord`);
    },
  });

  // Resuelve país y entidad de nacimiento contra los catálogos a partir de lo
  // que devuelve RENAPO. Sin esto el formulario queda prellenado pero no se
  // puede enviar, porque el submit exige país/entidad escogidos del catálogo.
  const prefillBirthLocalizacion = useCallback(
    async (entidad: string) => {
      const bornAbroad = entidad
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .includes("EXTRANJ");
      if (bornAbroad) return;

      try {
        const paisRes = await feathersFetchCC<PaisesResponse[]>(
          await Search_Paises_By_Name("MEXICO"),
        );
        const pais = paisRes?.data?.find(isMexicoCountry);
        if (!pais) return;

        const next: Partial<LocalizacionItem> = {
          pais: {
            id: pais._id,
            nombre: pais.DESCRIPCION,
            catalogKey: pais.CATALOG_KEY,
          },
        };

        if (entidad) {
          const entRes = await feathersFetchCC<EntFedResponse[]>(
            await Search_EntFed(entidad),
          );
          const ent = entRes?.data?.[0];
          if (ent)
            next.estado = {
              id: ent._id,
              nombre: ent.ENTIDAD_FEDERATIVA,
              catalogKey: ent.CATALOG_KEY,
            };
        }

        setManualBirthIsMexico(true);
        setManualBirthLocalizacion(next);
      } catch {
        /* Prellenado best-effort: si el catálogo falla se captura a mano. */
      }
    },
    [feathersFetchCC],
  );

  const CURP_Renapo_Mutation = useMutation({
    mutationFn: async (CURP: string) => {
      const reqProps = await CURP_Renapo_Extraction(CURP);
      return await feathersFetchCC<{
        Response: { data: { curpdata: RenapoCurpResponse[] } };
      }>(reqProps);
    },
    async onSuccess(data) {
      const renapo = data?.data.Response.data.curpdata[0];
      const rawSex = (renapo?.sexo ?? "").toUpperCase();
      const sex: Sex =
        rawSex === "H" || rawSex === "HOMBRE" || rawSex === "MASCULINO"
          ? "Masculino"
          : "Femenino";

      const patientIdentification: PatientIdentification = {
        names: (renapo?.nombres ?? "").toUpperCase(),
        middleName: (renapo?.primerApellido ?? "").toUpperCase(),
        lastName: (renapo?.segundoApellido ?? "").toUpperCase(),
        sex,
        birthDate: CapitalizeSentence(renapo?.fechaNacimiento),
        birthPlace: `${CapitalizeSentence(renapo?.entidad)}, ${CapitalizeSentence(renapo?.nacionalidad)}`,
        genre: sex === "Masculino" ? "Masculino" : "Femenino",
        derechohabiencia: [],
        curp: renapo?.curp ?? "XXXX999999XXXXXX99",
      };

      const xVal = ValidateCURP(
        renapo?.curp ?? "",
        renapo?.nombres ?? "",
        renapo?.primerApellido ?? "",
        renapo?.segundoApellido ?? "",
        renapo?.fechaNacimiento ?? "",
        sex,
      );
      if (!xVal.valid) {
        Object.values(xVal.errors).forEach((e) => e && toast.warning(e));
      }

      await prefillBirthLocalizacion(renapo?.entidad ?? "");

      toast.success(
        "Datos del CURP extraídos con éxito, continua con la consulta o registro de información",
      );

      setCurrentSessionData({
        ...currentSessionData,
        patientIdentification,
        currentStep: 2,
      });
    },
  });

  const connectToSocketServer = useCallback(() => {
    if (socketRef.current) return;

    const socket = io(`${process.env.NEXT_PUBLIC_NOT_BACKEND_URL}`, {
      extraHeaders: {
        deviceType: "computer",
        Authorization: `Bearer ${getAccessToken().accessToken}`,
      },
    });

    const feathersClient = feathers();
    feathersClient.configure(socketio(socket));
    // @ts-ignore
    socketRef.current = feathersClient;

    feathersClient.service("uploads").on("ImgSent", (fileData: FileCCProps) => {
      toast.success("Imagen recibida desde el teléfono");
      setPhoneImg(fileData);
    });

    return () => {
      socket.disconnect();
      // @ts-ignore
      socketRef.current = null;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------  Server Socket Init and CleanUp -----------------
  useEffect(() => {
    let cleanup = connectToSocketServer();
    return cleanup;
    // return cleanup;
  }, [connectToSocketServer]);

  const handleManualBirthPaisSelect = useCallback((res: PaisesResponse) => {
    setManualBirthIsMexico(isMexicoCountry(res));
    setManualBirthLocalizacion({
      pais: {
        id: res._id,
        nombre: res.DESCRIPCION,
        catalogKey: res.CATALOG_KEY,
      },
    });
  }, []);

  // GIIS campo 21: país de procedencia, solo capturado cuando migrante === 2
  const handleManualPaisProcedenciaSelect = useCallback(
    (res: PaisesResponse) => {
      setManualPaisProcedencia({
        id: res._id,
        nombre: res.DESCRIPCION,
        catalogKey: res.CATALOG_KEY,
      });
    },
    [],
  );

  const handleManualBirthEntFedSelect = useCallback((res: EntFedResponse) => {
    setManualBirthLocalizacion((prev) => ({
      ...prev,
      estado: {
        id: res._id,
        nombre: res.ENTIDAD_FEDERATIVA,
        catalogKey: res.CATALOG_KEY,
      },
    }));
  }, []);

  // Domicilio actual ahora se captura con el buscador de Google
  // (DomicilioSearchCC), que ya entrega un LocalizacionItem mapeado.
  const handleManualDomicilioSelect = useCallback((res: LocalizacionItem) => {
    setManualDomicilio(res);
  }, []);

  const handleManualAfiliacionesSelect = useCallback((res: Afiliacion[]) => {
    setManualAfiliaciones(res);
  }, []);

  // Datos ya extraídos (CURP/RENAPO o INE) con los que se prellena el
  // formulario manual de identificación.
  const idPrefill = currentSessionData.patientIdentification;

  const AddPatientDocFlow: NewFlowIndexed = {
    document: [
      // Step #0 Search a Patient To add New Doc
      <AnimatePresence key={"SearchPatientToAddDocAnimatePresence"}>
        <motion.div
          className="SearchPatientToAddDoc"
          key={"SearchPatientToAddDoc"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="topCont">
            <h3 className="sptitle">{"Busca a tu Paciente"}</h3>
            <p className="spsubtitle">
              {
                "Escribe el nombre de tu paciente, y seleccionalo para proseguir"
              }
            </p>
            <PatientSearchCC
              onPatientSelect={(patientData) => {
                setCurrentSessionData({
                  ...currentSessionData,
                  currentPatientData: patientData.fullData,
                  patientIdentification: {
                    names: patientData.fullData.personalInfo.names,
                    middleName: patientData.fullData.personalInfo.middleName,
                    lastName: patientData.fullData.personalInfo.lastName,
                    sex: patientData.fullData.personalInfo.sex,
                    birthDate: patientData.fullData.personalInfo.birthDate,
                    birthPlace:
                      patientData.fullData.personalInfo.birthPlace ?? "",
                    domicile: patientData.fullData.personalInfo.domicile,
                    genre: patientData.fullData.personalInfo.genre,
                    derechohabiencia:
                      patientData.fullData.personalInfo.derechohabiencia,
                    curp: patientData.fullData.personalInfo.curp,
                  },
                });
              }}
              onReset={() =>
                setCurrentSessionData({
                  ...currentSessionData,
                  currentPatientData: undefined,
                })
              }
            />
          </div>

          <MiniPatient
            PatientInfo={
              currentSessionData.currentPatientData &&
              typeof currentSessionData.currentPatientData !== "string"
                ? currentSessionData.currentPatientData
                : undefined
            }
          />

          {currentSessionData.currentPatientData &&
            typeof currentSessionData.currentPatientData !== "string" && (
              <div style={{ width: "300px", marginTop: "30px" }}>
                <ButtonCC
                  type="Phantom"
                  width="block"
                  text="Continuar"
                  onClick={() => {
                    setCurrentSessionData({
                      ...currentSessionData,
                      currentStep: 1,
                    });
                  }}
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-6"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H9a.75.75 0 0 1 0-1.5h10.94l-1.72-1.72a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                />
              </div>
            )}
        </motion.div>
      </AnimatePresence>,
      // Step #1 Select The Type of Object To Add
      <CardsDisplayCC
        key={"SmallCardsDisplayDocOptions"}
        title="Tipo de Documento"
        subtitle="Escoge el tipo de documento que vas a agregar al expediente"
        itemsList={Object.entries(ClinicalHistorySections).map((entry) => {
          const [key, { DocTitle, DocSubtitle, Icon, SectionType }] = entry as [
            CHSections,
            CHSectionProps,
          ];
          return SectionType.includes("AddDocument")
            ? ({
                title: DocTitle,
                subtitle: DocSubtitle,
                icon: Icon,
                name: key,
                size: "sm",
                onClick: () => {
                  setCurrentSessionData({
                    ...currentSessionData,
                    currentStep: 2,
                    docType: key,
                  });
                },
              } as CardProps)
            : null;
        })}
      />,

      // Step #3 Display the Doc to Add Document
      <div className="NewDocformContainer" key={"NewDocformContainer"}>
        {currentSessionData?.currentPatientData && (
          <AddNewDocForm
            key={"AddNewDocFormPage"}
            currentSection={currentSessionData.docType}
            PatientInfo={currentSessionData?.currentPatientData}
          />
        )}
      </div>,
    ],
    patient: [
      // Step #0: Selecciona Como Agregar Datos de Identificación
      <CardsDisplayCC
        key={"IneTextOptions"}
        title="Identificación"
        subtitle="Como deseas agregar los datos de identificación del Paciente"
        itemsList={
          [
            {
              size: "md",
              name: "CurpOpt",
              title: "Con CURP",
              subtitle: "Escribe el CURP para extraer los datos del Paciente",
              icon: IconsCC.IdSearch,
              onClick: () => {
                setCurrentSessionData({
                  ...currentSessionData,
                  currentStep: 1,
                });
              },
            },
            {
              size: "md",
              name: "TextOpt",
              title: "Manual",
              subtitle:
                "Escribe manualmente los datos de identificación del paciente",
              icon: IconsCC.Pencil,
              onClick: () => {
                setCurrentSessionData({
                  ...currentSessionData,
                  currentStep: 2,
                });
              },
            },
          ] as CardProps[]
        }
      />,

      // Step #1 Write Manually CURP
      <div className="formOptContainer" key={"ScanINEFormContainer"}>
        <FormCC
          titlesStyle={{
            title: { textAlign: "center" },
            subtitle: { textAlign: "center" },
          }}
          buttonLoading={CURP_Renapo_Mutation.isPending}
          identifier="ManualCURPWriteForm"
          title={"Escribe el CURP"}
          subtitle={"Con el CURP podemos extraer los datos de identificación"}
          inputList={[
            {
              type: "text",
              required: true,
              identifier: "ManualCURP",
            },
          ]}
          onSubmit={(formData) => {
            const CURP = formData.get("ManualCURP") as string;
            const preCheck = ValidateCURP(CURP, "", "", "", "");
            if (!preCheck.valid) {
              const msg =
                preCheck.errors.formato ??
                preCheck.errors.verificador ??
                "CURP inválida";
              toast.error(msg);
              return;
            }
            CURP_Renapo_Mutation.mutate(CURP);
          }}
        />
      </div>,

      // Step #2: Ingreso Manual de Identificación del Paciente
      <div className="formOptContainer" key={"ManualIdFormContainer"}>
        <FormCC
          identifier="ManualPatientIdForm"
          title="Datos de Identificación"
          subtitle="Ingresa los datos del paciente manualmente"
          steps={4}
          titlesStyle={{
            title: { textAlign: "center" },
            subtitle: { textAlign: "center" },
          }}
          onSubmit={(formData) => {
            if (!manualBirthLocalizacion.pais) {
              toast.error("Selecciona el país de nacimiento del catálogo");
              return;
            }
            if (manualBirthIsMexico && !manualBirthLocalizacion.estado) {
              toast.error("Selecciona la entidad federativa de nacimiento");
              return;
            }
            const selectedSex = formData.get("sex") as string;
            if (
              !["Masculino", "Femenino", "Intersexual"].includes(selectedSex)
            ) {
              toast.error("Selecciona un sexo biológico válido");
              return;
            }
            const curpInput = ((formData.get("curp") as string) || "").trim();
            if (curpInput) {
              const entityCode = manualBirthIsMexico
                ? curpStateCodeFromCatalogKey(
                    manualBirthLocalizacion.estado?.catalogKey,
                  )
                : "NE";
              if (!entityCode) {
                toast.error(
                  "La entidad seleccionada no tiene una clave CURP válida",
                );
                return;
              }
              const validation = ValidateCURP(
                curpInput,
                formData.get("names") as string,
                formData.get("middleName") as string,
                formData.get("lastName") as string,
                formData.get("birthDate") as string,
                selectedSex,
                entityCode,
              );
              if (!validation.valid) {
                Object.values(validation.errors).forEach(
                  (e) => e && toast.error(e),
                );
                return;
              }
            }
            const sex: Sex = selectedSex as Sex;
            const domicilioLocalizacion: LocalizacionItem = {
              ...manualDomicilio,
            };

            // GIIS-B015-04-11 campos 18-21: los selects usan la convención
            // "N - Etiqueta"; se parsea el entero inicial.
            const parseLeadingInt = (raw: FormDataEntryValue | null) =>
              parseInt((raw as string) ?? "", 10);
            const seAutodenominaAfromexicano = parseLeadingInt(
              formData.get("seAutodenominaAfromexicano"),
            );
            const seConsideraIndigena = parseLeadingInt(
              formData.get("seConsideraIndigena"),
            );
            const migrante = parseLeadingInt(formData.get("migrante"));

            // Regla de derivación campo 21 (paisProcedencia):
            // migrante=2 (Internacional) -> catalogKey del país (≠142 México)
            // migrante=1 o 3 (Nacional/Retornado) -> 142
            // migrante=0 o -1 -> -1
            let paisProcedencia: number;
            if (migrante === 2) {
              if (!manualPaisProcedencia?.catalogKey) {
                toast.error("Selecciona el país de procedencia del catálogo");
                return;
              }
              paisProcedencia = manualPaisProcedencia.catalogKey;
            } else if (migrante === 1 || migrante === 3) {
              paisProcedencia = 142;
            } else {
              paisProcedencia = -1;
            }
            const patientIdentification: PatientIdentification = {
              names: formData.get("names") as string,
              middleName: formData.get("middleName") as string,
              lastName: formData.get("lastName") as string,
              sex,
              birthDate: formData.get("birthDate") as string,
              birthPlace: [
                manualBirthLocalizacion.estado?.nombre,
                manualBirthLocalizacion.pais.nombre,
              ]
                .filter(Boolean)
                .join(", "),
              nacimientoLocalizacion:
                manualBirthLocalizacion as LocalizacionItem,
              domicilioLocalizacion:
                Object.keys(domicilioLocalizacion).length > 0
                  ? domicilioLocalizacion
                  : undefined,
              genre: formData.get("genre") as string,
              derechohabiencia: manualAfiliaciones,
              curp: (formData.get("curp") as string) || "XXXX999999XXXXXX99",
              tel: (formData.get("tel") as string) || undefined,
              estadoCivil: (formData.get("estadoCivil") as string) || undefined,
              ocupacion: (formData.get("ocupacion") as string) || undefined,
              escolaridad: (formData.get("escolaridad") as string) || undefined,
              seAutodenominaAfromexicano,
              seConsideraIndigena,
              migrante,
              paisProcedencia,
            };
            setCurrentSessionData({
              ...currentSessionData,
              patientIdentification,
              method: "text",
            });
            router.push(`${base}/newPatient/clinicalRecord`);
          }}
          inputList={[
            {
              type: "text",
              identifier: "curp",
              currentValue: idPrefill?.curp,
              label: "CURP (opcional)",
              validations: { minLength: 18, maxLength: 18, trim: true },
            },
            {
              type: "text",
              identifier: "names",
              currentValue: idPrefill?.names,
              label: "Nombre(s)",
              required: true,
              validations: {
                minLength: 2,
                maxLength: 50,
                trim: true,
                allowedSpecials: "-,./'¨",
                noConsecutiveSpecials: true,
              },
            },
            {
              type: "text",
              identifier: "middleName",
              currentValue: idPrefill?.middleName,
              label: "Apellido Paterno",
              required: true,
              validations: {
                minLength: 2,
                maxLength: 50,
                trim: true,
                allowedSpecials: "-,./'¨",
                noConsecutiveSpecials: true,
              },
            },
            {
              type: "text",
              identifier: "lastName",
              currentValue: idPrefill?.lastName,
              label: "Apellido Materno",
              required: true,
              validations: {
                minLength: 2,
                maxLength: 50,
                trim: true,
                allowedSpecials: "-,./'¨",
                noConsecutiveSpecials: true,
              },
            },
            {
              type: "select",
              identifier: "sex",
              currentValue: idPrefill?.sex,
              label: "Sexo Biológico",
              options: ["Masculino", "Femenino", "Intersexual"],
              required: true,
            },
            {
              type: "select",
              identifier: "genre",
              currentValue: idPrefill?.genre,
              label: "Identidad de Género",
              options: [
                "Masculino",
                "Femenino",
                "Transgénero",
                "Transexual",
                "Travesti",
                "Intersexual",
                "Otro",
                "No Especificado",
              ],
              required: true,
            },
            {
              type: "date",
              identifier: "birthDate",
              currentValue: idPrefill?.birthDate,
              label: "Fecha de Nacimiento",
              required: true,
              validations: {
                isDate: true,
                notFuture: true,
                maxAgeYears: 120,
              },
            },
            {
              type: "custom",
              identifier: "BirthPaisSearch",
              label: "País de Nacimiento",
              required: true,
              children: (
                <PaisesSearchCC
                  identifier="BirthPaisSearch"
                  currentValue={manualBirthLocalizacion.pais?.nombre}
                  // placeholder="País de Nacimiento"
                  onSelect={handleManualBirthPaisSelect}
                  onClear={() => {
                    setManualBirthLocalizacion({});
                    setManualBirthIsMexico(null);
                  }}
                />
              ),
            },
            {
              type: "custom",
              identifier: "BirthEntFedSearch",
              label: "Entidad Federativa de Nacimiento",
              required: manualBirthIsMexico === true,
              children: (
                <EntFedSearchCC
                  identifier="BirthEntFedSearch"
                  currentValue={manualBirthLocalizacion.estado?.nombre}
                  placeholder="Entidad Federativa de Nacimiento"
                  onSelect={handleManualBirthEntFedSelect}
                  onClear={() =>
                    setManualBirthLocalizacion((prev) => ({
                      ...prev,
                      estado: undefined,
                    }))
                  }
                  disabled={manualBirthIsMexico !== true}
                />
              ),
            },
            {
              type: "custom",
              identifier: "DomicilioSearch",
              label: "Domicilio",
              required: true,
              children: (
                <DomicilioSearchCC
                  identifier="DomicilioSearch"
                  onSelect={handleManualDomicilioSelect}
                  onClear={() => setManualDomicilio({})}
                />
              ),
            },
            // GIIS-B015-04-11 campos 18-20: autoadscripción étnica y condición migratoria
            {
              type: "select",
              identifier: "seAutodenominaAfromexicano",
              label: "¿Se autodenomina afromexicano?",
              options: ["0 - No", "1 - Sí", "2 - No responde", "3 - No sabe"],
              required: true,
            },
            {
              type: "select",
              identifier: "seConsideraIndigena",
              label: "¿Se considera indígena?",
              options: ["0 - No", "1 - Sí", "2 - No responde", "3 - No sabe"],
              required: true,
            },
            {
              type: "select",
              identifier: "migrante",
              label: "Condición migratoria",
              options: [
                "0 - No",
                "1 - Nacional",
                "2 - Internacional",
                "3 - Retornado",
              ],
              required: true,
              onChange: (value: string) => {
                const parsed = parseInt(value, 10);
                setManualMigrante(Number.isNaN(parsed) ? null : parsed);
                if (parsed !== 2) setManualPaisProcedencia(undefined);
              },
            },
            {
              type: "custom",
              identifier: "derechohabiencia",
              label: "Derechohabiencia",
              required: true,
              children: (
                <AfiliacionesSearchCC
                  identifier="derechohabiencia"
                  title="Derechohabiencia (selecciona una o varias)"
                  initialSelected={manualAfiliaciones}
                  onSelect={handleManualAfiliacionesSelect}
                  onClear={() => setManualAfiliaciones([])}
                />
              ),
            },
            // Solo se captura el país de procedencia cuando la migración es internacional
            ...(manualMigrante === 2
              ? [
                  {
                    type: "custom" as const,
                    identifier: "PaisProcedenciaSearch",
                    label: "País de Procedencia",
                    required: true,
                    children: (
                      <PaisesSearchCC
                        identifier="PaisProcedenciaSearch"
                        placeholder="País de Procedencia"
                        onSelect={handleManualPaisProcedenciaSelect}
                        onClear={() => setManualPaisProcedencia(undefined)}
                      />
                    ),
                  },
                ]
              : []),
          ]}
        />
      </div>,
    ],
  };

  return (
    <section className="NewPatientContainer">
      {currentSessionData.currentRecord ? (
        <ConfirmMedRecord />
      ) : currentSessionData.toBeAdded !== "init" ? (
        AddPatientDocFlow[currentSessionData.toBeAdded][
          currentSessionData.currentStep
        ]
      ) : null}
    </section>
  );
};

export default NewPatientIndex;
