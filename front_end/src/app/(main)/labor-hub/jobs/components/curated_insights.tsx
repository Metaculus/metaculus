import {
  faArrowTrendDown,
  faArrowTrendUp,
  faMinus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getTranslations } from "next-intl/server";

import cn from "@/utils/core/cn";

import { type ResolvedInsight } from "../helpers/fetch_job_insights";

type Props = {
  insights: ResolvedInsight[];
  jobName: string;
};

function typeStyle(type: ResolvedInsight["type"]) {
  switch (type) {
    case "up":
      return {
        icon: faArrowTrendUp,
        color: "text-mc-option-3 dark:text-mc-option-3-dark",
        bg: "bg-mc-option-light-3 dark:bg-olive-300-dark",
      };
    case "down":
      return {
        icon: faArrowTrendDown,
        color: "text-mc-option-2 dark:text-mc-option-2-dark",
        bg: "bg-mc-option-light-2 dark:bg-salmon-100-dark",
      };
    case "neutral":
    default:
      return {
        icon: faMinus,
        color: "text-blue-700 dark:text-blue-700-dark",
        bg: "bg-blue-200 dark:bg-blue-200-dark",
      };
  }
}

export async function CuratedInsights({ insights, jobName }: Props) {
  const t = await getTranslations();

  return (
    <div className="flex h-full flex-col rounded-md border border-blue-300 bg-blue-100 p-4 dark:border-blue-300-dark dark:bg-blue-100-dark">
      <h3 className="m-0 text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-700-dark">
        {t("laborHubJobsCuratedInsightsTitle")}
      </h3>
      {insights.length === 0 ? (
        <p className="mt-3 text-sm text-blue-700 dark:text-blue-700-dark">
          {t("laborHubJobsCuratedInsightsEmpty", { name: jobName })}
        </p>
      ) : (
        <ul className="mt-3 max-h-80 list-none space-y-3 overflow-y-auto pr-1">
          {insights.map((insight, i) => {
            const style = typeStyle(insight.type);
            return (
              <li key={i} className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    style.bg,
                    style.color
                  )}
                  aria-hidden="true"
                >
                  <FontAwesomeIcon icon={style.icon} className="text-xs" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-sm leading-relaxed text-blue-800 dark:text-blue-800-dark">
                    {insight.body}
                  </p>
                  {insight.author && (
                    <p className="m-0 mt-1 text-xs text-blue-600 dark:text-blue-600-dark">
                      — <span className="font-medium">{insight.author}</span>
                      {insight.source === "keyword" && (
                        <span>
                          {" · "}
                          {t("laborHubJobsInsightSourceFromAnotherPost")}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
