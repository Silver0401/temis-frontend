"use client";

import React, { useContext } from "react";
import { GlobalContext, useGlobalContext } from "@/e2e/globalContext";
import ButtonCC from "@/components/Button-CC";
import { useRouter } from "next/navigation";
import IconsCC from "@/assets/icons/IconsCC";

interface NotFoundProps {
  type: "error" | "unauthorized";
}

const NotFound: React.FC<NotFoundProps> = ({ type }) => {
  const { getAccessToken } = useGlobalContext();
  const router = useRouter();

  return (
    <main className="NotFound">
      <div className="NFIconContainer">
        {getAccessToken().jwtExpired ? IconsCC.IdSearch : IconsCC.Compass}
      </div>
      <div className="NFTextContainer">
        <div className="innerContainer">
          <h2>
            {getAccessToken().jwtExpired
              ? "Sesión Terminada"
              : type === "error"
                ? "Oops!"
                : "No Autorizado"}
          </h2>
          <p className="subtitle">
            {getAccessToken().jwtExpired
              ? "Por seguridad tu sesión expira cada semana o día (dependiendo de tu configuración). Vuelve a ingresar a tu cuenta nuevamente."
              : type === "error"
                ? "Hubo un error en la página que buscas"
                : "No tienes acceso a esta página"}
          </p>
          <ButtonCC
            type="Solid" size="lg"
            text={
              getAccessToken().jwtExpired
                ? "Iniciar Sesión"
                : "Regresar al Inicio"
            }
            onClick={() => router.push(type === "error" ? "/" : "/account")}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path
                  fillRule="evenodd"
                  d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm5.03 4.72a.75.75 0 0 1 0 1.06l-1.72 1.72h10.94a.75.75 0 0 1 0 1.5H10.81l1.72 1.72a.75.75 0 1 1-1.06 1.06l-3-3a.75.75 0 0 1 0-1.06l3-3a.75.75 0 0 1 1.06 0Z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />
        </div>
      </div>
    </main>
  );
};

export default NotFound;
