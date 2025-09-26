"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";
import { getPostTitle } from "@/utils/questions/helpers";

type Props = {
  question: PostWithForecasts;
};
const QuestionLink: FC<Props> = ({ question }) => {
  const t = useTranslations();
  const questionTitle = getPostTitle(question);

  if (!question.conditional) {
    return null;
  }

  const { question_yes, question_no } = question.conditional;
  const ifTrumpWinProbability =
    Math.round(
      (question_yes.aggregations[question_yes.default_aggregation_method].latest
        ?.centers?.[0] ?? 0) * 1000
    ) / 10;
  const ifHarrisWinProbability =
    Math.round(
      (question_no.aggregations[question_no.default_aggregation_method].latest
        ?.centers?.[0] ?? 0) * 1000
    ) / 10;
  const moreLikely =
    Math.round(Math.abs(ifTrumpWinProbability - ifHarrisWinProbability) * 10) /
    10;
  const isHarris = ifHarrisWinProbability > ifTrumpWinProbability;

  return (
    <>
      <hr className="my-0 border-blue-400 dark:border-blue-400-dark" />
      <Link
        href={`/questions/${question.id}/${question.slug}`}
        className="flex flex-col items-center gap-4 px-4 py-5 no-underline hover:bg-blue-100 dark:hover:bg-blue-100-dark sm:flex-row sm:gap-2"
      >
        <div className="flex grow flex-col items-start justify-center gap-1.5 text-sm font-medium leading-4">
          <div className="text-gray-1000 dark:text-gray-1000-dark">
            {questionTitle}
          </div>
          <div className="hidden text-gray-500 dark:text-gray-500-dark sm:block">
            <span
              className={cn("text-center", {
                "text-[#0252A5] dark:text-[#A7C3DC]": isHarris,
                "text-[#E0152B] dark:text-[#E7858F]": !isHarris,
              })}
            >
              {moreLikely} {t("moreLikely")}
            </span>{" "}
            {t("afterElection", { winner: isHarris ? "Harris" : "Trump" })}
          </div>
        </div>

        <div className="grid w-64 flex-none grid-cols-2 items-center justify-center gap-2 text-sm font-medium leading-4 text-gray-1000 dark:text-gray-1000-dark">
          <div className="flex flex-col items-center justify-center gap-1 border border-[#ff9891] bg-[#ffccc6] px-3 py-2 text-center dark:border-[#DC172B80] dark:bg-[#1c1a1e]">
            {ifTrumpWinProbability}%
            <span className="text-xs text-[#E0152B] dark:text-[#F1727F] sm:hidden">
              {t("ifCandidateElected", { candidate: "Trump" })}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center gap-1 border border-[#1881EE80] bg-[#93c7ff] px-3 py-2 text-center dark:bg-[#15232f]">
            {ifHarrisWinProbability}%
            <span className="text-xs text-[#0252A5] dark:text-[#7AA0C7] sm:hidden">
              {t("ifCandidateElected", { candidate: "Harris" })}
            </span>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-500-dark sm:hidden">
          <span className="text-center text-gray-1000 dark:text-gray-1000-dark">
            {moreLikely} {t("moreLikely")}
          </span>{" "}
          {t("afterElection", { winner: isHarris ? "Harris" : "Trump" })}
        </div>
      </Link>
    </>
  );
};

export default QuestionLink;
