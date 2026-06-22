import {
  faArrowTrendDown,
  faArrowTrendUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getTranslations } from "next-intl/server";

import cn from "@/utils/core/cn";

import { type ResolvedInsight } from "../helpers/fetch_job_insights";

type Props = {
  insights: ResolvedInsight[];
  jobName: string;
};

function directionStyle(type: ResolvedInsight["type"]) {
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
    default:
      return null;
  }
}

function InsightRow({
  insight,
  proTitle,
}: {
  insight: ResolvedInsight;
  proTitle: string;
}) {
  const dir = directionStyle(insight.type);
  return (
    <div className="flex items-start gap-3">
      {dir && (
        <span
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            dir.bg,
            dir.color
          )}
          aria-hidden="true"
        >
          <FontAwesomeIcon icon={dir.icon} className="text-xs" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="m-0 text-sm leading-relaxed text-blue-800 group-hover/insight:underline group-hover/insight:decoration-blue-700 group-hover/insight:underline-offset-2 dark:text-blue-800-dark dark:group-hover/insight:decoration-blue-700-dark">
          {insight.body}
        </p>
        {insight.author && (
          <p className="m-0 mt-1 text-xs text-blue-600 group-hover/insight:text-blue-900 dark:text-blue-600-dark dark:group-hover/insight:text-blue-900-dark">
            —{" "}
            <span className="font-medium">
              {[proTitle, insight.realName].filter(Boolean).join(" ")} (
              {insight.author})
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

export async function CuratedInsights({ insights, jobName }: Props) {
  const t = await getTranslations();
  const proTitle = t("laborHubJobsProForecasterTitle");

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
        <ul className="mt-3 list-none space-y-3">
          {insights.map((insight, i) => (
            <li key={i}>
              {insight.commentUrl ? (
                <a
                  href={insight.commentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/insight block rounded-sm no-underline transition-colors"
                  aria-label={`Open original comment by ${insight.author ?? ""} in a new tab`}
                >
                  <InsightRow insight={insight} proTitle={proTitle} />
                </a>
              ) : (
                <div className="group/insight">
                  <InsightRow insight={insight} proTitle={proTitle} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
