import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import ButtonCC from "@/components/Button-CC";
import { AnimatePresence, motion } from "motion/react";
import CameraCC from "@/components/Camera-CC";
import { GlobalContext, useGlobalContext } from "@/e2e/globalContext";
import socketio from "@feathersjs/socketio-client";
import QRImgUpload from "../GlobalModalComps/QRImgUpload";
import { feathers, Application } from "@feathersjs/feathers";
import { io } from "socket.io-client";
import { useMutation } from "@tanstack/react-query";
import { Verify_Nufi_Identity } from "@/e2e/server/FeathersAPI";
import IconsCC from "@/assets/icons/IconsCC";
import { toast } from "sonner";

interface VerifyIDProps {
  onVerified: (
    data: { uidString: string; ineData: NufiVerifyResult } | undefined,
  ) => void;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

type steps =
  | "init choose"
  | "phone qr"
  | "front side computer scan"
  | "back side computer scan"
  | "front side phone"
  | "back side phone"
  | "verifying"
  | "error"
  | "success"
  | "face scan";

interface stepsProps {
  title: string;
  subtitle: string;
  component: React.ReactElement;
}

type stepsIndexed = {
  [key in steps]: stepsProps;
};

const VerifyID: React.FC<VerifyIDProps> = ({ onVerified, setModalVisible }) => {
  const [step, setStep] = useState<steps>("init choose");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const { feathersFetchCC } = useGlobalContext();
  const socketRef = useRef<Application>(null);
  const cameraRef = useRef(null);
  const [img, setImg] = useState<{
    frontINE?: string;
    backINE?: string;
    facePhoto?: string;
  }>({});

  const connectToSocketServer = useCallback(() => {
    if (socketRef.current) return;
    const socket = io(`${process.env.NEXT_PUBLIC_NOT_BACKEND_URL}`, {
      extraHeaders: { sessionId: `${Math.floor(Math.random() * 1000000)}` },
    });
    const feathersClient = feathers();
    feathersClient.configure(socketio(socket));
    // @ts-ignore
    socketRef.current = feathersClient;
    return () => {
      socket.disconnect();
      // @ts-ignore
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cleanup = connectToSocketServer();
    return cleanup;
  }, [connectToSocketServer]);

  const verify_mutation = useMutation({
    mutationFn: async (imgs: { front: string; back: string; face: string }) => {
      const props = await Verify_Nufi_Identity(
        imgs.front,
        imgs.back,
        imgs.face,
      );
      return feathersFetchCC<NufiVerifyResult>(props);
    },
    onSuccess: (data, vars) => {
      if (data.type === "success") {
        const uidString = `${vars.front}|${vars.back}|${vars.face}`;
        onVerified({ uidString, ineData: data.data });
        setStep("success");
      } else {
        setErrorMsg(data.message ?? "Error verificando identidad");
        setStep("error");
      }
    },
    onError: (err: any) => {
      setErrorMsg(err?.message ?? "Error verificando identidad");
      setStep("error");
    },
  });

  useEffect(() => {
    if (img.backINE && img.facePhoto && img.frontINE) {
      setStep("verifying");
      verify_mutation.mutate({
        front: img.frontINE.split("base64,")[1],
        back: img.backINE.split("base64,")[1],
        face: img.facePhoto.split("base64,")[1],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img]);

  const INECamera = (currentStep: steps) => (
    <motion.div
      key={currentStep}
      initial={{ opacity: 0, x: 500 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -500 }}
      transition={{ duration: 0.8 }}
      className="genericContainer"
    >
      <div className="cameraOuterContainer">
        <CameraCC
          view="desktop"
          cameraRef={cameraRef}
          onCapture={(imgCaptured) => {
            if (currentStep === "front side computer scan") {
              setImg((prev) => ({ ...prev, frontINE: imgCaptured as string }));
              setStep("back side computer scan");
            } else if (currentStep === "back side computer scan") {
              setImg((prev) => ({ ...prev, backINE: imgCaptured as string }));
              setStep("face scan");
            } else if (currentStep === "face scan") {
              setImg((prev) => ({ ...prev, facePhoto: imgCaptured as string }));
            }
          }}
        />
      </div>
    </motion.div>
  );

  const StepsObject: stepsIndexed = {
    "init choose": {
      title: "Verifica tu Identidad",
      subtitle:
        "Para crear una cuenta debemos verificar tu identidad como médico",
      component: (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="genericContainer"
        >
          <div className="LeftBox">
            <div className="idScanIcon">{IconsCC.IdCard}</div>
          </div>
          <div className="RightBox">
            <p className="subtitle">
              Escoge una opción para verificar tu identidad con tu INE
            </p>

            {/* <ButtonCC
              text="Escanear con el Teléfono"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4.875C3 3.839 3.84 3 4.875 3h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 0 1 3 9.375v-4.5ZM4.875 4.5a.375.375 0 0 0-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 0 0 .375-.375v-4.5a.375.375 0 0 0-.375-.375h-4.5Zm7.875.375c0-1.036.84-1.875 1.875-1.875h4.5C20.16 3 21 3.84 21 4.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5a1.875 1.875 0 0 1-1.875-1.875v-4.5Zm1.875-.375a.375.375 0 0 0-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 0 0 .375-.375v-4.5a.375.375 0 0 0-.375-.375h-4.5ZM6 6.75A.75.75 0 0 1 6.75 6h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75A.75.75 0 0 1 6 7.5v-.75Zm9.75 0A.75.75 0 0 1 16.5 6h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75ZM3 14.625c0-1.036.84-1.875 1.875-1.875h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.035-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 0 1 3 19.125v-4.5Zm1.875-.375a.375.375 0 0 0-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 0 0 .375-.375v-4.5a.375.375 0 0 0-.375-.375h-4.5Zm7.875-.75a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Zm6 0a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75ZM6 16.5a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Zm9.75 0a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Zm-3 3a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Zm6 0a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              type="Solid" size="lg"
              onClick={() => setStep("phone qr")}
            /> */}

            <ButtonCC
              text="Escanear con Computadora"
              classname="ComputerCamButton"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
                  <path
                    fillRule="evenodd"
                    d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              type="Phantom"
              size="lg"
              onClick={() => setStep("front side computer scan")}
            />
          </div>
        </motion.div>
      ),
    },
    "phone qr": {
      title: "INE con Teléfono",
      subtitle: "Escánea el siguiente QR con tu teléfono",
      component: (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="genericContainer"
        >
          <QRImgUpload onPhoneConnected={() => setStep("front side phone")} />
        </motion.div>
      ),
    },
    "front side computer scan": {
      title: "INE Parte Frontal",
      subtitle:
        "Acerca la parte frontal de tu INE a la cámara y toma una foto de buena calidad",
      component: INECamera("front side computer scan"),
    },
    "back side computer scan": {
      title: "INE Parte Trasera",
      subtitle:
        "Ahora la parte trasera de tu INE, asegurate de que tenga buena calidad",
      component: INECamera("back side computer scan"),
    },
    "front side phone": {
      title: "INE Parte Frontal",
      subtitle: "Sube la foto de la parte frontal desde tu teléfono",
      component: (
        <div className="genericContainer">
          <p>Esperando imagen desde el teléfono...</p>
        </div>
      ),
    },
    "back side phone": {
      title: "INE Parte Trasera",
      subtitle: "Sube la foto de la parte trasera desde tu teléfono",
      component: (
        <div className="genericContainer">
          <p>Esperando imagen desde el teléfono...</p>
        </div>
      ),
    },
    "face scan": {
      title: "Escaneo de Cara",
      subtitle:
        "Acerca tu cara y toma una foto; quítate accesorios y levanta tu pelo",
      component: INECamera("face scan"),
    },
    verifying: {
      title: "Verificando Identidad",
      subtitle: "Estamos procesando tu INE y verificando tu identidad...",
      component: (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="genericContainer"
        >
          <div className="LeftBox">
            <div className="idScanIcon">{IconsCC.IdCard}</div>
          </div>
        </motion.div>
      ),
    },
    error: {
      title: "Error de Verificación",
      subtitle: errorMsg || "Ocurrió un error al verificar tu identidad",
      component: (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="genericContainer"
        >
          <div className="cameraOuterContainer">
            <div className="successBadge">
              <div className="successIcon">{IconsCC.Check}</div>
            </div>

            <ButtonCC
              type="Phantom"
              text="Cerrar Ventana"
              onClick={() => {
                setModalVisible(false);
              }}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            />

            <ButtonCC
              type="Solid"
              text="Volver a Tomar Fotos"
              onClick={() => {
                setImg({});
                setErrorMsg("");
                setStep("init choose");
              }}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            />
          </div>
        </motion.div>
      ),
    },
    success: {
      title: "Proceso Completo",
      subtitle: "Identidad verificada. Puedes cerrar esta ventana y continuar.",
      component: (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="genericContainer"
        >
          <div className="cameraOuterContainer">
            <div className="successBadge">
              <div className="successIcon">{IconsCC.Check}</div>
            </div>
            <ButtonCC
              type="Phantom"
              text="Cerrar Ventana"
              onClick={() => setModalVisible(false)}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            />
          </div>
        </motion.div>
      ),
    },
  };

  return (
    <div className="VerifyID">
      <div className="TopBox">
        <h2>{StepsObject[step].title}</h2>
        <p>{StepsObject[step].subtitle}</p>
      </div>
      <div className="BottomBox">
        <AnimatePresence mode="wait">
          {StepsObject[step].component}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VerifyID;
