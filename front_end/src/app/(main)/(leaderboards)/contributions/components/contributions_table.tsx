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

import { CategoryKey, Contribution } from "@/types/scoring";
import { abbreviatedNumber } from "@/utils/number_formatters";

type SortingColumn = "score" | "title";
type SortingDirection = "asc" | "desc";

type Props = {
  category: CategoryKey;
  contributions: Contribution[];
};

const ContributionsTable: FC<Props> = ({ category, contributions }) => {
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
              ? a.score - b.score
              : b.score - a.score;
          case "title":
            return sortingDirection === "asc"
              ? a.question_title.localeCompare(b.question_title)
              : b.question_title.localeCompare(a.question_title);
          default:
            return 0;
        }
      }),
    [contributions, sortingColumn, sortingDirection]
  );

  const totalScore = useMemo(
    () => contributions.reduce((acc, el) => acc + el.score, 0),
    [contributions]
  );

  const isQuestionCategory = ["peer", "baseline"].includes(category);
  const isNonQuestionCategory = ["comments", "questionWriting"].includes(
    category
  );

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
            {abbreviatedNumber(totalScore, 4, 0)}
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
              <SortArrow isDesc={sortingDirection === "asc"} />
            )}
          </HeaderTd>
          <HeaderTd
            className="w-full"
            onClick={() => handleSortChange("title")}
          >
            {category === "comments" ? t("comment") : t("question")}
            {sortingColumn === "title" && (
              <SortArrow isDesc={sortingDirection === "asc"} />
            )}
          </HeaderTd>
          {isQuestionCategory && (
            <HeaderTd className="w-40 max-sm:hidden">
              {t("questionType")}
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
                    contribution.score > 0,
                  "text-result-negative dark:text-result-negative-dark":
                    contribution.score < 0,
                }
              )}
            >
              {isNonQuestionCategory
                ? contribution.score
                : Number(contribution.score).toFixed(3)}
            </td>
            <td className="truncate px-4 py-1.5 text-sm font-medium leading-4">
              {["peer", "baseline", "questionWriting"].includes(category) && (
                <Link
                  className="no-underline"
                  href={`/questions/${contribution.question_id}`}
                >
                  {contribution.question_title}
                </Link>
              )}
              {/*TODO: change to actual comment contribution once BE support it*/}
              {category === "comments" && (
                <Link
                  className="no-underline"
                  href={`/questions/${contribution.question_id}`}
                >
                  {contribution.question_title}
                </Link>
              )}
            </td>
            {isQuestionCategory && (
              <td className="flex items-center gap-2 self-stretch px-4 py-1.5 text-sm font-medium leading-4 text-blue-700 dark:text-blue-700-dark max-sm:hidden">
                {/*TODO: show question type once BE support it*/}
                {/*<span className="w-4 text-sm leading-none text-blue-600 dark:text-blue-600-dark">*/}
                {/*  {questionTypeIcons[contribution.type]}*/}
                {/*</span>*/}
                {/*{questionTypeLabels[contribution.type]}*/}
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

const SortArrow: FC<{ isDesc: boolean }> = ({ isDesc }) => (
  <FontAwesomeIcon
    icon={faCaretDown}
    className={classNames("ml-2", {
      "rotate-180": isDesc,
    })}
  />
);

export default ContributionsTable;
