"use client";

import React, { useContext, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Delete_Gabinet_Img,
  Get_Patient_Gabinet_Imgs,
} from "@/e2e/server/FeathersAPI";
import { GlobalContext, useGlobalContext } from "@/e2e/globalContext";
import Image from "next/image";
import FancyLoader from "@/library/Generics/Loaders/FancyLoader";
import ActionCC from "@/components/Action-CC";
import ImgExpanded from "@/styles/stylus/Medical/ImgExpanded";
import ButtonCC from "@/components/Button-CC";
import { toast } from "sonner";
import { GlobalModalDefault } from "@/scripts/Constants";
import IconsCC from "@/assets/icons/IconsCC";

const GabinetImgs: React.FC<SectionProps> = ({ PatientInfo, onAddNewDoc }) => {
  const { feathersFetchCC, setGlobalModal } = useGlobalContext();
  const queryClient = useQueryClient();

  const { isPending, isRefetching, data } = useQuery({
    queryFn: async () => {
      const req = await Get_Patient_Gabinet_Imgs(PatientInfo._id);
      return feathersFetchCC<GabinetImgResponse[]>(req);
    },
    refetchOnWindowFocus: false,
    queryKey: [`fetching_patient_gabinet_imgs_${PatientInfo._id}`],
  });

  const delete_gabinet_img_mutation = useMutation({
    mutationFn: async (imgId: string) => {
      setGlobalModal(GlobalModalDefault);
      const toastID = toast.loading("Eliminando imágen ...");
      const req = await Delete_Gabinet_Img(imgId);
      const feathers = await feathersFetchCC(req);
      toast.dismiss(toastID);
      return feathers;
    },
    onSuccess() {
      queryClient.refetchQueries({
        queryKey: [`fetching_patient_gabinet_imgs_${PatientInfo._id}`],
      });
      setCurrentImgIndex(0);
    },
    mutationKey: ["delete_gabinet_img_mutation"],
  });

  const formatedImgsList = useMemo((): GabinetImgResponse[] => {
    const dataList = data?.data;
    if (dataList && dataList.length > 0) {
      const formatedList: GabinetImgResponse[] = [
        {
          Name: "AddNewImgTemplate",
          Image: "",
          patientId: "123",
          _id: "123",
          Type: "TAC",
          DateOfStudy: "",
          Interpretation: "",
          diagnosisId: "",
        },
        ...dataList,
        {
          Name: "AddNewImgTemplate",
          Image: "",
          patientId: "321",
          _id: "321",
          Type: "TAC",
          DateOfStudy: "",
          Interpretation: "",
          diagnosisId: "",
        },
      ];

      return formatedList;
    } else {
      return [
        {
          Name: "AddNewImgTemplate",
          Image: "",
          patientId: "123",
          _id: "123",
          Type: "TAC",
          DateOfStudy: "",
          Interpretation: "",
          diagnosisId: "",
        },
      ];
    }
  }, [data]);

  const [currentImgIndex, setCurrentImgIndex] = useState<number>(
    formatedImgsList.length === 1 ? 0 : 1,
  );

  const OpenImgInGlobalModal = (imgData: GabinetImgResponse) => {
    setGlobalModal({
      Settings: {
        size: "imgFullScreen",
        identifier: "CHImgGlobal",
        animation: "popUp",
      },
      Component: <ImgExpanded {...imgData} />,
    });
  };

  const OpenDeleteImgModal = (imgId: string) => {
    setGlobalModal({
      Settings: {
        size: "small",
        identifier: "CHImgDeleteGlobal",
        animation: "popUp",
      },
      Component: (
        <div className="genericModalInfo">
          <h3>{"Eliminar Imagen"}</h3>
          <p>{"¿Estás seguro que quieres borrar este estudio de gabinete?"}</p>
          <ButtonCC
            type="Phantom"
            text="Eliminar"
            onClick={() => delete_gabinet_img_mutation.mutate(imgId)}
          />
        </div>
      ),
    });
  };

  return isPending || isRefetching ? (
    <FancyLoader bg="translucid" />
  ) : (
    <section className="GabinetImgsDisplay">
      <div className="ImagesDisplayContainer">
        <div
          className="LeftClickBox"
          onClick={() =>
            currentImgIndex !== 0 && setCurrentImgIndex(currentImgIndex - 1)
          }
        />

        {/* 
          currentImgIndex
          0 1 2 3

          index
          0 1 2 3

          actualIndex Calculation

          prod(*-1) -> Multiplided by -1 to switch sides

          0 -> 0 -1 -2 -3

          3 -> 3 2 1 0

          2 -> 2 1 0 -1

          1 -> -1 0 1 2 
          
          */}

        {formatedImgsList?.map((gabImgData, index) => {
          // CSS Styling Variables to Achieve 3D Carrousel Effect
          let actualIndex = (currentImgIndex - index) * -1;
          let transform = "none";
          let zIndex = formatedImgsList.length;
          let opacity = 1;

          if (actualIndex !== 0) {
            transform = `translateX(${120 * actualIndex}px) scale(${
              1 - 0.2 * Math.abs(actualIndex)
            }) perspective(30px) rotateY(${Math.sign(actualIndex * -1)}deg)`;
            zIndex = formatedImgsList.length - Math.abs(actualIndex);
            opacity = 1 - 0.3 * Math.abs(actualIndex);
          }

          return gabImgData.Name === "AddNewImgTemplate" ? (
            <div
              key={gabImgData._id}
              id="AddNewImgTemplate"
              className="gImgContainer"
              style={{ transform, zIndex, opacity }}
            >
              <ActionCC
                text={
                  formatedImgsList.length === 1
                    ? "El paciente aun no tiene estudios, agrega uno nuevo"
                    : "Agregar nuevo estudio de gabinete"
                }
                emptyIcon={IconsCC.Image}
                onClick={() => {
                  onAddNewDoc && onAddNewDoc("Imgs");
                }}
                button="Agregar"
              />
            </div>
          ) : (
            <div
              key={gabImgData._id}
              id={actualIndex === 0 ? "gImgSelected" : undefined}
              className="gImgContainer"
              style={{ transform, zIndex, opacity }}
            >
              <h2>{gabImgData.Name}</h2>

              <div className="TrashIcon">
                <ButtonCC
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-6"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                  type="Solid"
                  onClick={() => {
                    OpenDeleteImgModal(gabImgData._id);
                  }}
                />
              </div>

              <div
                className="innerContainer"
                onClick={() => {
                  if (actualIndex === 0) {
                    OpenImgInGlobalModal(gabImgData);
                  }
                }}
              >
                <Image
                  className="gImg"
                  width={1200}
                  height={1200}
                  src={gabImgData.Image}
                  alt={gabImgData.Name}
                  key={gabImgData._id}
                />
              </div>

              <h4>{gabImgData.Type}</h4>
            </div>
          );
        })}
        <div
          className="RightClickBox"
          onClick={() =>
            currentImgIndex + 1 !== formatedImgsList?.length &&
            setCurrentImgIndex(currentImgIndex + 1)
          }
        />
      </div>
      <div className="TimelineContainer"></div>
    </section>
  );
};

export default GabinetImgs;
