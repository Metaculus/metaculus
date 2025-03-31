import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import InfoToggle from "@/components/ui/info_toggle";
import SectionToggle from "@/components/ui/section_toggle";
import LeaderboardApi from "@/services/leaderboard";
import { Project } from "@/types/projects";

type Props = {
  project: Project;
  userId: number;
};

const ProjectContributions: FC<Props> = async ({ project, userId }) => {
  const t = await getTranslations();
  const contributionsDetails = await LeaderboardApi.getContributions({
    type: "project",
    for_user: userId,
    project: project.id,
  });
  const hasQuestionWeights = contributionsDetails.contributions.some(
    (contribution) =>
      contribution.question_weight && contribution.question_weight !== 1.0
  );

  const leaderboard = contributionsDetails.leaderboard;

  if (
    contributionsDetails.contributions.every(
      (contribution) => !contribution.coverage
    )
  ) {
    return null;
  }

  return (
    <SectionToggle title={t("myScore")} variant="gold">
      <div className="rounded border border-gray-300 bg-blue-100 dark:border-gray-300-dark dark:bg-blue-100-dark">
        {!!contributionsDetails.contributions.length && (
          <table className="mb-3 w-full">
            <thead className="text-gray-500 dark:text-gray-500-dark">
              <tr className="border-b border-gray-300 dark:border-gray-300-dark">
                <th className="px-4 py-2.5 text-left text-sm font-bold">
                  {t("Question")}
                </th>
                <th className="px-4 py-2.5 text-right text-sm font-bold">
                  {t("score")}
                </th>
                {leaderboard.score_type === "relative_legacy_tournament" && (
                  <th className="px-4 py-2.5 text-right text-sm font-bold">
                    {t("coverage")}
                  </th>
                )}
                {hasQuestionWeights && (
                  <th className="px-4 py-2.5 text-right text-sm font-bold">
                    {t("questionWeight")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {contributionsDetails.contributions.map((contribution, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-300 bg-blue-200 even:bg-blue-100 dark:border-gray-300-dark dark:bg-blue-200-dark dark:even:bg-blue-100-dark"
                >
                  <td className="px-4 py-2.5 text-sm">
                    <Link
                      className="block no-underline"
                      href={`/questions/${contribution.post_id}`}
                    >
                      {contribution.question_title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-bold text-orange-800 dark:text-orange-800-dark">
                    {contribution.score ? contribution.score.toFixed(3) : "-"}
                  </td>
                  {leaderboard.score_type === "relative_legacy_tournament" && (
                    <th className="px-4 py-2.5 text-right text-sm font-bold">
                      {contribution.coverage
                        ? `${(contribution.coverage * 100).toFixed(0)}%`
                        : "0%"}
                    </th>
                  )}
                  {hasQuestionWeights && (
                    <th className="px-4 py-2.5 text-right text-sm font-bold">
                      {contribution.question_weight
                        ? `${contribution.question_weight.toFixed(1)}`
                        : "1.0"}
                    </th>
                  )}
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <th className="px-2 py-1 text-right text-sm">
                  {t("totalTake")}
                </th>
                <td className="px-2 py-1 text-right text-sm font-bold text-orange-800 dark:text-orange-800-dark">
                  {contributionsDetails.leaderboard_entry.take
                    ? `${contributionsDetails.leaderboard_entry.take.toFixed(3)}`
                    : "-"}
                </td>
              </tr>
            </tfoot>
            <tfoot>
              <tr>
                <th className="px-2 py-1 text-right text-sm">
                  {t("totalScore")}
                </th>
                <td className="px-2 py-1 text-right text-sm font-bold text-orange-800 dark:text-orange-800-dark">
                  {contributionsDetails.leaderboard_entry.score
                    ? `${contributionsDetails.leaderboard_entry.score.toFixed(2)}`
                    : "-"}
                </td>
                {leaderboard.score_type === "relative_legacy_tournament" && (
                  <th className="px-4 py-2.5 text-right text-sm font-bold">
                    {contributionsDetails.leaderboard_entry.coverage
                      ? `${(contributionsDetails.leaderboard_entry.coverage * 100).toFixed(2)}%`
                      : "0%"}
                  </th>
                )}
              </tr>
            </tfoot>
          </table>
        )}

        <InfoToggle title={t("scoringTerminology")}>
          {leaderboard.score_type === "manual" ? (
            <dd>{t("manualScoreInfo")}</dd>
          ) : (
            <div className="mt-2">
              <dl className="m-0">
                <div className="m-2 flex text-sm">
                  <dt className="mr-2 w-20 flex-none font-bold">
                    {t("score")}
                  </dt>
                  {leaderboard.score_type === "peer_tournament" ? (
                    <dd>
                      {t.rich("peerScoreInfo", {
                        link: (chunks) => (
                          <Link href={"/help/scores-faq/#peer-score"}>
                            {chunks}
                          </Link>
                        ),
                      })}
                    </dd>
                  ) : leaderboard.score_type === "spot_peer_tournament" ? (
                    <dd>
                      {t.rich("spotPeerScoreInfo", {
                        link: (chunks) => (
                          <Link href={"/help/scores-faq/#spot-score"}>
                            {chunks}
                          </Link>
                        ),
                      })}
                    </dd>
                  ) : (
                    <dd>
                      {t.rich("relativeScoreInfo", {
                        link: (chunks) => (
                          <Link href={"/help/scores-faq/#relative-score"}>
                            {chunks}
                          </Link>
                        ),
                      })}
                    </dd>
                  )}
                </div>
                <div className="m-2 flex text-sm">
                  <dt className="mr-2 w-20 flex-none font-bold">
                    {t("totalScore")}
                  </dt>
                  {leaderboard.score_type === "peer_tournament" ? (
                    <dd>
                      {t.rich("totalPeerScoreInfo", {
                        link: (chunks) => (
                          <Link href={"/help/scores-faq/#peer-score"}>
                            {chunks}
                          </Link>
                        ),
                      })}
                    </dd>
                  ) : leaderboard.score_type === "spot_peer_tournament" ? (
                    <dd>
                      {t.rich("totalSpotPeerScoreInfo", {
                        link: (chunks) => (
                          <Link href={"/help/scores-faq/#spot-score"}>
                            {chunks}
                          </Link>
                        ),
                      })}
                    </dd>
                  ) : (
                    <dd>
                      {t.rich("totalRelativeScoreInfo", {
                        link: (chunks) => (
                          <Link href={"/help/scores-faq/#relative-score"}>
                            {chunks}
                          </Link>
                        ),
                      })}
                    </dd>
                  )}
                </div>
                {leaderboard.score_type === "relative_legacy_tournament" && (
                  <div className="m-2 flex text-sm">
                    <dt className="mr-2 w-20 flex-none font-bold">
                      {t("coverage")}
                    </dt>
                    <dd>{t("relativeCoverageInfo")}</dd>
                  </div>
                )}
                {hasQuestionWeights && (
                  <div className="m-2 flex text-sm">
                    <dt className="mr-2 w-20 flex-none font-bold">
                      {t("questionWeight")}
                    </dt>
                    <dd>{t("questionWeightInfo")}</dd>
                  </div>
                )}
                <div className="m-2 flex text-sm">
                  <dt className="mr-2 w-20 flex-none font-bold">
                    {t("totalTake")}
                  </dt>
                  {leaderboard.score_type === "peer_tournament" ? (
                    <dd>{t("peerTakeInfo")}</dd>
                  ) : leaderboard.score_type === "spot_peer_tournament" ? (
                    <dd>{t("spotPeerTakeInfo")}</dd>
                  ) : (
                    <dd>{t("relativeTakeInfo")}</dd>
                  )}
                </div>
              </dl>
            </div>
          )}
        </InfoToggle>
      </div>
    </SectionToggle>
  );
};

export default WithServerComponentErrorBoundary(ProjectContributions);
