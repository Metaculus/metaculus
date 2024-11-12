"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

export type ShowActiveCommunityContextType = {
  showActiveCommunity: boolean;
  setShowActiveCommunity: (showCommunity: boolean) => void;
};

export const ShowActiveCommunityContext =
  createContext<ShowActiveCommunityContextType>({
    showActiveCommunity: false,
    setShowActiveCommunity: () => {},
  });

const ShowCommunityProvider: FC<PropsWithChildren> = ({ children }) => {
  const [showActiveCommunity, setShowActiveCommunity] =
    useState<boolean>(false);

  return (
    <ShowActiveCommunityContext.Provider
      value={{ showActiveCommunity, setShowActiveCommunity }}
    >
      {children}
    </ShowActiveCommunityContext.Provider>
  );
};

export const useShowActiveCommunityContext = () =>
  useContext(ShowActiveCommunityContext);
export default ShowCommunityProvider;
