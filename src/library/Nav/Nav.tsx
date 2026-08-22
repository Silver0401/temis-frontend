"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SchemaSwitchCC from "@/components/SchemaSwitch-CC";
import ButtonCC from "@/components/Button-CC";
import { useRouter } from "next/navigation";
import { useGlobalContext } from "@/e2e/globalContext";
import { useQuery } from "@tanstack/react-query";
import { Verify_Login } from "@/e2e/server/Queries";
import LoaderCC from "@/components/Loader-CC";
import { usePathname } from "next/navigation";
import IconsCC from "@/assets/icons/IconsCC";
import LogoCC from "@/components/Logo-CC";

const Nav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { getAccessToken } = useGlobalContext();
  const [navState, setNavState] = useState<"opened" | "closed">("closed");
  const { isLoading, data, error } = useQuery(Verify_Login(getAccessToken()));
  const [isClient, setIsClient] = useState(false);

  //  ------------ Check if On Client to Avoid Rehydration Mismatch -------------
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ------------ On JWT Token Expired detected, disable Access ----------------
  useEffect(() => {
    // @ts-ignore
    if (error && error.response) {
      // @ts-ignore
      // error.response.data.data.name === "TokenExpiredError";
      // // @ts-ignore
      // console.log(error.response.data.data.name);
      window.localStorage.setItem("jwtExpired", "true");
    }
  }, [error]);

  // El dashboard trae su propia SideNav y la demo corre a pantalla completa.
  // `/` sí lleva nav: en Temis es el login/register, no la landing de Cronos
  // (que traía su propia barra y por eso se ocultaba esta).
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/demo"))
    return null;

  return (
    <nav
      className="globalNav"
      id={pathname.includes("dashboard") ? "AcoplateToDashboard" : undefined}
    >
      <Link href="/" className="Logo">
        <LogoCC />
      </Link>

      <div
        className="menu cross menu--1"
        onChange={() =>
          navState === "opened" ? setNavState("closed") : setNavState("opened")
        }
      >
        <label className="navMenuLabel">
          <input
            type="checkbox"
            checked={navState === "opened" ? true : false}
            readOnly
          />
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="30" />
            <path
              className="burguerPath line--1"
              d="M0 40h62c13 0 6 28-4 18L35 35"
            />
            <path className="burguerPath line--2" d="M0 50h70" />
            <path
              className="burguerPath line--3"
              d="M0 60h62c13 0 6-28-4-18L35 65"
            />
          </svg>
        </label>
      </div>

      <ul className={navState}>
        <li className="SwitchContainer">
          <SchemaSwitchCC />
        </li>

        {/* <li className="Ai">
          <InputCC
            identifier="AINavInput"
            placeholder="Temis IA ..."
            type="text"
            onClick={() => setAssistantModalOpen(true)}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path d="M16.5 7.5h-9v9h9v-9Z" />
                <path
                  fillRule="evenodd"
                  d="M8.25 2.25A.75.75 0 0 1 9 3v.75h2.25V3a.75.75 0 0 1 1.5 0v.75H15V3a.75.75 0 0 1 1.5 0v.75h.75a3 3 0 0 1 3 3v.75H21A.75.75 0 0 1 21 9h-.75v2.25H21a.75.75 0 0 1 0 1.5h-.75V15H21a.75.75 0 0 1 0 1.5h-.75v.75a3 3 0 0 1-3 3h-.75V21a.75.75 0 0 1-1.5 0v-.75h-2.25V21a.75.75 0 0 1-1.5 0v-.75H9V21a.75.75 0 0 1-1.5 0v-.75h-.75a3 3 0 0 1-3-3v-.75H3A.75.75 0 0 1 3 15h.75v-2.25H3a.75.75 0 0 1 0-1.5h.75V9H3a.75.75 0 0 1 0-1.5h.75v-.75a3 3 0 0 1 3-3h.75V3a.75.75 0 0 1 .75-.75ZM6 6.75A.75.75 0 0 1 6.75 6h10.5a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75V6.75Z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />
        </li> */}

        {isClient ? (
          isLoading ? (
            <div className="notInput">
              <div className="navLoadContainer">
                <LoaderCC />
              </div>
            </div>
          ) : (
            <>
              <li
                className="notInput lp-nav-login"
                onClick={() => setNavState("closed")}
              >
                {data?.data ? (
                  <Link
                    href={"/dashboard"}
                    onClick={() => setNavState("closed")}
                  >
                    <p>{"Mi Dashboard"}</p>
                    {IconsCC.Dashboard}
                  </Link>
                ) : (
                  <Link href={"/"}>
                    <p>{"Acceder"}</p>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-6"
                    >
                      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                    </svg>
                  </Link>
                )}
              </li>

              <li className="notInput lp-nav-demo">
                <ButtonCC
                  type="Phantom"
                  size="sm"
                  text="Mi Cuenta"
                  onClick={() => {
                    setNavState("closed");
                    router.push("/account");
                  }}
                />
              </li>
            </>
          )
        ) : null}
      </ul>
    </nav>
  );
};

export default Nav;
