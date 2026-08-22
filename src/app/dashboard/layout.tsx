"use client";

import SideNav from "@/library/Dashboard/SideNav";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Verify_Login } from "@/e2e/server/Queries";
import FancyLoader from "@/library/Generics/Loaders/FancyLoader";
import NotFound from "@/library/Generics/NotFound";
import { useGlobalContext } from "@/e2e/globalContext";
import { DashboardContextProvider } from "@/e2e/dashboardContext";

import DashboardByRole from "@/library/Dashboard/DashboardByRole";

import { setRouteTransitionLoader } from "@/components/RouteTransitionLoader";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { getAccessToken } = useGlobalContext();
  const { isLoading, data } = useQuery(Verify_Login(getAccessToken()));

  useEffect(() => {
    if (!isLoading) {
      setRouteTransitionLoader(false);
    }
  }, [isLoading]);

  return isLoading ? (
    <FancyLoader />
  ) : !data?.data ||
    getAccessToken().accessToken === undefined ||
    getAccessToken().jwtExpired ? (
    <NotFound type="unauthorized" />
  ) : (
    <DashboardContextProvider>
      <DashboardByRole user={data.data.user}>
        <div className="DashboardWrapper">
          <div className="DashboardSection">{children}</div>
          <SideNav />
        </div>
      </DashboardByRole>
    </DashboardContextProvider>
  );
}
