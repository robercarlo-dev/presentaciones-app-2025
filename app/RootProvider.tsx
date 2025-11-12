"use client";

import { ReactNode } from "react";
import { UserProvider } from "@/context/UserContext";
import QueryProvider from "@/app/providers/QueryProvider"; // Solo si usas React Query
import { KeyedPresentationProvider } from "@/context/KeyedPresentationProvider";

export default function RootProvider({ children }: { children: ReactNode }) {

  return (
    <UserProvider>
      <QueryProvider>
        <KeyedPresentationProvider>{children}</KeyedPresentationProvider>
      </QueryProvider>
    </UserProvider>
  );
}