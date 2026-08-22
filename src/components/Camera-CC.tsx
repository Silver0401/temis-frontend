import React, { useContext, useEffect, useRef, useState } from "react";
import { Camera } from "react-camera-pro";
import ButtonCC from "./Button-CC";
import Image from "next/image";

interface CameraCCProps {
  view: "mobile" | "desktop";
  cameraRef: React.RefObject<any>;
  onCapture: (base64img: string) => void;
}

const CameraCC: React.FC<CameraCCProps> = ({ onCapture, cameraRef, view }) => {
  const [selectedImg, setSelectedImg] = useState<string | undefined>(undefined);

  const handlePhotoCapture = () => {
    if (selectedImg) {
      onCapture && onCapture(selectedImg);
    }
  };

  return (
    <div
      className="CameraCC"
      style={
        view === "desktop"
          ? { width: "500px", height: "400px" }
          : { width: "300px", height: "550px" }
      }
    >
      <div className="InnerContainer">
        <div className="camera">
          {selectedImg ? (
            <div>
              <Image
                width={100}
                height={100}
                className="TakenImg"
                src={selectedImg}
                alt="TakenImg"
              />
            </div>
          ) : (
            <Camera
              facingMode="environment"
              ref={cameraRef}
              errorMessages={{}}
            />
          )}
        </div>
        <div className="Borders">
          <span className="b1" />
          <span className="b2" />
          <span className="b3" />
          <span className="b4" />
        </div>
      </div>

      <div className="ButtonContainer">
        {selectedImg ? (
          <div className="ButtonsInnerContainer">
            <ButtonCC
              type="Phantom"
              text="Aceptar"
              onClick={handlePhotoCapture}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path d="M11.47 1.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1-1.06 1.06l-1.72-1.72V7.5h-1.5V4.06L9.53 5.78a.75.75 0 0 1-1.06-1.06l3-3ZM11.25 7.5V15a.75.75 0 0 0 1.5 0V7.5h3.75a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3h3.75Z" />
                </svg>
              }
            />
            <ButtonCC
              type="Phantom"
              text="Retomar"
              onClick={() => setSelectedImg(undefined)}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 5.25c1.213 0 2.415.046 3.605.135a3.256 3.256 0 0 1 3.01 3.01c.044.583.077 1.17.1 1.759L17.03 8.47a.75.75 0 1 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 0 0-1.06-1.06l-1.752 1.751c-.023-.65-.06-1.296-.108-1.939a4.756 4.756 0 0 0-4.392-4.392 49.422 49.422 0 0 0-7.436 0A4.756 4.756 0 0 0 3.89 8.282c-.017.224-.033.447-.046.672a.75.75 0 1 0 1.497.092c.013-.217.028-.434.044-.651a3.256 3.256 0 0 1 3.01-3.01c1.19-.09 2.392-.135 3.605-.135Zm-6.97 6.22a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.752-1.751c.023.65.06 1.296.108 1.939a4.756 4.756 0 0 0 4.392 4.392 49.413 49.413 0 0 0 7.436 0 4.756 4.756 0 0 0 4.392-4.392c.017-.223.032-.447.046-.672a.75.75 0 0 0-1.497-.092c-.013.217-.028.434-.044.651a3.256 3.256 0 0 1-3.01 3.01 47.953 47.953 0 0 1-7.21 0 3.256 3.256 0 0 1-3.01-3.01 47.759 47.759 0 0 1-.1-1.759L6.97 15.53a.75.75 0 0 0 1.06-1.06l-3-3Z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            />
          </div>
        ) : (
          <>
            <div
              className="TakePhoto"
              onClick={() => {
                setSelectedImg(
                  // @ts-ignore
                  cameraRef.current.takePhoto()
                );
              }}
            />
            <div
              className="SwitchCamera"
              onClick={() => {
                // @ts-ignore
                cameraRef.current.switchCamera();
              }}
            >
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraCC;
