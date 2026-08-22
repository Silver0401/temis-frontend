import FormCC from "@/components/Form-CC";
import { DashboardContext } from "@/e2e/dashboardContext";
import { Save_Gabinet_Img } from "@/e2e/server/AxiosAPI";
import { GabinetImgTypes, GlobalModalDefault } from "@/scripts/Constants";
import { useQueryClient } from "@tanstack/react-query";
import React, { useContext } from "react";
import { toast } from "sonner";

const ImgsForm: React.FC<FormActionGeneric> = ({
  PatientInfo,
  phoneImg,
  onAddNewDoc,
  colorSchema,
}) => {
  const { setCurrentSessionData, currentSessionData, setDashboardModal } =
    useContext(DashboardContext);
  const queryClient = useQueryClient();
  const InputListOptions: Array<InputCCprops> =
    PatientInfo.LUID === "synthesized-temporal-patient"
      ? [
          {
            type: "file",
            identifier: "imgInputForGabinet",
            required: true,
            fileTypes: "images",
            showPhoneQr: true,
            limitFileQuantity: 1,
            phoneUploadFile: phoneImg,
          },
          {
            type: "text",
            label: "Nombre del Estudio",
            identifier: "gabinetName",
            required: true,
          },
          {
            label: "Tipo de Estudio",
            type: "select",
            identifier: "gabinetSelect",
            options: GabinetImgTypes,
            required: true,
          },
          {
            label: "Interpretación",
            type: "text",
            identifier: "gabinetInterpretation",
            required: true,
          },
          {
            label: "Fecha de Realización",
            type: "date",
            identifier: "gabinetDate",
            required: true,
          },
        ]
      : [
          {
            type: "file",
            identifier: "imgInputForGabinet",
            required: true,
            fileTypes: "images",
            showPhoneQr: true,
            phoneUploadFile: phoneImg,
          },
          {
            type: "text",
            label: "Nombre del Estudio",
            identifier: "gabinetName",
            required: true,
          },
          {
            label: "Tipo de Estudio",
            type: "select",
            identifier: "gabinetSelect",
            options: GabinetImgTypes,
            required: true,
          },
          {
            label: "Interpretación",
            type: "text",
            identifier: "gabinetInterpretation",
            required: true,
          },
          {
            type: "select",
            placeholder: "Diagnóstico Asociado",
            identifier: "imagesDxId",
            // fakeHide: PatientInfo.LUID === "synthesized-temporal-patient",
            options:
              PatientInfo.LUID === "synthesized-temporal-patient"
                ? []
                : PatientInfo.records[0].Diagnosis.map(
                    (dx) => `${dx.Name} | ${dx.id}`,
                  ),
            required: true,
            limitFileQuantity: 1,
          },
          {
            label: "Fecha de Realización",
            type: "date",
            identifier: "gabinetDate",
            required: true,
          },
        ];

  const SaveDataToSessionObject = (formValues: FormData) => {
    setCurrentSessionData({
      ...currentSessionData,
      extraData: {
        ...currentSessionData.extraData,
        Imgs: [
          ...currentSessionData.extraData.Imgs,
          {
            Type: formValues.get("gabinetSelect") as GabinetImgs,
            Name: formValues.get("gabinetName") as string,
            Interpretation: formValues.get("gabinetInterpretation") as string,
            DateOfStudy: formValues.get("gabinetDate") as string,
            Image: formValues.get("0imgInputForGabinet") as string,
          },
        ],
      },
    });

    toast.success("Imagenes agregadas");

    setDashboardModal(GlobalModalDefault);
  };

  return (
    <div className="innerDocForm">
      <FormCC
        preloadedData={[{ key: "patientId", value: PatientInfo._id }]}
        identifier="fileAnalyzerForm"
        titlesStyle={{
          title: { alignSelf: "center" },
          subtitle: { alignSelf: "center", textAlign: "center" },
        }}
        steps={
          PatientInfo.LUID === "synthesized-temporal-patient" ? 5 : undefined
        }
        colorSchema={colorSchema}
        title={"Sube un Estudio de Gabinete"}
        subtitle={`Llena la información para agregar un nuevo estudio de gabinete al expediente de ${PatientInfo.personalInfo.names} ${PatientInfo.personalInfo.middleName}`}
        inputList={InputListOptions}
        onSubmit={(formValues) => {
          if (PatientInfo.LUID === "synthesized-temporal-patient") {
            SaveDataToSessionObject(formValues);
          }
        }}
        onAxiosApiAction={
          PatientInfo.LUID === "synthesized-temporal-patient"
            ? undefined
            : Save_Gabinet_Img
        }
        onSuccess={() => {
          queryClient.refetchQueries({
            queryKey: [`fetching_patient_gabinet_imgs_${PatientInfo._id}`],
          });
          onAddNewDoc && onAddNewDoc(undefined);
        }}
      />
    </div>
  );
};

export default ImgsForm;
