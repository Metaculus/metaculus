"use client";

import { createContext, FC, PropsWithChildren, useContext } from "react";

import {
  type PublicSettings,
  defaultPublicSettingsValues,
} from "@/utils/public_settings";

export const PublicSettingsContext = createContext<PublicSettings>(
  defaultPublicSettingsValues
);

const PublicSettingsProvider: FC<
  PropsWithChildren<{ settings: PublicSettings }>
> = ({ children, settings }) => {
  return (
    <PublicSettingsContext.Provider value={settings}>
      {children}
    </PublicSettingsContext.Provider>
  );
};

export const usePublicSettings = () => useContext(PublicSettingsContext);
export default PublicSettingsProvider;
