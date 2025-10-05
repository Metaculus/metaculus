import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FC, Fragment } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import InfoToggle from "@/components/ui/info_toggle";
import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";
import { LeaderboardType } from "@/types/scoring";

import ProjectLeaderboardClient from "./project_leaderboard_client";

type Props = {
  projectId: number;
  leaderboardType?: LeaderboardType;
  userId?: number;
  isQuestionSeries?: boolean;
};

const ProjectLeaderboard: FC<Props> = async ({
  projectId,
  leaderboardType,
  isQuestionSeries,
  userId,
}) => {
  const leaderboardDetails = await ServerLeaderboardApi.getProjectLeaderboard(
    projectId,
    leaderboardType
  );

  if (!leaderboardDetails || !leaderboardDetails.entries.length) {
    return null;
  }

  const t = await getTranslations();

  const leaderboardTitle = isQuestionSeries
    ? t("openLeaderboard")
    : t("leaderboard");

  const scoreType = leaderboardDetails.score_type;
  const isPeer = scoreType === "peer_tournament";
  const isSpotPeer = scoreType === "spot_peer_tournament";
  const showExplainer = isPeer || isSpotPeer;

  return (
    <Fragment>
      <ProjectLeaderboardClient
        leaderboardDetails={leaderboardDetails}
        leaderboardTitle={leaderboardTitle}
        isQuestionSeries={isQuestionSeries}
        userId={userId}
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
    </Fragment>
  );
};

export default WithServerComponentErrorBoundary(ProjectLeaderboard);
