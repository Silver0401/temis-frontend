"use client";

import { useQuery } from "@tanstack/react-query";

import { useGlobalContext } from "@/e2e/globalContext";
import { Verify_Login } from "@/e2e/server/Queries";
import MedicalTeam from "@/library/Dashboard/MedicalTeam";

export default function MyTeamPage() {
  const { getAccessToken } = useGlobalContext();
  const { data: userData } = useQuery(Verify_Login(getAccessToken()));
  return (
    <MedicalTeam
      role={userData?.data.user.role}
      ready={Boolean(userData?.data.user)}
    />
  );
}
