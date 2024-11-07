"use client";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
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
import { QuestionType } from "@/types/question";
import { CategoryKey, Contribution, LeaderboardEntry } from "@/types/scoring";
import { abbreviatedNumber } from "@/utils/number_formatters";
import { isUnsuccessfullyResolved } from "@/utils/questions";

type SortingColumn = "score" | "title" | "type";
type SortingDirection = "asc" | "desc";

type Props = {
  category: CategoryKey;
  leaderboardEntry: LeaderboardEntry;
  contributions: Contribution[];
};

const ContributionsTable: FC<Props> = ({
  category,
  leaderboardEntry,
  contributions,
}) => {
  const t = useTranslations();

  const [sortingColumn, setSortingColumn] = useState<SortingColumn>("score");
  const [sortingDirection, setSortingDirection] =
    useState<SortingDirection>("desc");
  const handleSortChange = (column: SortingColumn) => {
    if (sortingColumn === column) {
      setSortingDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortingColumn(column);
      setSortingDirection("asc");
    }
  };

  const sortedContributions = useMemo(
    () =>
      [...contributions].sort((a, b) => {
        switch (sortingColumn) {
          case "score":
            return sortingDirection === "asc"
              ? (a.score ?? 0) - (b.score ?? 0)
              : (b.score ?? 0) - (a.score ?? 0);
          case "title":
            return sortingDirection === "asc"
              ? a.question_title!.localeCompare(b.question_title!)
              : b.question_title!.localeCompare(a.question_title!);
          case "type":
            return sortingDirection === "asc"
              ? a.question_type!.localeCompare(b.question_type!)
              : b.question_type!.localeCompare(a.question_type!);
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

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case QuestionType.Binary:
        return t("binary");
      case QuestionType.Numeric:
      case QuestionType.Date:
        return t("continuous");
      case QuestionType.MultipleChoice:
        return t("multipleChoice");
      default:
        return type;
    }
  };

  return (
    <table className="table w-full table-fixed rounded border border-gray-300 dark:border-gray-300-dark">
      <thead>
        <tr className="bg-gray-0 text-gray-800 dark:bg-gray-0-dark dark:text-gray-800-dark">
          <InfoHeaderTd
            className={classNames(
              "text-center font-mono",
              { "w-28": category === "questionWriting" },
              { "w-24": category === "comments" },
              { "w-20": isQuestionCategory }
            )}
          >
            {abbreviatedNumber(totalScore, 4, false)}
          </InfoHeaderTd>
          <InfoHeaderTd className="w-full font-medium">
            {category === "baseline" && t("totalScore")}
            {category === "peer" && t("weightedAverageScore")}
            {isNonQuestionCategory && t("hIndex")}
          </InfoHeaderTd>
          {isQuestionCategory && (
            <InfoHeaderTd className="w-40 font-medium leading-4 max-sm:hidden" />
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
              className="w-40 max-sm:hidden"
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
              className={classNames(
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
            <td className="truncate px-4 py-1.5 text-sm font-medium leading-4">
              {["peer", "baseline"].includes(category) && (
                <Link
                  className="no-underline"
                  href={`/questions/${contribution.question_id!}`}
                >
                  {contribution.question_title!}
                </Link>
              )}
              {category === "questionWriting" && (
                <Link
                  className="no-underline"
                  /* TODO: change to actual comment url once BE support it */
                  href={`/questions/${contribution.post_id!}`}
                >
                  {contribution.post_title!}
                </Link>
              )}
              {category === "comments" && (
                <Link
                  className="block max-h-[15px] truncate no-underline"
                  /* TODO: change to actual comment url once BE support it */
                  href={`/questions/${contribution.post_id!}/#comment-${contribution.comment_id}`}
                >
                  <MarkdownEditor
                    mode="read"
                    markdown={getCommentSummary(
                      contribution.comment_text as string
                    )}
                    contentEditableClassName="font-serif !text-gray-700 !dark:text-gray-700-dark *:m-0"
                  />
                </Link>
              )}
            </td>
            {isQuestionCategory && (
              <td className="flex items-center gap-2 self-stretch px-4 py-1.5 text-sm font-medium leading-4 text-blue-700 dark:text-blue-700-dark max-sm:hidden">
                {getQuestionTypeLabel(contribution.question_type!)}
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
  <td
    className={classNames("px-4 py-1.5 text-sm leading-4", className)}
    {...props}
  >
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
    className={classNames(
      "cursor-pointer py-4 text-sm font-bold leading-4",
      className
    )}
    {...props}
  >
    {children}
  </td>
);

const SortArrow: FC<{ isAsc: boolean }> = ({ isAsc }) => (
  <FontAwesomeIcon
    icon={faCaretDown}
    className={classNames("ml-2", {
      "rotate-180": isAsc,
    })}
  />
);

const getIsResolved = (contribution: Contribution) =>
  !!contribution.question_resolution &&
  !isUnsuccessfullyResolved(contribution.question_resolution);

const getCommentSummary = (markdown: string) => {
  if ([">", "*"].includes(markdown[0])) {
    markdown = markdown.slice(1);
  }
  markdown = markdown.replace(/\<.*?\>/g, "");
  const normalized = markdown.split("\n").join(" ");
  return normalized;
};

export default ContributionsTable;
