import React, { CSSProperties, useRef } from "react";
import { motion } from "motion/react";
const CardCC: React.FC<CardProps> = ({
  size,
  icon,
  name,
  title,
  onClick,
  onXClick,
  subtitle,
  colorSchema,
  animProps,
  styles,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      key={title}
      initial={animProps?.initial}
      animate={animProps?.animate}
      exit={animProps?.exit}
      transition={animProps?.transition}
      id={size}
      onClick={onClick}
      className={`CardCC ${colorSchema ? `CardCC-${colorSchema}` : ""} ${name}`}
    >
      {icon ? (
        <div className="iconContainer" style={styles?.svg}>
          {icon}
        </div>
      ) : null}
      <h4 className="cardCCTitle" ref={cardRef} style={styles?.title}>
        {" "}
        {title}
      </h4>
      {subtitle && (
        <p className="cardCCSubtitle" style={styles?.subtitle}>
          {subtitle}
        </p>
      )}

      {onXClick ? (
        <div className="xCorner" onClick={onXClick}>
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
        </div>
      ) : null}
    </motion.div>
  );
};

export default CardCC;
