"use client";

import { ReactNode } from "react";
import { useUser } from "@/context/UserContext";
import { PresentationProvider } from "@/context/PresentationContext";

export function KeyedPresentationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useUser();
  const key = isAuthenticated && user?.id ? `user-${user.id}` : "anon";
  return <PresentationProvider key={key}>{children}</PresentationProvider>;
}