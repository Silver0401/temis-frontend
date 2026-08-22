"use client";

import { ServerSideRequest } from "@/scripts/Constants";
import { AxiosResponse } from "axios";

// These are Intended API Requests used with useQuery Hook
// ------------------------------------------------------------------------
// Benefits: These give you control of FrontEnd process control (custom loaders, handlers, onSuccess functions, etc)
// Downside: The Information sent in the Request can be seen in the client (can expose the information)

export const Verify_Login = ({ accessToken, jwtExpired }: AccessTokenProps) => {
  return {
    enabled: accessToken && !jwtExpired ? true : false,
    queryKey: ["Verify_Login"],
    queryFn: (): Promise<AxiosResponse<LoginResponse>> | undefined => {
      return ServerSideRequest<LoginResponse>({
        method: "post",
        route: "/authentication",
        data: {
          strategy: "jwt",
          accessToken: accessToken ? accessToken : "none",
        },
        accessToken,
      });
    },
  };
};
