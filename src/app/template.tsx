"use client";

import React, { ReactNode } from "react";
import { motion } from "motion/react";

const AppTransitionTemplate = ({ children }: { children: ReactNode }) => {
  return (
    <motion.div
      className="AppContainer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ ease: "easeInOut", duration: 1 }}
    >
      <main>{children}</main>
    </motion.div>
  );
};

export default AppTransitionTemplate;
