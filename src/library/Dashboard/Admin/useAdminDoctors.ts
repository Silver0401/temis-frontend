"use client";

import { useQuery } from "@tanstack/react-query";

import { useGlobalContext } from "@/e2e/globalContext";
import { Get_Admin_Doctors } from "@/e2e/server/FeathersAPI";

import type { AdminDoctor } from "./adminTypes";

/**
 * Catálogo de médicos para los selectores de las tres secciones de admin.
 * Comparte `queryKey` para que las tres pantallas reusen la misma respuesta.
 */
export const useAdminDoctors = () => {
  const { feathersFetchCC } = useGlobalContext();

  return useQuery({
    queryKey: ["admin-doctors"],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await feathersFetchCC<AdminDoctor[]>(
        await Get_Admin_Doctors(),
      );
      if (response.type === "error") throw new Error("admin-doctors-error");
      return response.data;
    },
  });
};
