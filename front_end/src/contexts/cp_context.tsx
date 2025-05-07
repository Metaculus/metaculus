"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import { useAuth } from "@/contexts/auth_context";
import { PostStatus, PostWithForecasts, QuestionStatus } from "@/types/post";

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
  forceHideCP?: boolean;
};
const HideCPProvider: FC<PropsWithChildren<CPProviderProps>> = ({
  post,
  children,
  forceHideCP,
}) => {
  const { user } = useAuth();
  let hideCP =
    user?.hide_community_prediction &&
    ![PostStatus.CLOSED, PostStatus.RESOLVED].includes(post.status);

  if (post.conditional) {
    const { condition } = post.conditional;
    const parentSuccessfullyResolved =
      condition.resolution === "yes" || condition.resolution === "no";
    const parentIsClosed = condition.status === QuestionStatus.CLOSED;
    const conditionClosedOrResolved =
      parentSuccessfullyResolved || parentIsClosed;
    hideCP = conditionClosedOrResolved ? false : hideCP;
  }

  const [currentHideCP, setCurrentHideCP] = useState<boolean>(
    !!forceHideCP || !!hideCP
  );

  return (
    <HideCPContext.Provider value={{ hideCP: currentHideCP, setCurrentHideCP }}>
      {children}
    </HideCPContext.Provider>
  );
};

export default HideCPProvider;
export const useHideCP = () => useContext(HideCPContext);
