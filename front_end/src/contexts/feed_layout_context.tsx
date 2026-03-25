"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import { FeedLayout } from "@/components/ui/layout_switcher";
import {
  FEED_LAYOUT_COOKIE,
  FEED_LAYOUT_DEFAULT,
} from "@/constants/posts_feed";

type FeedLayoutContextType = {
  layout: FeedLayout;
  setLayout: (layout: FeedLayout) => void;
};

const FeedLayoutContext = createContext<FeedLayoutContextType>({
  layout: FEED_LAYOUT_DEFAULT,
  setLayout: () => {},
});

const FeedLayoutProvider: FC<
  PropsWithChildren<{ initialLayout: FeedLayout }>
> = ({ initialLayout, children }) => {
  const [layout, setLayoutState] = useState<FeedLayout>(initialLayout);

  const setLayout = (newLayout: FeedLayout) => {
    setLayoutState(newLayout);
    document.cookie = `${FEED_LAYOUT_COOKIE}=${newLayout};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
  };

  return (
    <FeedLayoutContext.Provider value={{ layout, setLayout }}>
      {children}
    </FeedLayoutContext.Provider>
  );
};

export default FeedLayoutProvider;
export const useFeedLayout = () => useContext(FeedLayoutContext);
