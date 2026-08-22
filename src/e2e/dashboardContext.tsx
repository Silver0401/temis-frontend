"use client";

import React, {
  PropsWithChildren,
  useState,
  createContext,
  useRef,
  RefObject,
  useEffect,
  useContext,
} from "react";
import { DefaultSessionData, GlobalModalDefault } from "@/scripts/Constants";
import { DashboardStatesObject } from "@/library/Dashboard/DashboardRegistry";
import { usePathname, useRouter } from "next/navigation";
import ClinicalHistory from "@/library/Records/ClinicalHistory";
import ModalCC from "@/components/Modal-CC";
import { useQueryClient } from "@tanstack/react-query";
import { GlobalContext } from "./globalContext";

interface NewPatientContextProps {
  //  -------- Patient Info Flow -----------
  currentSessionData: SessionData;
  setCurrentSessionData: React.Dispatch<React.SetStateAction<SessionData>>;
  ResetSessionData: ({ withRouter }: { withRouter: boolean }) => void;

  //  -------- Dashboard State -----------
  dashboardState: DashboardStates;
  setDashboardState: React.Dispatch<React.SetStateAction<DashboardStates>>;
  goToDashboardPage: (page: DashboardStates) => void;

  //  -------- Patient's Data -----------
  showPatient: Patient | undefined;
  setShowPatient: React.Dispatch<React.SetStateAction<Patient | undefined>>;
  chRef: RefObject<HTMLDivElement> | null;

  //  -------- Dashboard Modal -----------
  dashboardModal: GlobalModalProps;
  setDashboardModal: React.Dispatch<React.SetStateAction<GlobalModalProps>>;
}

export const DashboardContext = createContext<NewPatientContextProps>({
  currentSessionData: DefaultSessionData,
  setCurrentSessionData: () => {},
  dashboardState: "My Patients",
  setDashboardState: () => {},
  goToDashboardPage: () => {},
  showPatient: undefined,
  setShowPatient: () => {},
  chRef: null,
  ResetSessionData: () => {},
  dashboardModal: GlobalModalDefault,
  setDashboardModal: () => {},
});

export const DashboardContextProvider = React.memo(({
  children,
}: PropsWithChildren) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const [initialRender, setInitialRender] = useState<boolean>(true);
  const { registerLog, getAccessToken } = useContext(GlobalContext);
  const chRef = useRef<HTMLDivElement>(null);
  const [dashboardModalState, setDashboardModalState] =
    useState<boolean>(false);
  const [dashboardModal, setDashboardModal] =
    useState<GlobalModalProps>(GlobalModalDefault);

  const [showPatient, setShowPatient] = useState<Patient | undefined>(
    undefined,
  );

  const [currentSessionData, setCurrentSessionData] =
    useState<SessionData>(DefaultSessionData);

  const [dashboardState, setDashboardState] =
    useState<DashboardStates>("My Patients");

  const goToDashboardPage = (page: DashboardStates) => {
    setDashboardState(page);
    setShowPatient(undefined);

    if (pathname !== DashboardStatesObject[page].Route) {
      setTimeout(() => {
        router.push(`${DashboardStatesObject[page].Route}`);
      }, 100);
    }
  };

  const ResetSessionData = ({ withRouter }: { withRouter: boolean }) => {
    setCurrentSessionData(DefaultSessionData);
    window.sessionStorage.removeItem(
      "textAreaCurrentClinicalHistoryDashboardContext",
    );
    window.sessionStorage.removeItem("TxtTsrbrInput");
    window.sessionStorage.removeItem("textTranscriberCHTA");
    window.sessionStorage.removeItem("transcribedSTTSaved");
    queryClient.refetchQueries({
      queryKey: ["fetching_user_patients"],
    });
    setShowPatient(undefined);
    if (withRouter) router.push("/dashboard");
  };

  // On App Load, check if there's any session data saved in sessionStorage
  useEffect(() => {
    const sessionStorageCH = window.sessionStorage.getItem(
      "textAreaCurrentClinicalHistoryDashboardContext",
    );
    if (sessionStorageCH) {
      const parsedSesionData = JSON.parse(sessionStorageCH);
      setCurrentSessionData(parsedSesionData);
    }
    setInitialRender(false);
  }, []);

  // On Modify currentSessionData, save it to sessionStorage
  useEffect(() => {
    if (!initialRender) {
      window.sessionStorage.setItem(
        "textAreaCurrentClinicalHistoryDashboardContext",
        JSON.stringify(currentSessionData),
      );
    }
  }, [currentSessionData, initialRender]);

  useEffect(() => {
    if (dashboardModal.Component) {
      setDashboardModalState(true);
    } else {
      setDashboardModalState(false);
    }
  }, [dashboardModal]);

  useEffect(() => {
    if (showPatient) {
      registerLog(
        {
          patientId: showPatient._id,
          action: "user_viewed_patient_file",
          sessionRef: `${getAccessToken().accessToken?.slice(0, 5)}`,
          timestamp: new Date().toISOString(),
          resourceType: "patient",
          status: "success",
        },
        undefined,
      );
    }
  }, [showPatient]);

  return (
    <DashboardContext.Provider
      value={{
        chRef,
        currentSessionData,
        setCurrentSessionData,
        ResetSessionData,
        dashboardState,
        setDashboardState,
        goToDashboardPage,
        showPatient,
        setShowPatient,
        dashboardModal,
        setDashboardModal,
      }}
    >
      {children}
      <ClinicalHistory
        chRef={chRef}
        PatientInfo={showPatient}
        setPatientInfo={setShowPatient}
      />
      <ModalCC
        {...dashboardModal.Settings}
        useStates={{
          state: dashboardModalState,
          setState: setDashboardModalState,
        }}
        onModalClose={() => setDashboardModal(GlobalModalDefault)}
      >
        {dashboardModal.Component}
      </ModalCC>
    </DashboardContext.Provider>
  );
},
);
DashboardContextProvider.displayName = "DashboardContextProvider";
