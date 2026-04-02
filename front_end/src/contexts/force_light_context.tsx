"use client";

import { createContext, FC, PropsWithChildren, useContext } from "react";

const ForceLightContext = createContext(false);

export const useForcedLight = () => useContext(ForceLightContext);

export const ForceLightProvider: FC<PropsWithChildren> = ({ children }) => (
  <ForceLightContext.Provider value={true}>
    {children}
  </ForceLightContext.Provider>
);
