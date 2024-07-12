"use client";
import { useTranslations } from "next-intl";
import { FC, useEffect } from "react";

import { RANKING_CATEGORIES } from "@/app/(main)/leaderboard/constants/ranking_categories";
import useLeaderboardMobileTabBar from "@/app/(main)/leaderboard/mobile_tab_bar_context";
import TabBar from "@/components/ui/tab_bar/tab_bar";
import { SearchParams } from "@/types/navigation";
import { CategoryKey } from "@/types/scoring";

type Props = {
  categoryKeys: CategoryKey[];
  searchParams: SearchParams;
  startTime: string;
  endTime: string;
  year: string;
  duration: string;
};

const LeaderboardCategoriesTabBar: FC<Props> = ({ categoryKeys }) => {
  const t = useTranslations();
  const { activeCategoryKey, updateActiveCategoryKey } =
    useLeaderboardMobileTabBar();

  // ensure that the active category is always a valid category
  // e.g. when we switch the duration filter and categories list changes
  useEffect(() => {
    const activeCategoryIsMissing = !categoryKeys.includes(activeCategoryKey);
    if (activeCategoryIsMissing) {
      updateActiveCategoryKey(categoryKeys[0]);
    }
  }, [activeCategoryKey, categoryKeys, updateActiveCategoryKey]);

  return (
    <>
      <TabBar
        value={activeCategoryKey}
        onChange={updateActiveCategoryKey}
        options={categoryKeys.map((categoryKey) => ({
          label: t(RANKING_CATEGORIES[categoryKey].shortTranslationKey),
          value: categoryKey,
        }))}
      />
    </>
  );
};

export default LeaderboardCategoriesTabBar;
