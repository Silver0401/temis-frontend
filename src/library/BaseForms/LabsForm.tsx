"use client";

import FormCC from "@/components/Form-CC";
import CardsDisplayCC from "@/components/CardsDisplay-CC";
import LoaderCC from "@/components/Loader-CC";
import IconsCC from "@/assets/icons/IconsCC";
import { Save_Laboratories } from "@/e2e/server/FeathersAPI";
import { Upload_File } from "@/e2e/server/AxiosAPI";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useContext, useMemo, useState } from "react";
import { useGlobalContext } from "@/e2e/globalContext";
import { DashboardContext } from "@/e2e/dashboardContext";
import { toast } from "sonner";
import { GlobalModalDefault } from "@/scripts/Constants";

/**
 * Alta de resultados de laboratorio, igual que en Cronos: texto libre, PDF o
 * foto. PDF/foto pasan por `uploads` (AIImgExtraction) para sacar el texto, el
 * médico lo revisa y al guardar el hook `format_labs` lo estructura con IA.
 * Única diferencia: iconos en lugar de Lottie (purgados en Temis).
 */
const LabsForm: React.FC<FormActionGeneric> = ({
  PatientInfo,
  onAddNewDoc,
  colorSchema,
  phoneImg,
  inverseContentSchema,
}) => {
  const queryClient = useQueryClient();
  const { setCurrentSessionData, setDashboardModal, currentSessionData } =
    useContext(DashboardContext);
  const { axiosFetchCC } = useGlobalContext();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [methodType, setMethodType] = useState<methodTypes>("init");
  const [transpiledFileText, setTranspiledFileText] = useState<string>("");
  const finalSchema = useMemo(() => {
    if (inverseContentSchema) {
      return colorSchema === "day" ? "night" : "day";
    }
    return colorSchema;
  }, [inverseContentSchema, colorSchema]);

  const isTemporalPatient =
    PatientInfo.LUID === "synthesized-temporal-patient";

  const InputListOptions: Array<InputCCprops> = useMemo(() => {
    const fullText: InputCCprops = {
      type: "textarea",
      placeholder: "Escribe aquí los laboratorios",
      identifier: "labsFullText",
      required: true,
      initialValue: transpiledFileText,
    };
    const name: InputCCprops = {
      type: "text",
      placeholder: "Nombre del Estudio o Estudios",
      identifier: "labsName",
      required: true,
    };
    const date: InputCCprops = {
      label: "Fecha de Toma",
      type: "date",
      identifier: "labsDate",
      required: true,
    };

    if (isTemporalPatient) return [fullText, name, date];

    return [
      fullText,
      name,
      {
        type: "select",
        placeholder: "Diagnóstico Asociado",
        identifier: "labsDxId",
        options:
          PatientInfo.records?.[0]?.Diagnosis?.map(
            (dx) => `${dx.Name} | ${dx.id}`,
          ) ?? [],
        required: true,
      },
      date,
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transpiledFileText]);

  const upload_file_mutation = useMutation({
    mutationFn: async ({ FileList }: { FileList: string[] }) => {
      const req = await Upload_File({
        FileList,
        Type: methodType === "file" ? "file" : "image",
        Action: "AIImgExtraction",
        Description: "File uploaded to extract labs",
      });
      return await axiosFetchCC<UploadPhotoResponse>(req);
    },
    onSettled(data) {
      if (data) {
        setTranspiledFileText(data.data.Response);
        setCurrentStep(3);
      }
    },
    onError() {
      toast.error("Error procesando archivo, intenta nuevamente");
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
            baseText: formValues.get("labsFullText") as string,
            dateTaken: formValues.get("labsDate") as string,
            name: formValues.get("labsName") as string,
          },
        ],
      },
    });

    toast.success("Laboratorios agregados");

    setDashboardModal(GlobalModalDefault);
  };

  if (upload_file_mutation.isPending) {
    return (
      <div className="innerDocForm">
        <LoaderCC schema={finalSchema} />
        <p style={{ textAlign: "center" }}>Extrayendo datos…</p>
      </div>
    );
  }

  if (currentStep === 1) {
    return (
      <CardsDisplayCC
        title="Agregar Laboratorios"
        schema={finalSchema}
        subtitle="A partir de:"
        itemsList={[
          {
            size: "md",
            name: "TextOpt",
            title: "Texto",
            subtitle: "Escribe manualmente los laboratorios",
            icon: IconsCC.Pencil,
            onClick: () => {
              setCurrentStep(3);
              setMethodType("text");
            },
          },
          {
            size: "md",
            name: "FileOpt",
            title: "Archivo",
            subtitle: "Incluyendo un documento de tipo pdf",
            icon: IconsCC.UploadFile,
            onClick: () => {
              setCurrentStep(2);
              setMethodType("file");
            },
          },
          {
            size: "md",
            name: "ImgOpt",
            title: "Imágen",
            subtitle: "Una foto o imágen con los laboratorios",
            icon: IconsCC.Image,
            onClick: () => {
              setCurrentStep(2);
              setMethodType("image");
            },
          },
        ]}
      />
    );
  }

  if (currentStep === 2) {
    return (
      <div className="innerDocForm">
        <FormCC
          identifier="labsAnalyzerFormImg"
          titlesStyle={{
            title: { alignSelf: "center" },
            subtitle: { alignSelf: "center", textAlign: "center" },
          }}
          submitButtonStyles={{ text: "Continuar" }}
          colorSchema={colorSchema}
          title={`Sube ${methodType === "image" ? "la Foto" : "el Archivo"} de los Labs`}
          subtitle={`Sube ${methodType === "image" ? "la Foto" : "el Archivo"} que contenga el reporte de laboratorios a añadir`}
          inputList={[
            {
              type: "file",
              fileTypes: methodType === "file" ? "documents" : "images",
              placeholder:
                methodType === "file" ? "Sube tu pdf" : "Sube tu imágen",
              identifier: "labsFiles",
              required: true,
              showPhoneQr: true,
              phoneUploadFile: phoneImg,
              limitFileQuantity: 3,
            },
          ]}
          onSubmit={(formValues) => {
            upload_file_mutation.mutate({
              FileList: [formValues.get("0labsFiles") as string],
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="innerDocForm">
      <FormCC
        identifier="labsAnalyzerForm"
        titlesStyle={{
          title: { alignSelf: "center" },
          subtitle: { alignSelf: "center", textAlign: "center" },
        }}
        preloadedData={
          isTemporalPatient
            ? undefined
            : [{ key: "patientId", value: `${PatientInfo._id}` }]
        }
        submitButtonStyles={{ text: "Agregar" }}
        colorSchema={colorSchema}
        title={"Sube Laboratorios"}
        subtitle={`Llena la información para agregar resultados de laboratorio al expediente de ${PatientInfo.personalInfo?.names} ${PatientInfo.personalInfo?.middleName}`}
        inputList={InputListOptions}
        steps={2}
        onFeathersApiAction={isTemporalPatient ? undefined : Save_Laboratories}
        onSubmit={(formValues) => {
          if (isTemporalPatient) {
            SaveDataToSessionObject(formValues);
          }
        }}
        onSuccess={() => {
          if (!isTemporalPatient) {
            queryClient.refetchQueries({
              queryKey: [`fetching_patient_laboratories_${PatientInfo._id}`],
            });
          }
          onAddNewDoc && onAddNewDoc(undefined);
        }}
      />
    </div>
  );
};

export default LabsForm;
