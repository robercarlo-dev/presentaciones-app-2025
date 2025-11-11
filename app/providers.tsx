"use client";

import { ReactNode } from "react";
import { UserProvider } from "@/context/UserContext";
import QueryProvider from "@/app/providers/QueryProvider"; // Solo si usas React Query
import { KeyedPresentationProvider } from "@/context/KeyedPresentationProvider";

export default function RootProviders({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      {/* Usa uno u otro, no ambos a la vez */}
      <QueryProvider>
      {/* <SWRProvider> */}
        <KeyedPresentationProvider>{children}</KeyedPresentationProvider>
      {/* </SWRProvider> */}
      </QueryProvider>
    </UserProvider>
  );
}