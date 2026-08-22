import React, { useContext, useEffect, useMemo, useState } from "react";
import InputCC from "@/components/Input-CC";
import ButtonCC from "@/components/Button-CC";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Create_Patient_Orders } from "@/e2e/server/FeathersAPI";
import { GlobalContext, useGlobalContext } from "@/e2e/globalContext";
import { PopularOrderedStudiesIndexed } from "@/scripts/Constants";
import { toast } from "sonner";
import { Verify_Login } from "@/e2e/server/Queries";
import { PrintPDFOrder } from "@/scripts/Generator";

const OrdersMaker: React.FC<OrdersSectionProps> = ({
  PatientInfo,
  onAddNewDoc,
  currentOrders,
  onOrdersChange,
  colorSchema,
}) => {
  const queryClient = useQueryClient();
  const { feathersFetchCC, getAccessToken } = useGlobalContext();
  const { data: userData } = useQuery(Verify_Login(getAccessToken()));
  const [currentOrdersList, setCurrentOrdersList] = useState<Array<Order>>([]);
  const [selectedDx, setSelectedDx] = useState<string | undefined>(undefined);

  const listCounter = useMemo((): number => {
    let finalCounter = 1;

    currentOrdersList.map((medProps) => {
      if (medProps.request && medProps.observations) {
        finalCounter++;
      }
    });

    return finalCounter;
  }, [currentOrdersList]);

  const Make_Order_Request_Mutation = useMutation({
    mutationFn: async () => {
      const DataRequest: OrdersRequest = selectedDx
        ? {
            ordersArray: currentOrdersList,
            patientId: PatientInfo._id,
            diagnosisId: selectedDx.split("|")[1].trim(),
          }
        : {
            ordersArray: currentOrdersList,
            patientId: PatientInfo._id,
          };

      const req = await Create_Patient_Orders(DataRequest);
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
    if (currentOrders && currentOrders?.length > 0) {
      setCurrentOrdersList(currentOrders);
    }
  }, [currentOrders]);

  useEffect(() => {
    onOrdersChange && onOrdersChange(currentOrdersList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrdersList]);

  return (
    <div className={`Prescriber Prescriber-${colorSchema}`}>
      <h4 className="title">{"Nueva Solicitud de Estudio"}</h4>
      <p className="subtitle">
        {"Escribe los estudios de gabinete o laboratorio que deseas solicitar"}
      </p>
      {PatientInfo.LUID !== "synthesized-temporal-patient" ? (
        <div className="DxChooser">
          <InputCC
            type={"select"}
            label="Diagnóstico Asociado"
            identifier={"DxPrescriberSelect"}
            options={PatientInfo.records[0].Diagnosis.map(
              (dx) => `${dx.Name} | ${dx.id}`,
            )}
            onChange={(selectedDx) => setSelectedDx(selectedDx)}
            styles={{ container: { width: "100%" } }}
          />
        </div>
      ) : null}
      {[...Array(listCounter)].map((_, count) => {
        return (
          <div className="DrugPrescCont" key={`RequestMaker${count}`}>
            <InputCC
              type="text"
              dataList={Object.keys(PopularOrderedStudiesIndexed).map(
                (key) => key,
              )}
              label="Estudio a Solicitar"
              colorSchema={colorSchema}
              currentValue={
                currentOrdersList[count]
                  ? currentOrdersList[count].request
                  : undefined
              }
              identifier={"OrdersAutoListInput"}
              debouncer
              onChange={(orderType) => {
                const orderIsTyped = Object.keys(PopularOrderedStudiesIndexed)
                  .map((key) => key)
                  .includes(orderType);

                if (orderType.length === 0) {
                  if (listCounter === 1) {
                    ("none");
                  } else {
                    setCurrentOrdersList((prevList) => {
                      return prevList.filter((_, index) => index !== count);
                    });
                  }
                } else if (orderIsTyped) {
                  setCurrentOrdersList((prevList) => {
                    const updated = [...prevList];

                    updated[count] = {
                      request: orderType,
                      observations:
                        PopularOrderedStudiesIndexed[orderType as Orders]
                          .defaultObservation,
                    };

                    return updated;
                  });
                } else {
                  toast.error("Tienes que seleccionar un tipo de estudio");
                }
              }}
              styles={{
                container: { width: "100%" },
              }}
            />
            {currentOrdersList[count] && currentOrdersList[count].request && (
              <>
                <div className="fillerBar" />
                <InputCC
                  type="text"
                  key={currentOrdersList[count].observations}
                  placeholder="Anota aquí indicaciones u observaciones del estudio..."
                  identifier={`RquestMakerInputObs`}
                  debouncer
                  colorSchema={colorSchema}
                  currentValue={currentOrdersList[count].observations}
                  styles={{ container: { width: "100%" } }}
                  onChange={(text) => {
                    if (text.length > 0) {
                      setCurrentOrdersList((prevList) =>
                        prevList.map((item, index) =>
                          index === count
                            ? { ...item, observations: text } // update only index 0
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
            : "Crear Solicitud"
        }
        type="Phantom"
        loading={Make_Order_Request_Mutation.isPending}
        onClick={() => {
          if (PatientInfo.LUID === "synthesized-temporal-patient" && userData) {
            PrintPDFOrder(
              {
                userData: userData.data.user,
                patientData: PatientInfo,
                orders: {
                  ordersArray: currentOrdersList,
                  _id: PatientInfo.LUID,
                  patientId: PatientInfo._id,
                },
              },
              "qr",
            );
          } else {
            Make_Order_Request_Mutation.mutate();
          }
        }}
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
                d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z"
                clipRule="evenodd"
              />
              <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
            </svg>
          )
        }
      />
    </div>
  );
};

export default OrdersMaker;
