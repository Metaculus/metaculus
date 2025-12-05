import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import SectionToggle from "@/components/ui/section_toggle";
import { QuestionWithForecasts, ScoreData } from "@/types/question";
import { TranslationKey } from "@/types/translations";
import cn from "@/utils/core/cn";

type Variant = "auto" | "compact";
type Props = {
  question: QuestionWithForecasts;
  separateCoverage?: boolean;
  variant?: Variant;
};

const ScoreTable: FC<{
  rows: { label: string; value: string }[];
  className?: string;
  variant?: Variant;
}> = ({ rows, className, variant = "auto" }) => (
  <div
    className={cn(
      "overflow-hidden rounded border border-gray-300 bg-white dark:border-gray-300-dark dark:bg-gray-0-dark",
      className
    )}
  >
    {rows.map((row, index) => (
      <div
        key={index}
        className="flex items-center border-b border-gray-300 px-4 py-3 last:border-b-0 dark:border-gray-300-dark"
      >
        <span
          className={cn(
            "w-[66%] pr-4 text-sm text-gray-700 dark:text-gray-700-dark",
            {
              "sm:w-1/2": variant === "auto",
            }
          )}
        >
          {row.label}
        </span>
        <span
          className={cn(
            "w-[34%] pl-4 text-center text-base text-gray-800 dark:text-gray-800-dark",
            { "sm:w-1/2": variant === "auto" }
          )}
        >
          {row.value}
        </span>
      </div>
    ))}
  </div>
);

const getScore = (data: ScoreData | undefined, key: string) => {
  const field = (
    key.includes("coverage") ? key : `${key}_score`
  ) as keyof ScoreData;
  return data?.[field];
};

const mustHideCommunity = (key: string) =>
  key === "coverage" || key === "weighted_coverage";

const toCamel = (s: string) =>
  s.replace(/(^|_)(\w)/g, (_, __, c: string) => c.toUpperCase());

/** Builds translation key e.g. "myPeerScore", "communityBaselineScore"  */
const buildScoreLabelKey = (
  key: string,
  forecaster: "user" | "community"
): TranslationKey => {
  const prefix = forecaster === "user" ? "my" : "community";
  const suffix = key.includes("coverage") ? "" : "Score";

  return (prefix + toCamel(key) + suffix) as TranslationKey;
};

export const AdditionalScoresTable: FC<Props> = ({
  question,
  separateCoverage,
  variant,
}) => {
  const t = useTranslations();

  if (!question) return null;

  const cpScores =
    question.aggregations?.[question.default_aggregation_method]?.score_data;
  const userScores = question.my_forecasts?.score_data;

  if (!cpScores && !userScores) return null;

  const spot = question.default_score_type.startsWith("spot");
  const peerKey = spot ? "spot_peer" : "peer";
  const baselineKey = spot ? "spot_baseline" : "baseline";

  const scoreKeys = [
    "peer",
    "baseline",
    "spot_peer",
    "spot_baseline",
    "relative_legacy",
    "relative_legacy_archived",
    "coverage",
    "weighted_coverage",
  ];

  const coverageRows: { label: string; value: string }[] = [];
  const otherRows: { label: string; value: string }[] = [];

  for (const key of scoreKeys) {
    if (key === peerKey || key === baselineKey) continue;

    const isCoverage = key.includes("coverage");
    const targetRows = isCoverage ? coverageRows : otherRows;

    const userVal = getScore(userScores, key);
    if (!isNil(userVal)) {
      const digits = key.includes("relative_legacy") ? 2 : 1;
      const formattedValue = isCoverage
        ? `${(userVal * 100).toFixed(digits)}%`
        : userVal.toFixed(digits);

      targetRows.push({
        label: t(buildScoreLabelKey(key, "user")),
        value: formattedValue,
      });
    }

    if (!mustHideCommunity(key)) {
      const cpVal = getScore(cpScores, key);
      if (!isNil(cpVal)) {
        const digits = key.includes("relative_legacy") ? 2 : 1;
        const formattedValue = isCoverage
          ? `${(cpVal * 100).toFixed(digits)}%`
          : cpVal.toFixed(digits);

        targetRows.push({
          label: t(buildScoreLabelKey(key, "community")),
          value: formattedValue,
        });
      }
    }
  }

  if (coverageRows.length === 0 && otherRows.length === 0) return null;

  if (!separateCoverage) {
    return (
      <ScoreTable rows={[...coverageRows, ...otherRows]} variant={variant} />
    );
  }

  return (
    <>
      {coverageRows.length > 0 && (
        <ScoreTable rows={coverageRows} variant={variant} />
      )}
      {otherRows.length > 0 && (
        <ScoreTable rows={otherRows} variant={variant} />
      )}
    </>
  );
};

const AdditionalScoresTableSection: FC<Props> = ({ question }) => {
  const t = useTranslations();

  const table = <AdditionalScoresTable question={question} separateCoverage />;

  if (isNil(table)) return null;

  return (
    <SectionToggle title={t("additionalScores")} defaultOpen={false}>
      <div className="flex flex-col gap-4">{table}</div>
    </SectionToggle>
  );
};

export default AdditionalScoresTableSection;
