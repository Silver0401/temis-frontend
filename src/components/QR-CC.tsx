import React from "react";
import QRCode from "react-qr-code";

interface QRCCprops {
  colorSchema?: colorSchemas;
  title?: string;
  subtitle?: string;
  value: string;
  size: "sm" | "md" | "lg";
}

const QRCC: React.FC<QRCCprops> = ({
  title,
  subtitle,
  value,
  size,
  colorSchema,
}) => {
  return (
    <div className="QRCContainer">
      {title ? (
        <h2
          className={`QRTitle QrTitle-${size}`}
          id={colorSchema === "night" ? "textNight" : undefined}
        >
          {title}
        </h2>
      ) : null}
      {subtitle ? (
        <h2
          className={`QRSubtitle QrSubtitle-${size}`}
          id={colorSchema === "night" ? "textNight" : undefined}
        >
          {subtitle}
        </h2>
      ) : null}

      <div className={`QrBox-${size}`} id="QrBoxGen">
        <QRCode
          value={value}
          className={`QrOGComp-${colorSchema ? colorSchema : "day"}`}
        />
      </div>
    </div>
  );
};

export default QRCC;
