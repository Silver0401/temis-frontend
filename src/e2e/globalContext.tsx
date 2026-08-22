"use client";

import React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  PropsWithChildren,
} from "react";
import axios from "axios";
import { Application } from "@feathersjs/feathers";

import { toast } from "sonner";
import ModalCC from "@/components/Modal-CC";
import { GlobalModalDefault } from "@/scripts/Constants";
import getFeathersClient from "./client/feathersClient";

interface GlobalContextProps {
  //  ------- App Color Schemas -------------
  appDaySchema: boolean;
  setAppDaySchema: React.Dispatch<React.SetStateAction<boolean>>;

  // --------- Backend ---------------
  getAccessToken: () => AccessTokenProps;
  feathersFetchCC: <T>(
    data: feathersApiProps,
  ) => Promise<GenericFeathersApiResponse<T>>;
  axiosFetchCC: <T>(data: axiosApiProps) => Promise<GenericAxiosApiResponse<T>>;
  registerLog: (props: LogObject, accessToken?: string) => void;

  // --------- Demo Mode ---------------

  // --------- Global Components ---------------
  globalModal: GlobalModalProps;
  setGlobalModal: React.Dispatch<React.SetStateAction<GlobalModalProps>>;
}

export const GlobalContext = createContext<GlobalContextProps>({
  appDaySchema: false,
  setAppDaySchema: () => {},
  getAccessToken: () => {
    return { accessToken: "none", jwtExpired: false };
  },
  feathersFetchCC: () => new Promise(() => {}),
  axiosFetchCC: () => new Promise(() => {}),
  globalModal: {
    Component: undefined,
    Settings: {
      identifier: "GlobalModal",
      size: "imgFullScreen",
      animation: "popUp",
    },
  },
  registerLog: () => {},
  setGlobalModal: () => {},
});

export function useGlobalContext() {
  const ctx = useContext(GlobalContext);

  // console.log("[useGlobalContext] context object", GlobalContext);
  // console.log("[useGlobalContext] value", ctx);

  // if (!ctx) {
  //   console.error(
  //     "---------------------------------------- [useGlobalContext] GlobalContext is undefined here ----------------------------------------------",
  //   );
  // }

  return ctx;
}

export const GlobalContextProvider = React.memo(
  (props: { children: React.ReactNode; debugger: boolean }) => {
    const feathersAPI = useRef<Application<any> | undefined>(undefined);

    const [globalModalState, setGlobalModalState] = useState<boolean>(false);
    const [globalModal, setGlobalModal] =
      useState<GlobalModalProps>(GlobalModalDefault);

    useEffect(() => {
      if (props.debugger) return;
      // normal side effects here
    }, [props.debugger]);

    useEffect(() => {
      feathersAPI.current = getFeathersClient();
      // if (typeof window !== "undefined") {
      //   let api = feathers();
      //   const restClient = rest(`${process.env.NEXT_PUBLIC_NOT_BACKEND_URL}`);
      //   api.configure(restClient.fetch(window.fetch.bind(window)));
      //   setFeathersAPI(api);
      // }
    }, []);

    const getAccessToken = (): AccessTokenProps => {
      if (typeof window !== "undefined") {
        // return window.localStorage.getItem('authToken');
        const localToken = window.localStorage.getItem("notAccessToken");
        const sessionToken = window.sessionStorage.getItem("notAccessToken");
        const jwtExpired = window.localStorage.getItem("jwtExpired");
        let accessToken = undefined;

        if (sessionToken) {
          accessToken = sessionToken;
        }
        if (localToken) {
          accessToken = localToken;
        }

        return {
          accessToken,
          jwtExpired: jwtExpired === null ? false : true,
        };
      }

      return {
        accessToken: "none",
        jwtExpired: false,
      }; // Return a fallback value when window is not available
    };

    const [appDaySchema, setAppDaySchema] = useState<boolean>(false);

    // On Render App Change App Color Schema (day or night)
    useEffect(() => {
      const now = new Date();
      const hours = parseInt(now.getHours().toString().padStart(2, "0"));

      if (hours <= 18 && hours >= 5) {
        setAppDaySchema(true);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const registerLog = (props: LogObject, accessToken?: string) => {
      feathersAPI.current
        ?.service("logs")
        .create(props, {
          headers: {
            Authorization: `Bearer ${accessToken || getAccessToken().accessToken}`,
            "Content-Type": "application/json",
          },
        })
        .catch((err) => {
          console.log(err);
        });
    };

    const feathersFetchCC = async <T,>(
      props: feathersApiProps,
    ): Promise<GenericFeathersApiResponse<T>> => {
      const formatPropsToLog = (errorMessage: string | null) => {
        const resourceId =
          props.method === "get" || props.method === "remove"
            ? props.data && props.data.includes("~")
              ? props.data.split("~")[1]
              : props.data
            : props.resourceId;

        const patientId =
          props.method === "get" || props.method === "remove"
            ? props.data && props.data.includes("~")
              ? props.data.split("~")[0]
              : props.data
            : props.patientId;

        const logObject: LogObject = {
          patientId,
          resourceId,
          resourceType: `${props.service}~${props.method}`,
          action: props.logId,
          timestamp: new Date().toISOString(),
          status: errorMessage ? "error" : "success",
          sessionRef: `${getAccessToken().accessToken?.slice(0, 5)}`,
        };

        if (errorMessage) {
          logObject.errorMessage = errorMessage;
        }
        if (!props.patientId) {
          delete logObject.patientId;
        }
        if (!props.resourceId) {
          delete logObject.resourceId;
        }

        return logObject;
      };

      if (props.logs) {
        console.log("route", `${process.env.NEXT_PUBLIC_NOT_BACKEND_URL}`);
        console.log(props);
      }

      const dynamicRequest: any[] = [
        props.data ? props.data : "getRequest",
        props.noAuthService
          ? null
          : {
              headers: {
                Authorization: `Bearer ${props.service === "users" && props.method === "create" ? "" : getAccessToken().accessToken}`,
                "Content-Type": "application/json",
                strategy: "jwt",
              },
              query: props.query,
            },
      ];

      if (props.resourceId) {
        dynamicRequest.unshift(props.resourceId);
      }

      if (props.logs) console.log(dynamicRequest);

      return new Promise(async (resolve) => {
        let toastId: string | number | undefined = undefined;

        if (props.loadingToast) {
          toastId = toast.loading(props.loadingToast);
        }

        // @ts-ignore
        await feathersAPI.current
          ?.service(props.service)
          [props.method](...dynamicRequest)
          .then((res: any) => {
            const successProps: GenericFeathersApiResponse<T> = {
              type: "success",
              message: props.successToast
                ? props.successToast
                : "Successfull feathers api request",
              data: res.data ? res.data : res,
              req: props,
            };
            props.successToast && toast.success(props.successToast);

            if (props.logs) {
              console.log(res);
              console.log(successProps);
            }

            try {
              if (!props.nonLoggable) registerLog(formatPropsToLog(null));
            } catch (err) {
              console.log("Error registrando log:", err);
            }

            resolve(successProps);
          })
          .catch((err: any) => {
            const possibleErrors = [];

            console.log("Feathers API Error:", err);
            console.log("", err.errors);

            try {
              possibleErrors.push(err?.message);
            } catch {}
            try {
              err?.errors.map((e: { field: string; message: string }) =>
                possibleErrors.push(`${e.field}: ${e.message}`),
              );
            } catch {}
            try {
              possibleErrors.push(err?.data?.[0]?.message);
            } catch {}
            try {
              possibleErrors.push(err?.data?.personalInfo?.message);
            } catch {}

            const filteredPossibleErrors = possibleErrors.filter(
              (err) => err !== undefined,
            );

            const retrievedError =
              filteredPossibleErrors.length === 0
                ? "Error Desconocido"
                : filteredPossibleErrors.reduce((errA, errB) => {
                    return errA.length > errB.length ? errA : errB;
                  });

            if (!retrievedError.includes("DupPatient")) {
              if (filteredPossibleErrors.length > 0) {
                filteredPossibleErrors.map((err) => toast.error(err));
              } else {
                toast.error(retrievedError);
              }
            }

            const errorProps: GenericFeathersApiResponse<T> = {
              type: "error",
              message: retrievedError,
              data: err,
              req: props,
            };

            try {
              if (!props.nonLoggable || !props.noAuthService)
                registerLog(formatPropsToLog(retrievedError));
            } catch (err) {}

            resolve(errorProps);
          })
          .finally(() => {
            if (toastId) {
              toast.dismiss(toastId);
            }
          });
      });
    };

    const axiosFetchCC = async <T,>(
      props: axiosApiProps,
    ): Promise<GenericAxiosApiResponse<T>> => {
      if (props.logs) console.log(props);
      return new Promise(async (resolve) => {
        try {
          const headers: { "Content-Type": string; Authorization?: string } = {
            Authorization: `Bearer ${getAccessToken().accessToken}`,
            "Content-Type": "application/json",
          };

          const formatPropsToLog = (errorMessage: string | null) => {
            const resourceId = props.resourceId;

            const patientId = props.patientId;

            const logObject: LogObject = {
              patientId,
              resourceId,
              resourceType: `${props.route}~${props.method}`,
              action: props.logId,
              timestamp: new Date().toISOString(),
              status: errorMessage ? "error" : "success",
              sessionRef: `${getAccessToken().accessToken?.slice(0, 5)}`,
            };

            if (errorMessage) {
              logObject.errorMessage = errorMessage;
            }
            if (!props.patientId) {
              delete logObject.patientId;
            }
            if (!props.resourceId) {
              delete logObject.resourceId;
            }

            return logObject;
          };

          if (
            props.route.includes("/authentication") ||
            props.requestType === "external"
          ) {
            delete headers.Authorization;
          }

          await axios({
            url:
              props.requestType === "internal"
                ? `${process.env.NEXT_PUBLIC_NOT_BACKEND_URL}/${props.route}`
                : `${props.route}`,
            headers,
            method: props.method,
            data:
              props.method !== "get" && props.method !== "delete"
                ? // @ts-ignore
                  props.data
                : "",
          })
            .then((res) => {
              const successProps: GenericAxiosApiResponse<T> = {
                type: "success",
                message: props.successToast
                  ? props.successToast
                  : "Successfull axios api request",
                data: res.data,
                req: props,
              };

              props.successToast && toast.success(props.successToast);

              if (props.logs) {
                console.log(res);
                console.log(successProps);
              }

              try {
                if (!props.nonLoggable && props.requestType === "internal") {
                  registerLog(formatPropsToLog(null), res.data.accessToken);
                }
              } catch (err) {
                console.log("Error registrando log:", err);
              }
              resolve(successProps);
            })
            .catch((err) => {
              props.errorToast && toast.success(props.errorToast);

              const errorProps: GenericAxiosApiResponse<T> = {
                type: "error",
                message: props.errorToast,
                data: err,
                req: props,
              };

              if (props.logs) {
                console.log(err);
                console.log(errorProps);
              }

              try {
                if (!props.nonLoggable && props.requestType === "internal") {
                  registerLog(formatPropsToLog(err));
                }
              } catch (err) {
                console.log("Error registrando log:", err);
              }

              resolve(errorProps);
            });
        } catch (err) {
          toast.error("Error de Conexión");
        }
      });
    };

    useEffect(() => {
      if (globalModal.Component) {
        setGlobalModalState(true);
      } else {
        setGlobalModalState(false);
      }
    }, [globalModal]);

    return (
      <GlobalContext.Provider
        value={{
          appDaySchema,
          setAppDaySchema,
          feathersFetchCC,
          axiosFetchCC,
          getAccessToken,
          globalModal,
          registerLog,
          setGlobalModal,
        }}
      >
        {props.children}
        <ModalCC
          {...globalModal.Settings}
          useStates={{ state: globalModalState, setState: setGlobalModalState }}
          onModalClose={() => setGlobalModal(GlobalModalDefault)}
        >
          {globalModal.Component}
        </ModalCC>
      </GlobalContext.Provider>
    );
  },
);
GlobalContextProvider.displayName = "GlobalContextProvider";
