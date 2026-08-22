"use client";

import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface coso {
  debugger: boolean;
  children: React.ReactNode;
}

export const QueryContextProvider: React.FC<PropsWithChildren<coso>> = (
  props,
): React.ReactNode => {
  const [client] = useState(
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 min fresh
          gcTime: 30 * 60 * 1000, // keep cached 30 min
          refetchOnMount: false, // don't auto-refetch if cached
          refetchOnWindowFocus: false, // don't refetch on tab focus
        },
      },
    }),
  );

  // const instanceId = useRef(Math.random().toString(36).slice(2));

  // useEffect(() => {
  //   console.log("[QueryContextProvider] mounted", instanceId.current);
  //   return () => {
  //     console.log("[QueryContextProvider] unmounted", instanceId.current);
  //   };
  // }, []);

  useEffect(() => {
    if (props.debugger) return;
    // normal side effects here
  }, [props.debugger]);

  return (
    <QueryClientProvider client={client}>{props.children}</QueryClientProvider>
  );
};
