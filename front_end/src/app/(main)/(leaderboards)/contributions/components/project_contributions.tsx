import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FC } from "react";

import InfoToggle from "@/components/ui/info_toggle";
import SectionToggle from "@/components/ui/section_toggle";
import LeaderboardApi from "@/services/leaderboard";

type Props = {
  projectId: number;
  userId: number;
};

const ProjectContributions: FC<Props> = async ({ projectId, userId }) => {
  const t = await getTranslations();
  const contributionsDetails = await LeaderboardApi.getContributions({
    type: "project",
    userId,
    projectId,
  });

  const totalScore = contributionsDetails.contributions
    .reduce((acc, contribution) => acc + (contribution.score ?? 0), 0)
    .toFixed(2);

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
              <th className="p-2 text-right text-sm font-bold">{t("score")}</th>
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
                  {contribution.score?.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <th className="px-2 py-1 text-right text-sm">
                {t("totalScore")}
              </th>
              <td className="px-2 py-1 text-right text-sm font-bold text-orange-800 dark:text-orange-800-dark">
                {totalScore}
              </td>
            </tr>
          </tfoot>
        </table>
      )}

      <InfoToggle title={t("scoringTerminology")}>
        <div className="mt-2">
          <dl className="m-0">
            <div className="m-2 flex text-sm">
              <dt className="mr-2 w-20 flex-none font-bold">{t("score")}</dt>
              <dd>
                {t.rich("pearScoreInfo", {
                  link: (chunks) => (
                    <Link href={"/help/scores-faq/#peer-score"}>{chunks}</Link>
                  ),
                })}
              </dd>
            </div>
            <div className="m-2 flex text-sm">
              <dt className="mr-2 w-20 flex-none font-bold">{t("total")}</dt>
              <dd>
                {t.rich("totalPeerScoreInfo", {
                  link: (chunks) => (
                    <Link href={"/help/scores-faq/#peer-score"}>{chunks}</Link>
                  ),
                })}
              </dd>
            </div>
          </dl>
        </div>
      </InfoToggle>
    </SectionToggle>
  );
};

export default ProjectContributions;
