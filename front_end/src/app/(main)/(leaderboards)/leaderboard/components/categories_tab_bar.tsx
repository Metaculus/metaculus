"use client";
import { useTranslations } from "next-intl";
import { FC, useEffect } from "react";

import TabBar from "@/components/ui/tab_bar";
import { SearchParams } from "@/types/navigation";
import { CategoryKey } from "@/types/scoring";

import { RANKING_CATEGORIES } from "../../ranking_categories";
import useLeaderboardMobileTabBar from "../mobile_tab_bar_context";

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
      const fallbackCategory = categoryKeys[0];
      if (fallbackCategory) {
        updateActiveCategoryKey(fallbackCategory);
      }
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
