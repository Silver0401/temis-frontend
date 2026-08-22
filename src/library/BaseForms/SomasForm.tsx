"use client";

import CardsDisplayCC from "@/components/CardsDisplay-CC";
import FormCC from "@/components/Form-CC";
import { BuildSomasValues, Save_Somatometrias } from "@/e2e/server/FeathersAPI";
import {
  SOMAS_FIELDS,
  GLUCEMIA_TIPO,
  GLUCEMIA_OBTENIDA,
  somasInputId,
} from "@/scripts/somasFields";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useContext, useMemo, useState } from "react";
import { useGlobalContext } from "@/e2e/globalContext";
import { DashboardContext } from "@/e2e/dashboardContext";
import { toast } from "sonner";
import { GlobalModalDefault } from "@/scripts/Constants";

const SomasForm: React.FC<FormActionGeneric> = ({
  PatientInfo,
  phoneImg,
  onAddNewDoc,
  colorSchema,
  inverseContentSchema,
}) => {
  const queryClient = useQueryClient();
  const { setCurrentSessionData, currentSessionData, setDashboardModal } =
    useContext(DashboardContext);
  const { axiosFetchCC } = useGlobalContext();
  // Arranca en el paso 3 (el formulario). La tarjeta-selector se quitó: la
  // única opción viva era "Texto" y las de archivo/imagen llevaban comentadas
  // desde antes, así que era un clic sin decisión. El paso 2 (subida de
  // archivo) se conserva por si vuelven esas entradas.
  const [currentStep, setCurrentStep] = useState<number>(3);
  const [methodType, setMethodType] = useState<methodTypes>("init");
  const [transpiledFileText, setTranspiledFileText] = useState<string>("");
  const [imcValue, setImcValue] = useState<string>("");
  const [glucemiaFilled, setGlucemiaFilled] = useState<boolean>(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    const talla = parseFloat(formData.get(somasInputId("talla")) as string);
    const peso = parseFloat(formData.get(somasInputId("peso")) as string);
    if (talla > 0 && peso > 0) {
      const tallaMts = talla / 100;
      setImcValue((peso / (tallaMts * tallaMts)).toFixed(1));
    }
    const glucemia = parseFloat(
      formData.get(somasInputId("glucemia")) as string,
    );
    setGlucemiaFilled(glucemia > 0);
  };

  const finalSchema = useMemo(() => {
    if (inverseContentSchema) {
      return colorSchema === "day" ? "night" : "day";
    }
    return colorSchema;
  }, [inverseContentSchema, colorSchema]);

  // Los inputs salen del catálogo `SOMAS_FIELDS`: los parámetros son fijos y
  // estaban escritos dos veces, aquí y en el mapeo hacia el backend.
  const vitalsInputGroup = useMemo(
    (): InputGroupCC => ({
      orientation: "horizontal",
      inputs: [
        ...SOMAS_FIELDS.map((field) => ({
          type: "number" as const,
          label: `${field.label} (${field.unit})`,
          identifier: somasInputId(field.key),
          // Glucemia es el único parámetro que puede no medirse en consulta.
          required: field.key !== "glucemia",
          disableSessionSave: true,
          ...(field.key === "imc"
            ? { currentValue: imcValue, readOnly: true }
            : {}),
        })),
        {
          type: "select",
          label: "Tipo",
          options: GLUCEMIA_TIPO.map((o) => o.label),
          identifier: "somasGlucemiaType",
          required: glucemiaFilled,
          disabled: !glucemiaFilled,
          disableSessionSave: true,
        },
        {
          type: "select",
          label: "Obt.",
          options: GLUCEMIA_OBTENIDA.map((o) => o.label),
          identifier: "somasGlucemiaObt",
          required: glucemiaFilled,
          disabled: !glucemiaFilled,
          disableSessionSave: true,
        },
      ],
      step: 1,
    }),
    [imcValue, glucemiaFilled],
  );

  // Solo la fecha: los parámetros van en el grupo de signos vitales. Se
  // retiraron el texto libre "Otros" y el diagnóstico asociado — nada de eso se
  // guarda ya en el documento de somatometría.
  const InputListOptions: Array<InputCCprops> = useMemo(
    () => [
      {
        label: "Fecha de Toma",
        type: "date",
        identifier: "somasDate",
        required: true,
      },
    ],
    [],
  );

  const SaveDataToSessionObject = (formValues: FormData) => {
    setCurrentSessionData({
      ...currentSessionData,
      extraData: {
        ...currentSessionData.extraData,
        Somas: [
          ...currentSessionData.extraData.Somas,
          {
            somasValues: BuildSomasValues(formValues),
            dateTaken: formValues.get("somasDate") as string,
          },
        ],
      },
    });

    toast.success("Somatométricos agregados");

    setDashboardModal(GlobalModalDefault);
  };

  return (
    <div className="innerDocForm">
      <FormCC
        identifier="SomasAnalyzerForm"
        titlesStyle={{
          title: { alignSelf: "center" },
          subtitle: { alignSelf: "center", textAlign: "center" },
        }}
        submitButtonStyles={{
          text: "Agregar",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6"
            >
              <path
                fillRule="evenodd"
                d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
                clipRule="evenodd"
              />
            </svg>
          ),
        }}
        preloadedData={
          PatientInfo.LUID === "synthesized-temporal-patient"
            ? undefined
            : [
                {
                  key: "patientId",
                  value: PatientInfo._id,
                },
              ]
        }
        onChange={handleFormChange}
        colorSchema={"night"}
        title={"Sube Somatométricos"}
        subtitle={`Escribe los signos vitales y somatometrias que quieras agregar al expediente de ${PatientInfo.personalInfo.names} ${PatientInfo.personalInfo.middleName}`}
        inputGroups={[vitalsInputGroup]}
        inputList={InputListOptions}
        onFeathersApiAction={
          PatientInfo.LUID !== "synthesized-temporal-patient"
            ? async (formData: FormData) => {
                return Save_Somatometrias(formData);
              }
            : undefined
        }
        steps={
          PatientInfo.LUID === "synthesized-temporal-patient" ? 2 : undefined
        }
        onSubmit={(formValues) => {
          if (PatientInfo.LUID === "synthesized-temporal-patient") {
            SaveDataToSessionObject(formValues);
          }
        }}
        onSuccess={() => {
          if (PatientInfo.LUID !== "synthesized-temporal-patient") {
            queryClient.refetchQueries({
              queryKey: [`fetching_patient_somatometrias_${PatientInfo._id}`],
            });
          }
          onAddNewDoc && onAddNewDoc(undefined);
        }}
      />
    </div>
  );
};

export default SomasForm;
