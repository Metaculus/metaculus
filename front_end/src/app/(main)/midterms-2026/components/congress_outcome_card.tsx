import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getTranslations } from "next-intl/server";

import { PostWithForecasts } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";

import { MIDTERMS_COLORS } from "../constants";
import { getForecastersCount } from "../helpers/post_utils";

type Outcome = {
  key: "RR" | "RD" | "DR" | "DD";
  pct: number | null;
  borderColor: string;
  bgColor: string;
};

const PLACEHOLDER_OUTCOMES: Record<Outcome["key"], number> = {
  RR: 6.2,
  RD: 61.5,
  DR: 0.1,
  DD: 32.3,
};

type Props = {
  post: PostWithForecasts | null;
};

export default async function CongressOutcomeCard({ post }: Props) {
  const t = await getTranslations();

  const outcomes: Outcome[] = [
    {
      key: "RR",
      pct: extractPct(post, "RR") ?? PLACEHOLDER_OUTCOMES.RR,
      borderColor: MIDTERMS_COLORS.repPrimary,
      bgColor: MIDTERMS_COLORS.repLight,
    },
    {
      key: "RD",
      pct: extractPct(post, "RD") ?? PLACEHOLDER_OUTCOMES.RD,
      borderColor: MIDTERMS_COLORS.repPrimary,
      bgColor: MIDTERMS_COLORS.repLight,
    },
    {
      key: "DR",
      pct: extractPct(post, "DR") ?? PLACEHOLDER_OUTCOMES.DR,
      borderColor: MIDTERMS_COLORS.demPrimary,
      bgColor: MIDTERMS_COLORS.demLight,
    },
    {
      key: "DD",
      pct: extractPct(post, "DD") ?? PLACEHOLDER_OUTCOMES.DD,
      borderColor: MIDTERMS_COLORS.demPrimary,
      bgColor: MIDTERMS_COLORS.demLight,
    },
  ];

  const forecasters = getForecastersCount(post);

  const labels: Record<Outcome["key"], string> = {
    RR: t("midtermsHubOutcomeRepRep"),
    RD: t("midtermsHubOutcomeRepDem"),
    DR: t("midtermsHubOutcomeDemRep"),
    DD: t("midtermsHubOutcomeDemDem"),
  };

  return (
    <div className="rounded-lg border border-gray-300 bg-gray-0 p-5 dark:border-gray-300-dark dark:bg-gray-0-dark">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="m-0 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500-dark">
          {t("midtermsHubCongressForecast")}
        </h3>
        {forecasters > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500-dark">
            <FontAwesomeIcon icon={faUsers} className="h-3 w-3" />
            {forecasters}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {outcomes.map((o) => (
          <div key={o.key} className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-xs text-gray-700 dark:text-gray-700-dark">
              {labels[o.key]}
            </span>
            <div className="flex-1">
              <div
                className="h-5 rounded-sm"
                style={{
                  width: `${Math.max(o.pct ?? 0, 1)}%`,
                  backgroundColor: o.bgColor,
                  borderLeft: `3px solid ${o.borderColor}`,
                }}
              />
            </div>
            <span className="w-12 shrink-0 text-right text-xs font-medium text-gray-800 dark:text-gray-800-dark">
              {o.pct?.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-gray-700 dark:text-gray-700-dark">
        {t("midtermsHubCongressSummary")}
      </p>
    </div>
  );
}

function extractPct(
  post: PostWithForecasts | null,
  outcomeKey: Outcome["key"]
): number | null {
  if (!post?.group_of_questions) return null;
  const questions = post.group_of_questions.questions as
    | QuestionWithNumericForecasts[]
    | undefined;
  if (!questions) return null;
  const question = questions.find((q) => q.label === outcomeKey);
  if (!question) return null;
  const center =
    question.aggregations[question.default_aggregation_method]?.latest
      ?.centers?.[0];
  if (center == null) return null;
  return Math.round(center * 1000) / 10;
}
