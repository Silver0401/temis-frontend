"use client";

import React, { CSSProperties } from "react";
import Link from "next/link";

type ButtonType  = "Solid" | "Phantom" | "Gradient";
type ButtonShape = "Square" | "Pill";
type ButtonSize  = "sm" | "lg";

interface ButtonCCprops {
  type?:        ButtonType;
  shape?:       ButtonShape;
  colorSchema?: colorSchemas;
  size?:        ButtonSize;
  icon?:        React.ReactElement;
  text?:        string;
  children?:    React.ReactNode;
  width?:       "auto" | "block";
  styles?:      CSSProperties;
  submit?:      boolean;
  loading?:     boolean;
  classname?:   string;
  href?:        string;
  onClick?:     () => void;
}

const ButtonCC: React.FC<ButtonCCprops> = ({
  type        = "Solid",
  shape       = "Pill",
  colorSchema,
  size        = "sm",
  icon,
  text,
  children,
  width,
  submit,
  loading,
  styles,
  onClick,
  classname,
  href,
}) => {
  const className = [
    "ButtonCC",
    `ButtonCC--${type}`,
    `ButtonCC--${shape}`,
    `ButtonCC--${size}`,
    colorSchema ? `ButtonCC--${colorSchema}` : "",
    classname ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const commonStyle: CSSProperties = {
    width: width === "block" ? "100%" : "auto",
    ...styles,
  };

  const loader = (
    <svg
      className="miniButtonLoader"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M12 5.25c1.213 0 2.415.046 3.605.135a3.256 3.256 0 0 1 3.01 3.01c.044.583.077 1.17.1 1.759L17.03 8.47a.75.75 0 1 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 0 0-1.06-1.06l-1.752 1.751c-.023-.65-.06-1.296-.108-1.939a4.756 4.756 0 0 0-4.392-4.392 49.422 49.422 0 0 0-7.436 0A4.756 4.756 0 0 0 3.89 8.282c-.017.224-.033.447-.046.672a.75.75 0 1 0 1.497.092c.013-.217.028-.434.044-.651a3.256 3.256 0 0 1 3.01-3.01c1.19-.09 2.392-.135 3.605-.135Zm-6.97 6.22a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.752-1.751c.023.65.06 1.296.108 1.939a4.756 4.756 0 0 0 4.392 4.392 49.413 49.413 0 0 0 7.436 0 4.756 4.756 0 0 0 4.392-4.392c.017-.223.032-.447.046-.672a.75.75 0 0 0-1.497-.092c-.013.217-.028.434-.044.651a3.256 3.256 0 0 1-3.01 3.01 47.953 47.953 0 0 1-7.21 0 3.256 3.256 0 0 1-3.01-3.01 47.759 47.759 0 0 1-.1-1.759L6.97 15.53a.75.75 0 0 0 1.06-1.06l-3-3Z"
        clipRule="evenodd"
      />
    </svg>
  );

  const content = loading ? loader : children ? children : (
    <>
      {text ? (
        <p className="ButtonCC-Text">{text}</p>
      ) : null}
      {icon ? (
        <div className="ButtonCC-Icon" style={{ marginLeft: text ? "5px" : "0px" }}>
          {icon}
        </div>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={className}
        style={commonStyle}
        id="Button-CC-Animated"
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={submit ? "submit" : "button"}
      className={className}
      style={commonStyle}
      id={loading ? "Button-CC-Disabled" : "Button-CC-Animated"}
      onClick={onClick}
      disabled={loading}
    >
      {content}
    </button>
  );
};

export default ButtonCC;
