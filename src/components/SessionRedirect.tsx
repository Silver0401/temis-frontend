"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useGlobalContext } from "@/e2e/globalContext";
import { Verify_Login } from "@/e2e/server/Queries";
import { setRouteTransitionLoader } from "@/components/RouteTransitionLoader";

/**
 * Manda al dashboard al visitante que ya trae sesión. No pinta nada: la home
 * se sirve completa para todos y este componente sólo decide, en el cliente,
 * si además hay que salir de ella.
 *
 * Sustituye al IntroLoader que antes vivía en `/`. Aquel era una ruta propia
 * cuyo HTML no contenía la landing y saltaba a `/home` con `router.replace`,
 * así que la portada del dominio llegaba vacía a los buscadores. Al servir la
 * home en `/`, el HTML es idéntico para el rastreador y para la persona; lo
 * único que cambia es que a quien trae token se le cambia la ruta encima.
 *
 * Sin animación de entrada a propósito: el barrido de tres segundos era espera
 * forzada para el visitante nuevo, que es justo a quien la landing va dirigida.
 * El loader persistente (`RouteTransitionLoader`) sigue cubriendo la ventana en
 * que el dashboard verifica la sesión, que es donde sí hay trabajo real detrás.
 */
const SessionRedirect: React.FC = () => {
  const router = useRouter();
  const { getAccessToken } = useGlobalContext();
  const accessToken = getAccessToken();
  const hasStoredToken =
    Boolean(accessToken.accessToken) &&
    !accessToken.jwtExpired &&
    accessToken.accessToken !== "none";

  const { data, isSuccess } = useQuery(Verify_Login(accessToken));

  useEffect(() => {
    if (!hasStoredToken) return;
    router.prefetch("/dashboard");
  }, [hasStoredToken, router]);

  useEffect(() => {
    if (!hasStoredToken || !isSuccess || !data?.data) return;
    // El loader se enciende antes de cambiar de ruta para que el dashboard no
    // aparezca en blanco mientras revalida; `dashboard/layout.tsx` lo apaga.
    setRouteTransitionLoader(true);
    router.replace("/dashboard");
  }, [data?.data, hasStoredToken, isSuccess, router]);

  return null;
};

export default SessionRedirect;
