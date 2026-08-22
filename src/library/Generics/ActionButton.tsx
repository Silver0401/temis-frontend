import React, { ButtonHTMLAttributes } from "react";

interface ActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "filter" | "danger";
  size?: "default" | "compact";
}

const ActionButton: React.FC<ActionButtonProps> = ({
  variant = "secondary",
  size = "default",
  type = "button",
  className,
  children,
  ...props
}) => (
  <button
    {...props}
    type={type}
    className={["ActionButton", className].filter(Boolean).join(" ")}
    data-variant={variant}
    data-size={size}
  >
    {children}
  </button>
);

export default ActionButton;
