"use client";

import React, { ReactNode } from "react";
import { motion } from "motion/react";

const DashboardTransitionTemplate = ({ children }: { children: ReactNode }) => {
  return (
    <motion.div
      className="DashboardTransitioner"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ease: "easeInOut", duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
};

export default DashboardTransitionTemplate;
