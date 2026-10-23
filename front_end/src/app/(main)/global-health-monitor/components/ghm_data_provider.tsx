"use client";

import { createContext, ReactNode, useContext } from "react";

import { GhmValueKey } from "../config/questions";
import { GhmSnapshot, TokenDatum } from "../helpers/snapshot";

const GhmDataContext = createContext<GhmSnapshot | null>(null);

export function GhmDataProvider({
  snapshot,
  children,
}: {
  snapshot: GhmSnapshot;
  children: ReactNode;
}) {
  return (
    <GhmDataContext.Provider value={snapshot}>
      {children}
    </GhmDataContext.Provider>
  );
}

export function useGhmSnapshot(): GhmSnapshot | null {
  return useContext(GhmDataContext);
}

export function useGhmValue(key: GhmValueKey): TokenDatum | null {
  return useContext(GhmDataContext)?.values[key] ?? null;
}
