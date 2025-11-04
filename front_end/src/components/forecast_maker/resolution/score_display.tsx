import {
  faUsersLine,
  faArrowsUpToLine,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import SectionToggle, { SectionVariant } from "@/components/ui/section_toggle";
import { QuestionWithForecasts, ScoreData } from "@/types/question";
import cn from "@/utils/core/cn";
type Props = {
  question: QuestionWithForecasts;
  className?: string;
  variant?: SectionVariant;
};

type ScoreBoxProps = {
  label: string;
  value: number;
  icon?: typeof faUsersLine;
  color: "orange" | "olive" | "gray";
  digits?: number;
};

const ScoreBox: FC<ScoreBoxProps> = ({
  label,
  value,
  icon,
  color,
  digits = 1,
}) => {
  const iconColorClass =
    color === "orange"
      ? "text-orange-700 dark:text-orange-700-dark"
      : color === "olive"
        ? "text-olive-700 dark:text-olive-700-dark"
        : "text-gray-700 dark:text-gray-700-dark";

  return (
    <div
      className={
        "box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark"
      }
    >
      {icon && (
        <FontAwesomeIcon
          icon={icon}
          className={cn("text-base leading-none", iconColorClass)}
        />
      )}
      <span className="text-sm font-normal">{label}</span>
      <div className={`text-sm font-bold leading-6 ${iconColorClass}`}>
        {label.toLowerCase().includes("coverage")
          ? (value * 100).toFixed(digits) + "%"
          : value.toFixed(digits)}
      </div>
    </div>
  );
};

const ScoreDisplay: FC<Props> = ({ question, className, variant }) => {
  const t = useTranslations();
  const cp_scores =
    question.aggregations[question.default_aggregation_method].score_data;
  const user_scores = question.my_forecasts?.score_data;
  if (!cp_scores && !user_scores) return null;

  type KeyedScoreBox = {
    key: string;
    scoreBox: React.ReactNode | null;
  };

  function getScoreBox(
    key: string,
    forecaster: "user" | "community"
  ): KeyedScoreBox {
    const toCamelCase = (s: string): string =>
      s.replace(/(^|_)(\w)/g, (_, __, c: string) => c.toUpperCase());
    const sourceKey = (key +
      (key.includes("coverage") ? "" : "_score")) as keyof ScoreData;
    const value = (forecaster === "user" ? user_scores : cp_scores)?.[
      sourceKey
    ];
    const labelKey =
      (forecaster === "user" ? "my" : "community") +
      toCamelCase(key) +
      (key.includes("coverage") ? "" : "Score");
    // @ts-expect-error: ignore type error for dynamic translation key
    const label = t(labelKey);
    const icon = key.includes("peer")
      ? faUsersLine
      : key.includes("baseline")
        ? faArrowsUpToLine
        : undefined;

    return {
      key,
      scoreBox: isNil(value) ? null : (
        <ScoreBox
          key={labelKey}
          label={label}
          value={value}
          icon={icon}
          color={forecaster === "user" ? "orange" : "olive"}
          digits={key.includes("relative_legacy") ? 2 : 1}
        />
      ),
    };
  }
  const keyedScoreBoxes: KeyedScoreBox[] = [
    getScoreBox("peer", "user"),
    getScoreBox("baseline", "user"),
    getScoreBox("spot_peer", "user"),
    getScoreBox("spot_baseline", "user"),
    getScoreBox("relative_legacy", "user"),
    getScoreBox("relative_legacy_archived", "user"),
    getScoreBox("coverage", "user"),
    getScoreBox("weighted_coverage", "user"),
    getScoreBox("peer", "community"),
    getScoreBox("baseline", "community"),
    getScoreBox("spot_peer", "community"),
    getScoreBox("spot_baseline", "community"),
    getScoreBox("relative_legacy", "community"),
    getScoreBox("relative_legacy_archived", "community"),
  ];
  const primaryScoreBoxes = [];
  const secondaryScoreBoxes = [];
  const spotScores = question.default_score_type.startsWith("spot");
  for (const { key, scoreBox } of keyedScoreBoxes) {
    if (
      (spotScores && (key === "spot_baseline" || key === "spot_peer")) ||
      (!spotScores && (key === "baseline" || key === "peer"))
    ) {
      primaryScoreBoxes.push(scoreBox);
    } else {
      secondaryScoreBoxes.push(scoreBox);
    }
  }
  return (
    <>
      {primaryScoreBoxes.length > 0 && (
        <div
          className={cn(
            "mb-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4",
            className
          )}
        >
          {primaryScoreBoxes}
        </div>
      )}
      {secondaryScoreBoxes.length > 0 && question.resolution && (
        <SectionToggle
          title="Additional Scores"
          defaultOpen={false}
          variant={variant}
        >
          <div className="my-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {secondaryScoreBoxes}
          </div>
          <div className="mb-4 flex flex-col gap-3 text-base font-normal leading-5 opacity-90">
            <div>
              Learn more about scores{" "}
              <Link
                href="/help/scores-faq/"
                className="text-blue-700 hover:text-blue-800 dark:text-blue-700-dark dark:hover:text-blue-800-dark"
              >
                here
              </Link>
              .
            </div>
          </div>
        </SectionToggle>
      )}
    </>
  );
};

export default ScoreDisplay;
