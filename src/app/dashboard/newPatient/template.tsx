"use client";

import React, { ReactNode } from "react";
import { motion } from "motion/react";

const NewPatientTemplate = ({ children }: { children: ReactNode }) => {
  return (
    <motion.div
      className="NewPatientTransitioner"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ease: "easeInOut", duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
};

export default NewPatientTemplate;
