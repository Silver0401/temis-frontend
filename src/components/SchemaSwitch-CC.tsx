"use client";

import React from "react";
import { useGlobalContext } from "@/e2e/globalContext";
import SwitchCC from "@/components/Switch-CC";

const SchemaSwitchCC: React.FC = () => {
  const { appDaySchema, setAppDaySchema } = useGlobalContext();

  return <SwitchCC customStates={[appDaySchema, setAppDaySchema]} />;
};

export default SchemaSwitchCC;
