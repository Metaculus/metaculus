"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import { FeedLayout } from "@/components/ui/layout_switcher";
import { FEED_LAYOUT_COOKIE } from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import { InterfaceType } from "@/types/users";

type FeedLayoutContextType = {
  layout: FeedLayout;
  setLayout: (layout: FeedLayout) => void;
};

const FeedLayoutContext = createContext<FeedLayoutContextType>({
  layout: "grid",
  setLayout: () => {},
});

function getInitialLayout(
  cookieLayout: string | undefined,
  interfaceType: InterfaceType | undefined
): FeedLayout {
  if (cookieLayout === "list" || cookieLayout === "grid") {
    return cookieLayout;
  }
  return interfaceType === InterfaceType.ForecasterView ? "list" : "grid";
}

const FeedLayoutProvider: FC<PropsWithChildren<{ cookieLayout?: string }>> = ({
  cookieLayout,
  children,
}) => {
  const { user } = useAuth();
  const [layout, setLayoutState] = useState<FeedLayout>(() =>
    getInitialLayout(cookieLayout, user?.interface_type)
  );

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
