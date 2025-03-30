"use client";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  DetailedHTMLProps,
  FC,
  TdHTMLAttributes,
  useMemo,
  useState,
} from "react";

import MarkdownEditor from "@/components/markdown_editor";
import useContainerSize from "@/hooks/use_container_size";
import { QuestionType } from "@/types/question";
import {
  CategoryKey,
  Contribution,
  LeaderboardEntry,
  LeaderboardType,
} from "@/types/scoring";
import cn from "@/utils/cn";
import { abbreviatedNumber } from "@/utils/number_formatters";
import {
  getMarkdownSummary,
  isUnsuccessfullyResolved,
} from "@/utils/questions";

type SortingColumn = "score" | "coverage" | "title" | "type";
type SortingDirection = "asc" | "desc";

type Props = {
  category: CategoryKey;
  leaderboardType: LeaderboardType;
  leaderboardEntry: LeaderboardEntry;
  contributions: Contribution[];
};

const ContributionsTable: FC<Props> = ({
  category,
  leaderboardType,
  leaderboardEntry,
  contributions,
}) => {
  const t = useTranslations();
  const { ref, width } = useContainerSize<HTMLTableCellElement>();
  const [sortingColumn, setSortingColumn] = useState<SortingColumn>("score");
  const [sortingDirection, setSortingDirection] =
    useState<SortingDirection>("desc");
  const handleSortChange = (column: SortingColumn) => {
    if (sortingColumn === column) {
      setSortingDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortingColumn(column);
      if (["score", "coverage"].includes(column)) {
        setSortingDirection("desc");
      } else {
        setSortingDirection("asc");
      }
    }
  };

  const sortedContributions = useMemo(
    () =>
      [...contributions].sort((a, b) => {
        switch (sortingColumn) {
          case "score":
            const aScore = a.score ?? 0;
            const bScore = b.score ?? 0;

            return sortingDirection === "asc"
              ? aScore - bScore
              : bScore - aScore;
          case "title":
            const aTitle = a.question_title ?? "";
            const bTitle = b.question_title ?? "";

            return sortingDirection === "asc"
              ? aTitle.localeCompare(bTitle)
              : bTitle.localeCompare(aTitle);
          case "type":
            const aType = a.question_type ?? "";
            const bType = b.question_type ?? "";

            return sortingDirection === "asc"
              ? aType.localeCompare(bType)
              : bType.localeCompare(aType);
          case "coverage":
            const aCoverage = a.coverage ?? 0;
            const bCoverage = b.coverage ?? 0;

            return sortingDirection === "asc"
              ? aCoverage - bCoverage
              : bCoverage - aCoverage;
          default:
            return 0;
        }
      }),
    [contributions, sortingColumn, sortingDirection]
  );

  const totalScore = leaderboardEntry.score ?? 0;

  const isQuestionCategory = ["peer", "baseline"].includes(category);
  const isNonQuestionCategory = ["comments", "questionWriting"].includes(
    category
  );

  const getScoreLabel = (contribution: Contribution) => {
    if (isNonQuestionCategory) {
      return contribution.score;
    }

    return getIsResolved(contribution) && !!contribution.score
      ? Number(contribution.score).toFixed(3)
      : "-";
  };

  const getQuestionTypeLabel = (type: QuestionType | undefined) => {
    switch (type) {
      case QuestionType.Binary:
        return t("binary");
      case QuestionType.Numeric:
      case QuestionType.Date:
      case QuestionType.Discrete:
        return t("continuous");
      case QuestionType.MultipleChoice:
        return t("multipleChoice");
      default:
        return type;
    }
  };

  return (
    <table className="table w-[640px] table-fixed rounded sm:w-full sm:border sm:border-gray-300 sm:dark:border-gray-300-dark">
      <thead>
        <tr className="bg-gray-0 text-gray-800 dark:bg-gray-0-dark dark:text-gray-800-dark">
          <InfoHeaderTd
            className={cn(
              "text-center font-mono",
              { "w-28": category === "questionWriting" },
              { "w-24": category === "comments" },
              { "w-20": isQuestionCategory }
            )}
          >
            {abbreviatedNumber(totalScore, 4, false)}
          </InfoHeaderTd>
          {leaderboardType === "peer_global" && (
            <InfoHeaderTd className="w-24 font-medium leading-4 " />
          )}
          <InfoHeaderTd className="w-full font-medium">
            <div ref={ref}>
              {category === "baseline" && t("totalScore")}
              {category === "peer" && t("weightedAverageScore")}
              {isNonQuestionCategory && t("hIndex")}
            </div>
          </InfoHeaderTd>
          {isQuestionCategory && (
            <InfoHeaderTd className="w-40 font-medium leading-4 " />
          )}
        </tr>
        <tr className="border-y border-blue-400 bg-blue-100 text-gray-500 dark:border-blue-400-dark dark:bg-blue-100-dark dark:text-gray-500-dark">
          <HeaderTd
            className="flex items-center justify-center "
            onClick={() => handleSortChange("score")}
          >
            {isQuestionCategory && t("score")}
            {category === "comments" && t("upvotes")}
            {category === "questionWriting" && t("forecasters")}
            {sortingColumn === "score" && (
              <SortArrow isAsc={sortingDirection === "asc"} />
            )}
          </HeaderTd>
          {leaderboardType === "peer_global" && (
            <HeaderTd
              className="w-20"
              onClick={() => handleSortChange("coverage")}
            >
              {t("coverage")}
              {sortingColumn === "coverage" && (
                <SortArrow isAsc={sortingDirection === "asc"} />
              )}
            </HeaderTd>
          )}
          <HeaderTd
            className="w-full"
            onClick={() => handleSortChange("title")}
          >
            {category === "comments" ? t("comment") : t("question")}
            {sortingColumn === "title" && (
              <SortArrow isAsc={sortingDirection === "asc"} />
            )}
          </HeaderTd>
          {isQuestionCategory && (
            <HeaderTd
              className="w-40 "
              onClick={() => handleSortChange("type")}
            >
              {t("questionType")}
              {sortingColumn === "type" && (
                <SortArrow isAsc={sortingDirection === "asc"} />
              )}
            </HeaderTd>
          )}
        </tr>
      </thead>
      <tbody>
        {sortedContributions.map((contribution, index) => (
          <tr
            key={`contribution-row-${contribution.question_id}-${index}`}
            className="border-b border-gray-300 bg-gray-0 text-gray-800 dark:border-gray-300-dark dark:bg-gray-0-dark dark:text-gray-800-dark"
          >
            <td
              className={cn(
                "flex items-center justify-center px-0 py-1.5 font-mono text-sm font-medium leading-4",
                {
                  "dark:text-conditionals-green-700-dark text-conditional-green-700":
                    (getIsResolved(contribution) || category === "comments") &&
                    (contribution.score ?? 0) > 0,
                  "text-result-negative dark:text-result-negative-dark":
                    getIsResolved(contribution) &&
                    (contribution.score ?? 0) < 0,
                }
              )}
            >
              {getScoreLabel(contribution)}
            </td>
            {leaderboardType === "peer_global" && (
              <td className="w-20 py-1.5 text-sm font-medium leading-4">
                {!!contribution.coverage
                  ? (contribution.coverage * 100).toFixed(1) + "%"
                  : "0%"}
              </td>
            )}
            <td className="truncate px-4 py-1.5 text-sm font-medium leading-4">
              {["peer", "baseline"].includes(category) && (
                <Link
                  className="no-underline"
                  href={`/questions/${contribution?.post_id}`}
                >
                  {contribution?.question_title}
                </Link>
              )}
              {category === "questionWriting" && (
                <Link
                  className="no-underline"
                  href={`/questions/${contribution.post_id}`}
                >
                  {contribution.post_title}
                </Link>
              )}
              {category === "comments" && (
                <Link
                  className="block max-h-[15px] truncate no-underline"
                  href={`/questions/${contribution.post_id}/#comment-${contribution.comment_id}`}
                >
                  <MarkdownEditor
                    mode="read"
                    markdown={getMarkdownSummary({
                      markdown: contribution.comment_text ?? "",
                      width,
                      height: 30,
                      charWidth: 6,
                      withLinks: false,
                    })}
                    contentEditableClassName="font-serif !text-gray-700 !dark:text-gray-700-dark *:m-0 !line-clamp-1"
                  />
                </Link>
              )}
            </td>
            {isQuestionCategory && (
              <td className="flex items-center gap-2 self-stretch px-4 py-1.5 text-sm font-medium leading-4 text-blue-700 dark:text-blue-700-dark ">
                {getQuestionTypeLabel(contribution.question_type)}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const InfoHeaderTd: FC<
  DetailedHTMLProps<
    TdHTMLAttributes<HTMLTableCellElement>,
    HTMLTableCellElement
  >
> = ({ className, children, ...props }) => (
  <td className={cn("px-4 py-1.5 text-sm leading-4", className)} {...props}>
    {children}
  </td>
);

const HeaderTd: FC<
  DetailedHTMLProps<
    TdHTMLAttributes<HTMLTableCellElement>,
    HTMLTableCellElement
  >
> = ({ className, children, ...props }) => (
  <td
    className={cn("cursor-pointer py-4 text-sm font-bold leading-4", className)}
    {...props}
  >
    {children}
  </td>
);

const SortArrow: FC<{ isAsc: boolean }> = ({ isAsc }) => (
  <FontAwesomeIcon
    icon={faCaretDown}
    className={cn("ml-2", {
      "rotate-180": isAsc,
    })}
  />
);

const getIsResolved = (contribution: Contribution) =>
  !!contribution.question_resolution &&
  !isUnsuccessfullyResolved(contribution.question_resolution);

export default ContributionsTable;
