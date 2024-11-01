"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

export type HideCPContextType = {
  showCommunity: boolean;
  setShowCommunity: (showCommunity: boolean) => void;
};

export const ShowCommunityContext = createContext<HideCPContextType>({
  showCommunity: false,
  setShowCommunity: () => {},
});

type CommunityProviderProps = {};
const ShowCommunityProvider: FC<PropsWithChildren<CommunityProviderProps>> = ({
  children,
}) => {
  const [showCommunity, setShowCommunity] = useState<boolean>(false);

  return (
    <ShowCommunityContext.Provider value={{ showCommunity, setShowCommunity }}>
      {children}
    </ShowCommunityContext.Provider>
  );
};

export const useShowCommunity = () => useContext(ShowCommunityContext);
export default ShowCommunityProvider;
