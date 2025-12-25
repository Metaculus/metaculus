"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import React from "react";

import { TournamentPreview } from "@/types/projects";
import cn from "@/utils/core/cn";
import { getProjectLink } from "@/utils/navigation";

type Props = {
  item: TournamentPreview;
};

const QuestionSeriesCard: React.FC<Props> = ({ item }) => {
  const t = useTranslations();

  const href = getProjectLink(item);
  const questionsCount = item.questions_count ?? 0;

  return (
    <Link
      href={href}
      className={cn(
        "group block no-underline",
        "rounded-lg border border-blue-400 dark:border-blue-400-dark lg:rounded",
        "bg-gray-0/50 dark:bg-gray-0-dark/50",
        "shadow-sm transition-shadow hover:shadow-md",
        "overflow-hidden"
      )}
    >
      <div className="relative h-[64px] w-full overflow-hidden  bg-blue-100/40 p-3 pb-0 dark:bg-blue-100-dark/20 lg:h-[80px] lg:p-4">
        {item.header_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.header_image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full rounded object-cover"
          />
        ) : null}
      </div>

      <div className="px-3 pb-3 pt-3 lg:px-4 lg:pb-5">
        <p className="my-0 text-[10px] font-normal uppercase text-blue-600 dark:text-blue-600-dark">
          {t.rich("tournamentQuestionsCount", {
            count: questionsCount,
            num: (chunks) => (
              <span className="font-semibold text-blue-700 dark:text-blue-700-dark">
                {chunks}
              </span>
            ),
          })}
        </p>

        <h6 className="my-2 text-base font-semibold leading-[125%] text-blue-800 dark:text-blue-800-dark lg:text-lg lg:leading-[125%]">
          {item.name}
        </h6>
      </div>
    </Link>
  );
};

export default QuestionSeriesCard;
