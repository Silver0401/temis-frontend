import React, { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import NextImage from "next/image";

const ImgExpanded: React.FC<GabinetImgResponse> = ({
  _id,
  Image,
  DateOfStudy,
  Interpretation,
  Name,
}) => {
  const [imgSiderVisible, setImgSiderVisible] = useState<boolean>(true);

  return (
    <section className="GabinetImgIndividual">
      <div
        className="ImgContainer"
        id={imgSiderVisible ? "lowerImgCont" : "expanedImgCont"}
      >
        <TransformWrapper>
          <TransformComponent>
            <NextImage
              className="fullNextImgExpanded"
              fill
              src={Image}
              alt={_id}
            />
          </TransformComponent>
        </TransformWrapper>
      </div>
      <div className="Topper">
        <div
          className="DescriptionButton"
          onClick={() => setImgSiderVisible(!imgSiderVisible)}
        >
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

          <p>{"Interpretación"}</p>
        </div>
      </div>
      <div
        id={`${imgSiderVisible ? "toggled" : "notToggled"}`}
        className="InterpretationContainer"
      >
        <h4>{Name}</h4>
        <p className="date">{DateOfStudy}</p>
        <p className="interpretation">{Interpretation}</p>
      </div>
    </section>
  );
};

export default ImgExpanded;
