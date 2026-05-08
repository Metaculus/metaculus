"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Community } from "@/types/projects";

export type TopChromeHeaderConfig =
  | {
      type: "community";
      community: Community | null;
      alwaysShowName?: boolean;
    }
  | {
      type: "default";
    };

type TopChromeHeaderState = {
  routeKey: string;
  header: TopChromeHeaderConfig;
};

type TopChromeHeaderContextType = {
  activeHeader: TopChromeHeaderConfig | null;
  routeKey: string;
  setHeaderForRoute: (routeKey: string, header: TopChromeHeaderConfig) => void;
};

const TopChromeHeaderContext = createContext<TopChromeHeaderContextType>({
  activeHeader: null,
  routeKey: "",
  setHeaderForRoute: () => {},
});

const getHeaderIdentity = (header: TopChromeHeaderConfig) => {
  if (header.type === "default") {
    return "default";
  }

  return `community:${header.community?.id ?? "none"}:${header.alwaysShowName ?? true}`;
};

export const TopChromeHeaderProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const routeKey = usePathname();
  const [headerState, setHeaderState] = useState<TopChromeHeaderState | null>(
    null
  );

  const activeHeader =
    headerState?.routeKey === routeKey ? headerState.header : null;

  const setHeaderForRoute = useCallback(
    (nextRouteKey: string, header: TopChromeHeaderConfig) => {
      setHeaderState((previousHeaderState) => {
        if (
          previousHeaderState?.routeKey === nextRouteKey &&
          getHeaderIdentity(previousHeaderState.header) ===
            getHeaderIdentity(header)
        ) {
          return previousHeaderState;
        }

        return { routeKey: nextRouteKey, header };
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      activeHeader,
      routeKey,
      setHeaderForRoute,
    }),
    [activeHeader, routeKey, setHeaderForRoute]
  );

  return (
    <TopChromeHeaderContext.Provider value={value}>
      {children}
    </TopChromeHeaderContext.Provider>
  );
};

export const useTopChromeHeader = () => useContext(TopChromeHeaderContext);

export const TopChromeHeaderSetter: FC<{
  header: TopChromeHeaderConfig;
}> = ({ header }) => {
  const { routeKey, setHeaderForRoute } = useTopChromeHeader();

  useEffect(() => {
    setHeaderForRoute(routeKey, header);
  }, [header, routeKey, setHeaderForRoute]);

  return null;
};
