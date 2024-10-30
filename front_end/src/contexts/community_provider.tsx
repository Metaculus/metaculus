"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

export type CurrentCommunity = {
  slug: string;
  name: string;
};

export type CurrentCommunityContextType = {
  currentCommunity: CurrentCommunity | null;
  setCurrentCommunity: (type: CurrentCommunity | null) => void;
};

export const CommunityContext = createContext<CurrentCommunityContextType>({
  currentCommunity: null,
  setCurrentCommunity: () => {},
});

const CommunityProvider: FC<PropsWithChildren> = ({ children }) => {
  const [currentCommunity, setCurrentCommunity] =
    useState<CurrentCommunity | null>(null);

  return (
    <CommunityContext.Provider
      value={{ currentCommunity, setCurrentCommunity }}
    >
      {children}
    </CommunityContext.Provider>
  );
};

export default CommunityProvider;
export const useCommunity = () => useContext(CommunityContext);
