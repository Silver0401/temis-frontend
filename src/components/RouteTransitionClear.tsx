"use client";

import { useEffect } from "react";
import { setRouteTransitionLoader } from "@/components/RouteTransitionLoader";

const RouteTransitionClear: React.FC = () => {
  useEffect(() => {
    setRouteTransitionLoader(false);
  }, []);

  return null;
};

export default RouteTransitionClear;
