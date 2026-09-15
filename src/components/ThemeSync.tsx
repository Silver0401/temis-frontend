"use client";

import { useEffect } from "react";
import { useGlobalContext } from "@/e2e/globalContext";

export default function ThemeSync() {
  const { appDaySchema } = useGlobalContext();

  useEffect(() => {
    const root = document.documentElement;

    Array.from(root.style).forEach((property) => {
      if (property.startsWith("--")) root.style.removeProperty(property);
    });
    root.dataset.theme = appDaySchema ? "day" : "night";
  }, [appDaySchema]);

  return null;
}
