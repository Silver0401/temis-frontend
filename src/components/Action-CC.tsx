import React, { CSSProperties } from "react";
import ButtonCC from "./Button-CC";
import IconsCC from "@/assets/icons/IconsCC";

interface ActionProps {
  text: string;
  button?: string;
  id?: string;
  icon?: React.ReactElement;
  onClick: () => void;
  style?: CSSProperties;
  /** Icono grande que encabeza el estado vacío. Default: caja vacía. */
  emptyIcon?: React.ReactElement;
  emptyIconStyle?: CSSProperties;
}

const ActionCC: React.FC<ActionProps> = ({
  id,
  text,
  button,
  icon,
  onClick,
  style,
  emptyIcon,
  emptyIconStyle,
}) => {
  return (
    <div className="ActionCC" id={id} style={style}>
      <div className="emptyIconContainer" style={emptyIconStyle}>
        {emptyIcon ?? IconsCC.EmptyBox}
      </div>
      <p className="textP">{text}</p>
      {button && (
        <ButtonCC
          type="Phantom"
          text={button}
          classname="AddNewDataButton"
          onClick={onClick}
          icon={
            icon ? (
              icon
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path
                  fillRule="evenodd"
                  d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
            )
          }
        />
      )}
    </div>
  );
};

export default ActionCC;
