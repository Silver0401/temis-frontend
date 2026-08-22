import React, { useContext, useEffect, useState } from "react";
import ClinicalTextArea from "@/library/Dashboard/ClinicalTextArea";
import { Get_Patient_Records, Update_Record } from "@/e2e/server/FeathersAPI";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GlobalContext, useGlobalContext } from "@/e2e/globalContext";
import { useMutation } from "@tanstack/react-query";
import { MongoDbIdDateRetriever } from "@/scripts/Generator";
import LoaderCC from "@/components/Loader-CC";
import ButtonCC from "@/components/Button-CC";

const HistoryVersions: React.FC<SectionProps> = ({
  PatientInfo,
  onAddNewDoc,
}) => {
  const { feathersFetchCC } = useGlobalContext();
  const queryClient = useQueryClient();
  const [displayedText, setDisplayedText] = useState(
    PatientInfo.records[0].ClinicalHistory,
  );
  const [trainStation, setTrainStation] = useState(0);
  const [addContainerToggled, setAddContainerToggled] =
    useState<boolean>(false);

  const { isPending, data } = useQuery({
    queryFn: async () => {
      const req = await Get_Patient_Records(PatientInfo._id);
      return feathersFetchCC<Array<MedRecord>>(req);
    },
    refetchOnWindowFocus: false,
    queryKey: [`fetching_user_records_${PatientInfo._id}`],
  });

  const update_patient_mutation = useMutation({
    mutationFn: async (clinicalHistory: string) => {
      const req = await Update_Record(PatientInfo.records[0]._id, {
        ...PatientInfo.records[0],
        ClinicalHistory: clinicalHistory,
      });
      return await feathersFetchCC(req);
    },
    onSettled(data) {
      if (data?.type === "success") {
        queryClient.refetchQueries({
          queryKey: ["fetching_user_patients"],
        });
      }
    },
  });

  useEffect(() => {
    if (!isPending) {
      // console.log("Train Station changed:", trainStation);
      setDisplayedText(`${data?.data[trainStation].ClinicalHistory}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainStation, isPending]);

  return (
    <section className="HistoryVersions">
      <div className="TextContainer">
        <ClinicalTextArea
          currentValue={displayedText}
          identifier="CHDividerCCH"
          mutation={update_patient_mutation}
          onChange={(text) => setDisplayedText(text)}
          disableSessionSave
        />
      </div>
      <div
        className="VersionsContainer"
        id={addContainerToggled ? "Toggled" : "NotToggled"}
      >
        <h3>{"Historial de Versiones"}</h3>
        <div className="BottomContainer">
          {isPending ? (
            <LoaderCC />
          ) : (
            <>
              <div className="TimelineContainer">
                {data?.data.map((_version, index) => {
                  return <div className="rail" key={`${index}`}></div>;
                })}
                <div
                  className="train"
                  style={{ transform: `translateY(${trainStation * 25}px)` }}
                />
              </div>
              <div className="LinesContainer">
                {data?.data.map((version, index) => {
                  return (
                    <div
                      className="versionLine"
                      key={`${version._id}`}
                      onClick={() => setTrainStation(index)}
                    >
                      <p>{`${version.Entry.type} - ${MongoDbIdDateRetriever(
                        version._id,
                      )}`}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <div className="ButtonConatiner">
          <ButtonCC
            type="Phantom"
            onClick={() => onAddNewDoc && onAddNewDoc("CCH")}
            text="Nuevo Documento"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path
                  fillRule="evenodd"
                  d="M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875ZM12.75 12a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V18a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V12Z"
                  clipRule="evenodd"
                />
                <path d="M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25Z" />
              </svg>
            }
          />
        </div>
      </div>
    </section>
  );
};

export default HistoryVersions;
