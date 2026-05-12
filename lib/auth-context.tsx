"use client";

import { createContext, useContext } from "react";
import type { CurrentOrg } from "@/lib/supabase/server";

type ClientAuthContext = {
  org: CurrentOrg;
  user: {
    id: string;
    email: string | null;
  };
};

const AuthContext = createContext<ClientAuthContext | null>(null);

export function AuthProvider({
  value,
  children,
}: {
  value: ClientAuthContext;
  children: React.ReactNode;
}) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuthContext must be used inside AuthProvider.");
  }

  return value;
}

export function useCurrentOrg() {
  return useAuthContext().org;
}
