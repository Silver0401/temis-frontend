import { Application, feathers } from "@feathersjs/feathers";
import rest from "@feathersjs/rest-client";

declare global {
  interface Window {
    __feathersApi?: Application<any>;
  }
}

const getFeathersClient = () => {
  if (typeof window === "undefined") return undefined;

  if (!window.__feathersApi) {
    const api = feathers();
    const restClient = rest(process.env.NEXT_PUBLIC_NOT_BACKEND_URL!);
    api.configure(restClient.fetch(window.fetch.bind(window)));
    window.__feathersApi = api;
  }

  return window.__feathersApi;
};

export default getFeathersClient;
