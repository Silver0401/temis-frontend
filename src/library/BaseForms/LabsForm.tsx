"use client";

import FormCC from "@/components/Form-CC";
import LabValuesEditorCC, {
  LabValueRow,
} from "@/components/LabValuesEditor-CC";
import { Save_Laboratories_Custom } from "@/e2e/server/FeathersAPI";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useContext, useMemo, useState } from "react";
import { useGlobalContext } from "@/e2e/globalContext";
import { DashboardContext } from "@/e2e/dashboardContext";
import { toast } from "sonner";
import { GlobalModalDefault } from "@/scripts/Constants";

/**
 * Alta de resultados de laboratorio.
 *
 * Antes ofrecía tres entradas (texto libre, PDF e imagen) y las tres terminaban
 * en un modelo de lenguaje que extraía los valores. Ahora hay una sola: el
 * médico captura renglón por renglón contra el catálogo.
 */
const LabsForm: React.FC<FormActionGeneric> = ({
  PatientInfo,
  onAddNewDoc,
  colorSchema,
}) => {
  const queryClient = useQueryClient();
  const { setCurrentSessionData, setDashboardModal, currentSessionData } =
    useContext(DashboardContext);
  const { feathersFetchCC } = useGlobalContext();
  const [labValues, setLabValues] = useState<LabValueRow[]>([]);

  const isTemporalPatient =
    PatientInfo.LUID === "synthesized-temporal-patient";

  const InputListOptions: Array<InputCCprops> = useMemo(() => {
    const base: Array<InputCCprops> = [
      {
        type: "text",
        placeholder: "Nombre del Estudio o Estudios",
        identifier: "labsName",
        required: true,
      },
      {
        label: "Fecha de Toma",
        type: "date",
        identifier: "labsDate",
        required: true,
      },
    ];

    if (isTemporalPatient) return base;

    return [
      base[0],
      {
        type: "select",
        placeholder: "Diagnóstico Asociado",
        identifier: "labsDxId",
        options: PatientInfo.records[0].Diagnosis.map(
          (dx) => `${dx.Name} | ${dx.id}`,
        ),
        required: true,
      },
      base[1],
    ];
  }, [isTemporalPatient, PatientInfo]);

  const save_labs_mutation = useMutation({
    mutationFn: async (formValues: FormData) => {
      const reqProps = await Save_Laboratories_Custom({
        name: formValues.get("labsName") as string,
        dateTaken: formValues.get("labsDate") as string,
        patientId: PatientInfo._id,
        diagnosisId: (
          (formValues.get("labsDxId") as string) || ""
        ).split("|")[1]?.trim(),
        values: labValues,
      });
      return await feathersFetchCC<LabSomaResponse>(reqProps);
    },
    onSuccess() {
      queryClient.refetchQueries({
        queryKey: [`fetching_patient_laboratories_${PatientInfo._id}`],
      });
      onAddNewDoc && onAddNewDoc(undefined);
    },
  });

  const SaveDataToSessionObject = (formValues: FormData) => {
    setCurrentSessionData({
      ...currentSessionData,
      extraData: {
        ...currentSessionData.extraData,
        Labs: [
          ...currentSessionData.extraData.Labs,
          {
            values: labValues,
            dateTaken: formValues.get("labsDate") as string,
            name: formValues.get("labsName") as string,
          },
        ],
      },
    });

    toast.success("Laboratorios agregados");

    setDashboardModal(GlobalModalDefault);
  };

  return (
    <div className="innerDocForm">
      <FormCC
        identifier="labsCaptureForm"
        titlesStyle={{
          title: { alignSelf: "center" },
          subtitle: { alignSelf: "center", textAlign: "center" },
        }}
        submitButtonStyles={{
          text: "Agregar",
        }}
        colorSchema={colorSchema}
        title={"Sube Laboratorios"}
        subtitle={`Llena la información para agregar resultados de laboratorio al expediente de ${PatientInfo.personalInfo.names} ${PatientInfo.personalInfo.middleName}`}
        inputList={InputListOptions}
        onSubmit={(formValues) => {
          if (!labValues.length) {
            toast.error("Captura al menos un resultado de laboratorio");
            return;
          }

          if (isTemporalPatient) {
            SaveDataToSessionObject(formValues);
            return;
          }

          save_labs_mutation.mutate(formValues);
        }}
      />

      <LabValuesEditorCC
        values={labValues}
        onChange={setLabValues}
        colorSchema={colorSchema}
      />
    </div>
  );
};

export default LabsForm;
