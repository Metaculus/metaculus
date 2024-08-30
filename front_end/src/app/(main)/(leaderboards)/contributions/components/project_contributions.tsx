import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FC } from "react";

import InfoToggle from "@/components/ui/info_toggle";
import SectionToggle from "@/components/ui/section_toggle";
import LeaderboardApi from "@/services/leaderboard";
import { Tournament } from "@/types/projects";
import ServerComponentErrorBoundary from "@/components/server_component_error_boundary";

type Props = {
  project: Tournament;
  userId: number;
};

const ProjectContributions: FC<Props> = async ({ project, userId }) => {
  return ServerComponentErrorBoundary(async () => {
    const t = await getTranslations();
    const contributionsDetails = await LeaderboardApi.getContributions({
      type: "project",
      userId,
      projectId: project.id,
    });

    return (
      <SectionToggle
        title={t("myScore")}
        className="bg-gold-200 dark:bg-gold-200-dark"
      >
        {!!contributionsDetails.contributions.length && (
          <table className="mb-3 w-full">
            <thead>
              <tr className="border-b border-gray-400 dark:border-gray-400-dark">
                <th className="p-2 text-left text-sm font-bold">
                  {t("Question")}
                </th>
                <th className="p-2 text-right text-sm font-bold">
                  {t("score")}
                </th>
                {project.score_type === "relative_legacy_tournament" && (
                  <th className="p-2 text-right text-sm font-bold">
                    {t("coverage")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {contributionsDetails.contributions.map((contribution, i) => (
                <tr
                  key={i}
                  className="even:bg-gray-200 dark:even:bg-gray-200-dark"
                >
                  <td className="px-2 py-1 text-sm">
                    <Link
                      className="block no-underline"
                      href={`/questions/${contribution.question_id}`}
                    >
                      {contribution.question_title}
                    </Link>
                  </td>
                  <td className="px-2 py-1 text-right text-sm font-bold text-orange-800 dark:text-orange-800-dark">
                    {contribution.score ? contribution.score.toFixed(2) : "-"}
                  </td>
                  {project.score_type === "relative_legacy_tournament" && (
                    <th className="p-2 text-right text-sm font-bold">
                      {contribution.coverage
                        ? `${(contribution.coverage * 100).toFixed(0)}%`
                        : "0%"}
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
                {project.score_type === "relative_legacy_tournament" && (
                  <th className="p-2 text-right text-sm font-bold">
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
          <div className="mt-2">
            <dl className="m-0">
              <div className="m-2 flex text-sm">
                <dt className="mr-2 w-20 flex-none font-bold">{t("score")}</dt>
                {project.score_type === "peer_tournament" ? (
                  <dd>
                    {t.rich("peerScoreInfo", {
                      link: (chunks) => (
                        <Link href={"/help/scores-faq/#peer-score"}>
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
                {project.score_type === "peer_tournament" ? (
                  <dd>
                    {t.rich("totalPeerScoreInfo", {
                      link: (chunks) => (
                        <Link href={"/help/scores-faq/#peer-score"}>
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
              {project.score_type === "relative_legacy_tournament" && (
                <div className="m-2 flex text-sm">
                  <dt className="mr-2 w-20 flex-none font-bold">
                    {t("coverage")}
                  </dt>
                  <dd>{t("relativeCoverageInfo")}</dd>
                </div>
              )}
              <div className="m-2 flex text-sm">
                <dt className="mr-2 w-20 flex-none font-bold">
                  {t("totalTake")}
                </dt>
                {project.score_type === "peer_tournament" ? (
                  <dd>{t("peerTakeInfo")}</dd>
                ) : (
                  <dd>{t("relativeTakeInfo")}</dd>
                )}
              </div>
            </dl>
          </div>
        </InfoToggle>
      </SectionToggle>
    );
  });
};

export default ProjectContributions;
