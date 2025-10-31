"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import InfoToggle from "@/components/ui/info_toggle";
import SectionToggle from "@/components/ui/section_toggle";
import Switch from "@/components/ui/switch";
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

  const [isAdvanced, setIsAdvanced] = useState(false);

  const advancedToggleElement = (
    <div className="ml-auto flex items-center gap-2">
      <span className="text-sm">{t("advanced")}</span>
      <Switch
        as="div"
        checked={isAdvanced}
        onChange={() => {
          setIsAdvanced((prev) => !prev);
        }}
      />
    </div>
  );

  const scoreType = leaderboardDetails.score_type;
  const isPeer = scoreType === "peer_tournament";
  const isSpotPeer = scoreType === "spot_peer_tournament";
  const showExplainer = isPeer || isSpotPeer;

  return (
    <SectionToggle
      title={leaderboardTitle}
      variant={isQuestionSeries ? "primary" : "gold"}
      detailElement={(isOpen) => {
        if (!isOpen) return null;
        return advancedToggleElement;
      }}
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
      {showExplainer && (
        <div className="rounded border border-gray-300 bg-blue-100 dark:border-gray-300-dark dark:bg-blue-100-dark">
          <InfoToggle title={t("scoringTerminology")}>
            <div className="mt-2">
              <dl className="m-0">
                <div className="m-2 flex text-sm">
                  <dt className="mr-2 w-28 flex-none font-bold">
                    {t("score")}
                  </dt>
                  <dd>
                    {t.rich(isPeer ? "peerScoreInfo" : "spotPeerScoreInfo", {
                      link: (chunks) => (
                        <Link
                          href={
                            isPeer
                              ? "/help/scores-faq/#peer-score"
                              : "/help/scores-faq/#spot-score"
                          }
                        >
                          {chunks}
                        </Link>
                      ),
                    })}
                  </dd>
                </div>
              </dl>
            </div>
          </InfoToggle>
        </div>
      )}
    </SectionToggle>
  );
};

export default ProjectLeaderboardClient;
