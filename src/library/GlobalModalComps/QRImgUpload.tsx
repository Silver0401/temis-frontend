import { GlobalContext, useGlobalContext } from "@/e2e/globalContext";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import QRCode from "react-qr-code";
import { io } from "socket.io-client";
import { feathers, Application } from "@feathersjs/feathers";
import socketio from "@feathersjs/socketio-client";
import { GlobalModalDefault } from "@/scripts/Constants";
import { toast } from "sonner";

interface QRImgUploadProps {
  onPhoneConnected?: () => void;
}

const QRImgUpload: React.FC<QRImgUploadProps> = ({ onPhoneConnected }) => {
  const { getAccessToken, setGlobalModal } = useGlobalContext();
  const socketRef = useRef<Application>(null);
  const [phoneConnected, setPhoneConnected] = useState<boolean>(false);

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

    feathersClient
      .service("users")
      .on(
        "devicesConnected",
        (state: { devices: string[]; userId: string }) => {
          if (state.devices.includes("phone")) {
            setPhoneConnected(true);
          } else {
            setPhoneConnected(false);
          }
        },
      );

    // feathersClient
    //   .service("uploads")
    //   .on("isSendingImg", (fileState: { state: string; userId: string }) => {
    //     if (fileState.state === "true") {
    //       setPhoneConnected(true);
    //     } else {
    //       setPhoneConnected(false);
    //     }
    //   });

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
    // return cleanup;
  }, [connectToSocketServer]);

  useEffect(() => {
    if (phoneConnected && !onPhoneConnected) {
      setGlobalModal(GlobalModalDefault);
      toast.success("Teléfono enlazado, sube tu imágen");
    }

    if (phoneConnected && onPhoneConnected) {
      onPhoneConnected();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneConnected]);

  return (
    <div className="inputQrCodeCont">
      <h4>{"Sube una foto con el teléfono"}</h4>
      <p>{"Escanea el siguiente qr para subir una foto desde tu telefono"}</p>
      <QRCode
        value={`${
          process.env.NEXT_PUBLIC_NOT_FRONTEND_URL
        }/mobile/phoneCamera/${getAccessToken().accessToken}`}
      />
    </div>
  );
};

export default QRImgUpload;
