import React, { useEffect, useMemo, useState } from "react";
import DrugSearchCC from "@/components/SearchInputs/DrugSearch-CC";
import InputCC from "@/components/Input-CC";
import ButtonCC from "@/components/Button-CC";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save_Drugs } from "@/e2e/server/FeathersAPI";
import { useGlobalContext } from "@/e2e/globalContext";
import { Verify_Login } from "@/e2e/server/Queries";
import PdfViewerCC from "@/components/PdfViewer-CC";

const Prescriber: React.FC<PrescriptionSectionProps> = ({
  PatientInfo,
  onAddNewDoc,
  colorSchema,
  currentPrescriptions,
  onPrescriptionsChange,
}) => {
  const queryClient = useQueryClient();
  const { feathersFetchCC, getAccessToken, setGlobalModal } =
    useGlobalContext();
  const { data: userData } = useQuery(Verify_Login(getAccessToken()));
  const [currentMedicationList, setCurrentMedicationList] = useState<
    Array<MedicationProps>
  >([]);

  const [selectedDx, setSelectedDx] = useState<string | undefined>(undefined);

  const listCounter = useMemo((): number => {
    let finalCounter = 1;

    currentMedicationList.map((medProps) => {
      if (medProps.drugPresentation && medProps.indication) {
        finalCounter++;
      }
    });
    return finalCounter;
  }, [currentMedicationList]);

  const Add_Drug_Prescription = useMutation({
    mutationFn: async () => {
      const values: DrugValues[] = currentMedicationList
        .filter((med) => med.drugPresentation && med.indication)
        .map((med) => ({
          name: med.drugPresentation as string,
          indication: med.indication as string,
        }));

      const DataRequest: PrescriptionRequest = selectedDx
        ? {
            values,
            patientId: PatientInfo._id,
            diagnosisId: selectedDx.split("|")[1].trim(),
          }
        : {
            values,
            patientId: PatientInfo._id,
          };
      const req = await Save_Drugs(DataRequest);
      return await feathersFetchCC(req);
    },
    onSuccess() {
      queryClient.refetchQueries({
        queryKey: [`fetching_patient_drugs_${PatientInfo._id}`],
      });
      onAddNewDoc && onAddNewDoc(undefined);
    },
  });

  useEffect(() => {
    if (currentPrescriptions && currentPrescriptions?.length > 0) {
      setCurrentMedicationList(currentPrescriptions);
    }
  }, [currentPrescriptions]);

  useEffect(() => {
    onPrescriptionsChange && onPrescriptionsChange(currentMedicationList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMedicationList]);

  const OpenPDFViewer = () => {
    if (userData)
      setGlobalModal({
        Settings: {
          identifier: "PrescriptionPDF",
          size: "extra large",
          animation: "popUp",
        },
        Component: (
          <PdfViewerCC
            colorSchema="night"
            prescriptionProps={{
              patientData: PatientInfo,
              userData: userData?.data.user,
              drugs: {
                _id: PatientInfo.LUID,
                patientId: PatientInfo._id,
                diagnosisId: "12345",
                type: "local",
                values: currentMedicationList,
              },
            }}
            options={{
              // @ts-ignore
              itemsList: currentMedicationList.map(
                (drug) => drug.drugPresentation,
              ),
              dxList: [],
            }}
          />
        ),
      });
  };

  return (
    <div className={`Prescriber Prescriber-${colorSchema}`}>
      <h4 className="title">{"Prescribe Fármacos"}</h4>
      <p className="subtitle">
        {"Ve llenando la información de todos los fármacos que quieras recetar"}
      </p>
      {PatientInfo.LUID !== "synthesized-temporal-patient" ? (
        <div className="DxChooser">
          <InputCC
            type={"select"}
            identifier={"DxPrescriberSelect"}
            label="Diagnóstico Asociado"
            options={
              PatientInfo.records?.[0]?.Diagnosis?.map(
                (dx) => `${dx.Name} | ${dx.id}`,
              ) ?? []
            }
            onChange={(selectedDx) => setSelectedDx(selectedDx)}
            styles={{ container: { width: "100%" } }}
          />
        </div>
      ) : null}

      {[...Array(listCounter)].map((_, count) => {
        return (
          <div className="DrugPrescCont" key={`DrugPrescCont${count}`}>
            <DrugSearchCC
              colorSchema={colorSchema === "day" ? "night" : "day"}
              currentValue={
                currentMedicationList[count]
                  ? currentMedicationList[count].drugPresentation
                  : undefined
              }
              onDrugSelect={(drugName) => {
                setCurrentMedicationList((prevList) => {
                  return [
                    ...prevList,
                    {
                      drugPresentation: drugName,
                      indication: undefined,
                    },
                  ];
                });
              }}
              onClear={() => {
                setCurrentMedicationList((prevList) => {
                  return prevList.filter((_, index) => index !== count);
                });
              }}
            />
            {currentMedicationList[count] &&
              currentMedicationList[count].drugPresentation && (
                <>
                  <div className="fillerBar" />
                  <InputCC
                    type="text"
                    key={currentMedicationList[count].drugPresentation}
                    placeholder="Indicación ej: 1 tableta cada 8 horas por 7 dias"
                    identifier={`DrugPrescInput`}
                    debouncer
                    colorSchema={colorSchema === "day" ? "night" : "day"}
                    currentValue={
                      currentMedicationList[count]
                        ? currentMedicationList[count].indication
                        : undefined
                    }
                    styles={{ container: { width: "100%" } }}
                    onChange={(text) => {
                      if (text.length > 0) {
                        setCurrentMedicationList((prevList) =>
                          prevList.map((item, index) =>
                            index === count
                              ? { ...item, indication: text } // update only index 0
                              : item,
                          ),
                        );
                      }
                    }}
                  />
                </>
              )}
          </div>
        );
      })}
      <ButtonCC
        width="block"
        text={
          PatientInfo.LUID === "synthesized-temporal-patient"
            ? "Imprimir"
            : "Prescribir"
        }
        type="Phantom"
        icon={
          PatientInfo.LUID === "synthesized-temporal-patient" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6"
            >
              <path
                fillRule="evenodd"
                d="M7.875 1.5C6.839 1.5 6 2.34 6 3.375v2.99c-.426.053-.851.11-1.274.174-1.454.218-2.476 1.483-2.476 2.917v6.294a3 3 0 0 0 3 3h.27l-.155 1.705A1.875 1.875 0 0 0 7.232 22.5h9.536a1.875 1.875 0 0 0 1.867-2.045l-.155-1.705h.27a3 3 0 0 0 3-3V9.456c0-1.434-1.022-2.7-2.476-2.917A48.716 48.716 0 0 0 18 6.366V3.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM16.5 6.205v-2.83A.375.375 0 0 0 16.125 3h-8.25a.375.375 0 0 0-.375.375v2.83a49.353 49.353 0 0 1 9 0Zm-.217 8.265c.178.018.317.16.333.337l.526 5.784a.375.375 0 0 1-.374.409H7.232a.375.375 0 0 1-.374-.409l.526-5.784a.373.373 0 0 1 .333-.337 41.741 41.741 0 0 1 8.566 0Zm.967-3.97a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H18a.75.75 0 0 1-.75-.75V10.5ZM15 9.75a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V10.5a.75.75 0 0 0-.75-.75H15Z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6"
            >
              <path
                fillRule="evenodd"
                d="M19.253 2.292a.75.75 0 0 1 .955.461A28.123 28.123 0 0 1 21.75 12c0 3.266-.547 6.388-1.542 9.247a.75.75 0 1 1-1.416-.494c.94-2.7 1.458-5.654 1.458-8.753s-.519-6.054-1.458-8.754a.75.75 0 0 1 .461-.954Zm-14.227.013a.75.75 0 0 1 .414.976A23.183 23.183 0 0 0 3.75 12c0 3.085.6 6.027 1.69 8.718a.75.75 0 0 1-1.39.563c-1.161-2.867-1.8-6-1.8-9.281 0-3.28.639-6.414 1.8-9.281a.75.75 0 0 1 .976-.414Zm4.275 5.052a1.5 1.5 0 0 1 2.21.803l.716 2.148L13.6 8.246a2.438 2.438 0 0 1 2.978-.892l.213.09a.75.75 0 1 1-.584 1.381l-.214-.09a.937.937 0 0 0-1.145.343l-2.021 3.033 1.084 3.255 1.445-.89a.75.75 0 1 1 .786 1.278l-1.444.889a1.5 1.5 0 0 1-2.21-.803l-.716-2.148-1.374 2.062a2.437 2.437 0 0 1-2.978.892l-.213-.09a.75.75 0 0 1 .584-1.381l.214.09a.938.938 0 0 0 1.145-.344l2.021-3.032-1.084-3.255-1.445.89a.75.75 0 1 1-.786-1.278l1.444-.89Z"
                clipRule="evenodd"
              />
            </svg>
          )
        }
        loading={Add_Drug_Prescription.isPending}
        onClick={() => {
          if (PatientInfo.LUID === "synthesized-temporal-patient" && userData) {
            OpenPDFViewer();
          } else {
            Add_Drug_Prescription.mutate();
          }
        }}
      />
    </div>
  );
};

export default Prescriber;
