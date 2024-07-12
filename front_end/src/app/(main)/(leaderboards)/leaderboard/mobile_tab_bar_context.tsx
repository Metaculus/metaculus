"use client";
import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import { CategoryKey } from "@/types/scoring";

type LeaderboardMobileTabBarContext = {
  activeCategoryKey: CategoryKey;
  updateActiveCategoryKey: (categoryKey: CategoryKey) => void;
};

const LeaderboardMobileTabBarContext = createContext(
  {} as LeaderboardMobileTabBarContext
);

export const LeaderboardMobileTabBarProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [activeCategoryKey, setActiveCategoryKey] =
    useState<CategoryKey>("baseline");

  return (
    <LeaderboardMobileTabBarContext.Provider
      value={{
        activeCategoryKey,
        updateActiveCategoryKey: setActiveCategoryKey,
      }}
    >
      {children}
    </LeaderboardMobileTabBarContext.Provider>
  );
};

export default function useLeaderboardMobileTabBar(): LeaderboardMobileTabBarContext {
  return useContext(LeaderboardMobileTabBarContext);
}
