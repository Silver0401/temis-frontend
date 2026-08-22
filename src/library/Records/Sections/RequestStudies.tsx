import React, { useContext, useState } from "react";
import { GlobalContext, useGlobalContext } from "@/e2e/globalContext";
import InputCC from "@/components/Input-CC";
import { useQuery } from "@tanstack/react-query";
import ActionCC from "@/components/Action-CC";
import { Get_Patient_Orders } from "@/e2e/server/FeathersAPI";
import FancyLoader from "@/library/Generics/Loaders/FancyLoader";
import ButtonCC from "@/components/Button-CC";
import OrderCC from "@/components/Order-CC";
import { Verify_Login } from "@/e2e/server/Queries";
import IconsCC from "@/assets/icons/IconsCC";

const RequestStudes: React.FC<SectionProps> = ({
  PatientInfo,
  onAddNewDoc,
}) => {
  const { feathersFetchCC, getAccessToken } = useGlobalContext();
  const [searchedDrug, setSearchedDrug] = useState<string>("");

  const { isLoading: userLoading, data: userData } = useQuery(
    Verify_Login(getAccessToken()),
  );

  const { isPending, data } = useQuery({
    queryFn: async () => {
      const req = await Get_Patient_Orders(PatientInfo._id);
      return feathersFetchCC<OrdersResponse[]>(req);
    },

    refetchOnWindowFocus: false,
    queryKey: [`fetching_patient_drugs_${PatientInfo._id}`],
  });

  return (
    <section className="RequestStudies" id="GraphsSectionContainer">
      {isPending || userLoading ? (
        <FancyLoader bg="translucid" />
      ) : userData ? (
        <div className="GraphsContainer">
          {data?.data.length === 0 ? (
            <div className="NoGraphsContainer">
              <ActionCC
                text="El paciente no tiene solicitudes creadas"
                button="Agregar"
                onClick={() => onAddNewDoc && onAddNewDoc("Request")}
                emptyIcon={IconsCC.Request}
              />
            </div>
          ) : (
            <div className="TopContainer">
              <div className="titleCont">
                <ButtonCC
                  type="Phantom"
                  classname="AddNewGraphDataButton"
                  onClick={() => {
                    onAddNewDoc && onAddNewDoc("Request");
                  }}
                  styles={{ marginRight: "15px" }}
                  icon={
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
                  }
                />

                <h2>{"Buscar Solicitudes"}</h2>
              </div>

              <InputCC
                type="text"
                identifier="SearchOrdersInput"
                onChange={(e) => setSearchedDrug(e)}
              />
            </div>
          )}

          <div className="BottomContainer">
            {data?.data.map((order) => {
              return order._id === "addNewDrug" ? (
                <div className="LinearAddNewLab" key={order._id}>
                  <ActionCC
                    key={order._id}
                    text="Receta más medicamentos"
                    button="Recetar"
                    onClick={() => onAddNewDoc && onAddNewDoc("Drugs")}
                    emptyIcon={IconsCC.Request}
                  />
                </div>
              ) : (
                <OrderCC
                  key={order._id}
                  orders={order}
                  patientData={PatientInfo}
                  userData={userData?.data.user}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default RequestStudes;
