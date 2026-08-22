import { useGlobalContext } from "@/e2e/globalContext";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Prescriber from "./Prescriber";
import { feathers, Application } from "@feathersjs/feathers";
import { io } from "socket.io-client";
import socketio from "@feathersjs/socketio-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import CardsDisplayCC from "@/components/CardsDisplay-CC";
import IconsCC from "@/assets/icons/IconsCC";

import { DashboardContext } from "@/e2e/dashboardContext";
import SomasForm from "../BaseForms/SomasForm";
import LabsForm from "../BaseForms/LabsForm";
import OrdersMaker from "./OrdersMaker";
import ImgsForm from "../BaseForms/ImgsForm";

const AddNewDocForm: React.FC<NewFormDocSectionProps> = (props) => {
  const { currentSection, colorSchema } = props;
  const router = useRouter();

  const socketRef = useRef<Application>(null);
  const [phoneImg, setPhoneImg] = useState<FileCCProps | undefined>(undefined);
  const { getAccessToken } = useGlobalContext();
  const {
    setCurrentSessionData,
    currentSessionData,
    setShowPatient,
    showPatient,
  } = useContext(DashboardContext);

  const SaveSessionPrescriptions = (prescriptions: MedicationProps[]) => {
    setCurrentSessionData({
      ...currentSessionData,
      extraData: {
        ...currentSessionData.extraData,
        Drugs: prescriptions,
      },
    });
  };

  const SaveSessionOrders = (orders: Order[]) => {
    setCurrentSessionData({
      ...currentSessionData,
      extraData: {
        ...currentSessionData.extraData,
        Request: orders,
      },
    });
  };

  const connectToSocketServer = useCallback(() => {
    if (socketRef.current) return;

    const socket = io(`${process.env.NEXT_PUBLIC_NOT_BACKEND_URL}`, {
      extraHeaders: {
        Authorization: `Bearer ${getAccessToken().accessToken}`,
        deviceType: "computer",
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
  }, [connectToSocketServer]);

  const Redirect = ({
    route,
    method,
  }: {
    route: string;
    method: methodTypes;
  }) => {
    if (showPatient) {
      setCurrentSessionData({
        ...currentSessionData,
        method,
        toBeAdded: "document",
        currentPatientData: showPatient,
        currentStep: 1,
      });
    } else {
      setCurrentSessionData({
        ...currentSessionData,
        method,
      });
    }
    props.onRedirect && props.onRedirect();
    router.push(`${route}`);
    setShowPatient(undefined);
  };

  return (
    <div className={`AddNewDocForm AddNewDocForm-${colorSchema}`}>
      {currentSection === "CCH" ? (
        <CardsDisplayCC
          title="Nota de Evolución"
          subtitle="Hazla, a partir de:"
          itemsList={[
            {
              size: "md",
              name: "TextOpt",
              title: "Texto",
              subtitle: "Escribe la nota directamente en el expediente",
              icon: IconsCC.Notes,
              onClick: () => {
                Redirect({
                  route: "/dashboard/newPatient/clinicalRecord",
                  method: "text",
                });
              },
            },
          ]}
        />
      ) : currentSection === "Drugs" ? (
        <Prescriber
          {...props}
          onPrescriptionsChange={SaveSessionPrescriptions}
          currentPrescriptions={currentSessionData.extraData.Drugs}
          colorSchema="day"
        />
      ) : currentSection === "Somas" ? (
        <SomasForm {...props} phoneImg={phoneImg} />
      ) : currentSection === "Imgs" ? (
        <ImgsForm {...props} phoneImg={phoneImg} />
      ) : currentSection === "Labs" ? (
        <LabsForm {...props} phoneImg={phoneImg} />
      ) : currentSection === "Request" ? (
        <OrdersMaker
          {...props}
          currentOrders={currentSessionData.extraData.Request}
          onOrdersChange={SaveSessionOrders}
        />
      ) : null}
    </div>
  );
};

export default AddNewDocForm;
