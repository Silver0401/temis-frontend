"use client";

import { AnimatePresence, motion } from "motion/react";
import React, { PropsWithChildren } from "react";

// Motion tokens. EASE == --lp-ease (globals.css). Close más snappy que open.
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];
const D_OPEN = 0.42;
const D_CLOSE = 0.28;

const backdropVariants = {
  hidden: { opacity: 0, transition: { duration: D_CLOSE, ease: EASE } },
  visible: { opacity: 1, transition: { duration: D_OPEN, ease: EASE } },
};

const popUpVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: D_OPEN, ease: "backOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    transition: { duration: D_CLOSE, ease: "easeIn" },
  },
};

const bottomSlideVariants = {
  hidden: { opacity: 0, y: "100%" },
  visible: {
    opacity: 1,
    y: "0%",
    transition: { duration: D_OPEN, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: "100%",
    transition: { duration: D_CLOSE, ease: "easeIn" },
  },
};

const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: D_OPEN, ease: EASE } },
  exit: { opacity: 0, transition: { duration: D_CLOSE, ease: EASE } },
};

const ModalCC: React.FC<PropsWithChildren<ModalCCprops>> = ({
  size,
  schema,
  children,
  animation,
  relative,
  useStates,
  identifier,
  onModalClose,
}) => {
  const close = () => useStates.setState(false);

  return (
    <AnimatePresence onExitComplete={onModalClose}>
      {useStates.state && (
        <motion.div
          key={identifier}
          className={`Modal-CC-Container ${
            schema ? "Schema-night" : "Schema-day"
          } Modal-CC-Container-${identifier}`}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          style={{
            width: relative ? "100%" : "100vw",
            height: relative ? "100%" : "100vh",
          }}
          onClick={close}
        >
          {size === "imgFullScreen" ? (
            <motion.div
              className={`fullModal-CC fullModal-CC-${identifier}`}
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {children}

              <div className="xModalButton" onClick={close}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className={`Modal-CC Modal-CC-${identifier}`}
              id={animation === "bottomSlide" ? "bottomSlideMod" : undefined}
              variants={
                animation === "bottomSlide" ? bottomSlideVariants : popUpVariants
              }
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => {
                e.stopPropagation();
              }}
              style={{
                width:
                  animation === "bottomSlide"
                    ? "90%"
                    : size === "small"
                      ? "350px"
                      : size === "medium"
                        ? "max(50%, 350px)"
                        : size === "extra large"
                          ? "90%"
                          : "max(60%, 350px)",
                height:
                  size === "small"
                    ? "250px"
                    : size === "medium"
                      ? "50%"
                      : size === "extra large"
                        ? "90%"
                        : "70%",
              }}
            >
              {children}
              <div className="xModalButton" onClick={close}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModalCC;
