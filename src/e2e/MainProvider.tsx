"use client";

import { GlobalContextProvider, GlobalContext } from "@/e2e/globalContext";
import { QueryContextProvider } from "@/e2e/queryContext";
import { Toaster } from "sonner";
import Nav from "@/library/Nav/Nav";
import ThemeSync from "@/components/ThemeSync";
import RouteTransitionLoader from "@/components/RouteTransitionLoader";

export default function MainProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryContextProvider debugger={true}>
      <GlobalContextProvider debugger={true}>
        <ThemeSync />
        <Toaster position="top-right" closeButton />
        <RouteTransitionLoader />
        <Nav />
        {children}
      </GlobalContextProvider>
    </QueryContextProvider>
  );
}
