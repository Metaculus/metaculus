"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import SectionToggle from "@/components/ui/section_toggle";
import { LeaderboardDetails } from "@/types/scoring";

import ProjectLeaderboardTable from "./project_leaderboard_table";

type Props = {
  leaderboardDetails: LeaderboardDetails;
  leaderboardTitle: string;
  isQuestionSeries?: boolean;
  userId?: number;
};

const ProjectLeaderboardClient = ({
  leaderboardDetails,
  leaderboardTitle,
  isQuestionSeries,
  userId,
}: Props) => {
  const t = useTranslations();

  const hasAdvancedView =
    leaderboardDetails.score_type === "relative_legacy_tournament" ||
    !!leaderboardDetails.prize_pool;
  const [isAdvanced, setIsAdvanced] = useState(false);

  return (
    <SectionToggle
      title={leaderboardTitle}
      variant={isQuestionSeries ? "primary" : "gold"}
      isAdvanced={hasAdvancedView ? isAdvanced : undefined}
      onAdvancedToggle={() => setIsAdvanced((prev) => !prev)}
    >
      {!!leaderboardDetails.prize_pool && (
        <div className="border-b border-gray-300 bg-mint-300 py-2 text-center font-medium text-mint-700 dark:border-gray-300-dark dark:bg-mint-800 dark:text-mint-300">
          {t("prizePool") + ": "}
          <span className="font-bold text-mint-800 dark:text-mint-200">
            ${leaderboardDetails.prize_pool.toLocaleString()}
          </span>
        </div>
      )}
      <ProjectLeaderboardTable
        leaderboardDetails={leaderboardDetails}
        userId={userId}
        isAdvanced={isAdvanced}
      />
    </SectionToggle>
  );
};

export default ProjectLeaderboardClient;
