"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { feathers, Application } from "@feathersjs/feathers";
import socketio from "@feathersjs/socketio-client";
import io from "socket.io-client";
import { useParams } from "next/navigation";
import CameraCC from "@/components/Camera-CC";
import ButtonCC from "@/components/Button-CC";
import InputCC from "@/components/Input-CC";
import { toast } from "sonner";

const PhoneCamera = () => {
  const { userToken } = useParams();
  const socketRef = useRef<Application>(null);
  const cameraRef = useRef<any>(null);
  const [Base64Img, setBase64Img] = React.useState<string | null>(null);
  const [typeSelected, setTypeSelected] = React.useState<
    "camera" | "upload" | "none"
  >("none");

  const connectToSocketServer = useCallback(() => {
    if (socketRef.current) return;

    const socket = io(`${process.env.NEXT_PUBLIC_NOT_BACKEND_URL}`, {
      extraHeaders: {
        Authorization: `Bearer ${userToken}`,
        deviceType: "phone",
      },
    });

    const feathersClient = feathers();
    feathersClient.configure(socketio(socket));
    // @ts-ignore
    socketRef.current = feathersClient;

    // feathersClient
    //   ?.service("uploads")
    //   .get(Math.floor(Math.random() * 9999999999));

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
    const SendImgThroughSocket = (base64img: string) => {
      const myPromise = new Promise<{ name: string }>(async (resolve) => {
        try {
          await socketRef.current?.service("uploads").create({
            Type: "image",
            Action: "phoneUpload",
            FileList: [base64img],
            Description: "Imágen del Teléfono",
          });
          resolve({ name: "Imágen Subida" });
        } catch (error) {
          resolve({ name: "Error Subiendo Imágen" });
        }
      });

      toast.promise(myPromise, {
        loading: "Cargando Imágen...",
        success: (data: { name: string }) => {
          return `${data.name}`;
        },
        error: "Error",
      });
    };

    if (Base64Img) {
      SendImgThroughSocket(Base64Img);
    }
  }, [Base64Img]);

  return (
    <div className="phoneCameraContainer">
      {typeSelected === "none" ? (
        <div className="buttonsLayout">
          <h4>{"Sube una Imágen"}</h4>
          <p>{"Escoge de donde quieres subirla"}</p>
          <ButtonCC
            onClick={() => {
              setTypeSelected("upload");
            }}
            text="De mis Fotos"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path
                  fillRule="evenodd"
                  d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
                  clip-rule="evenodd"
                />
              </svg>
            }
            type="Phantom" size="lg"
          />

          <ButtonCC
            onClick={() => {
              setTypeSelected("camera");
            }}
            text="Con Cámara"
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
                  clip-rule="evenodd"
                />
              </svg>
            }
            type="Solid" size="lg"
          />
        </div>
      ) : typeSelected === "camera" ? (
        <div className="mobileFullContainer">
          <ButtonCC
            type="Phantom" size="lg"
            classname="returnButton"
            onClick={() => setTypeSelected("none")}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path
                  fillRule="evenodd"
                  d="M20.239 20.25a.75.75 0 0 1-.75-.75V8.999H5.549l2.47 2.47a.75.75 0 0 1-1.06 1.06l-3.75-3.75a.75.75 0 0 1 0-1.06l3.75-3.75a.75.75 0 1 1 1.06 1.06l-2.47 2.47h14.69a.75.75 0 0 1 .75.75V19.5a.75.75 0 0 1-.75.75Z"
                  clip-rule="evenodd"
                />
              </svg>
            }
          />

          <CameraCC
            view="mobile"
            cameraRef={cameraRef}
            onCapture={(b64imgCaptured) => {
              setBase64Img(b64imgCaptured);
            }}
          />
        </div>
      ) : typeSelected === "upload" ? (
        <div className="mobileFullContainer">
          <ButtonCC
            type="Phantom" size="lg"
            classname="returnButton"
            onClick={() => setTypeSelected("none")}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path
                  fillRule="evenodd"
                  d="M20.239 20.25a.75.75 0 0 1-.75-.75V8.999H5.549l2.47 2.47a.75.75 0 0 1-1.06 1.06l-3.75-3.75a.75.75 0 0 1 0-1.06l3.75-3.75a.75.75 0 1 1 1.06 1.06l-2.47 2.47h14.69a.75.75 0 0 1 .75.75V19.5a.75.75 0 0 1-.75.75Z"
                  clip-rule="evenodd"
                />
              </svg>
            }
          />

          <h4>{"Sube una Foto"}</h4>
          <p>{"Haz click para subir una foto"}</p>

          <InputCC
            type={"file"}
            fileTypes="images"
            identifier={"Phone_Img_Uploader"}
            styles={{ container: { width: "90%" } }}
            onChange={(b64FileList) => {
              setBase64Img(b64FileList[0].base64File);
            }}
          />
        </div>
      ) : null}
    </div>
  );
};

export default PhoneCamera;
