"use client";

import NewsSection from "@/library/Account/NewsSection";
import LogRegisterSection from "@/library/Account/LogRegister";
import ProfileSection from "@/library/Account/MyProfile";
import { useQuery } from "@tanstack/react-query";
import FancyLoader from "@/library/Generics/Loaders/FancyLoader";
import { Verify_Login } from "@/e2e/server/Queries";
import { useGlobalContext } from "@/e2e/globalContext";
import { useEffect, useState } from "react";

export default function Account() {
  const { getAccessToken } = useGlobalContext();
  const [accessToken, setAccessToken] = useState<AccessTokenProps | null>(null);
  const { isLoading, data } = useQuery(
    Verify_Login(accessToken ?? { accessToken: undefined, jwtExpired: false }),
  );

  useEffect(() => {
    setAccessToken(getAccessToken());
  }, [getAccessToken]);

  return !accessToken || isLoading ? (
    <FancyLoader />
  ) : (
    <section className="AccountSection" id="GeneralSection">
      <div className="innerAccountContainer">
        {data?.data ? (
          <ProfileSection />
        ) : (
          <>
            <LogRegisterSection />
            <NewsSection />
          </>
        )}
      </div>
    </section>
  );
}
