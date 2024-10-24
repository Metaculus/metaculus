"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import { useAuth } from "@/contexts/auth_context";
import { PostStatus, PostWithForecasts } from "@/types/post";

export type HideCPContextType = {
  hideCP: boolean;
  setCurrentHideCP: (hideCP: boolean) => void;
};

export const HideCPContext = createContext<HideCPContextType>({
  hideCP: false,
  setCurrentHideCP: () => {},
});

type CPProviderProps = {
  post: PostWithForecasts;
};
const HideCPProvider: FC<PropsWithChildren<CPProviderProps>> = ({
  post,
  children,
}) => {
  const { user } = useAuth();
  const hideCP =
    user?.hide_community_prediction &&
    ![PostStatus.CLOSED, PostStatus.RESOLVED].includes(post.status);
  const [currentHideCP, setCurrentHideCP] = useState<boolean>(!!hideCP);

  return (
    <HideCPContext.Provider value={{ hideCP: currentHideCP, setCurrentHideCP }}>
      {children}
    </HideCPContext.Provider>
  );
};

export default HideCPProvider;
export const useHideCP = () => useContext(HideCPContext);
