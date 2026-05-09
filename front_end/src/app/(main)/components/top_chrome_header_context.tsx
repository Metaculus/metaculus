"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

import {
  normalizeTopChromeRouteKey,
  type TopChromeHeaderConfig,
  type TopChromeHeaderState,
} from "./top_chrome_header_shared";

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

export const TopChromeHeaderProvider: FC<
  PropsWithChildren<{
    initialHeaderState?: TopChromeHeaderState | null;
  }>
> = ({ children, initialHeaderState }) => {
  const routeKey = normalizeTopChromeRouteKey(usePathname());
  const [headerState, setHeaderState] = useState<TopChromeHeaderState | null>(
    () =>
      initialHeaderState
        ? {
            ...initialHeaderState,
            routeKey: normalizeTopChromeRouteKey(initialHeaderState.routeKey),
          }
        : null
  );

  const activeHeader =
    headerState?.routeKey === routeKey ? headerState.header : null;

  const setHeaderForRoute = useCallback(
    (nextRouteKey: string, header: TopChromeHeaderConfig) => {
      const normalizedRouteKey = normalizeTopChromeRouteKey(nextRouteKey);

      setHeaderState((previousHeaderState) => {
        if (
          previousHeaderState?.routeKey === normalizedRouteKey &&
          getHeaderIdentity(previousHeaderState.header) ===
            getHeaderIdentity(header)
        ) {
          return previousHeaderState;
        }

        return { routeKey: normalizedRouteKey, header };
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

  useLayoutEffect(() => {
    setHeaderForRoute(routeKey, header);
  }, [header, routeKey, setHeaderForRoute]);

  return null;
};
