"use client";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import { RANKING_CATEGORIES } from "@/app/(main)/leaderboard/constants/ranking_categories";
import TabBar from "@/components/ui/tab_bar/tab_bar";
import { CategoryKey } from "@/types/scoring";

type Props = {
  categoryKeys: CategoryKey[];
};

const MobileGlobalLeaderboard: FC<Props> = ({ categoryKeys }) => {
  const t = useTranslations();
  const [activeCategoryKey, setActiveCategoryKey] =
    useState<CategoryKey>("baseline");

  return (
    <>
      <TabBar
        value={activeCategoryKey}
        onChange={setActiveCategoryKey}
        options={categoryKeys.map((categoryKey) => ({
          label: t(RANKING_CATEGORIES[categoryKey].shortTranslationKey),
          value: categoryKey,
        }))}
      />
    </>
  );
};

export default MobileGlobalLeaderboard;
