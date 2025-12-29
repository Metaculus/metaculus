"use client";

import { faList } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React from "react";

import { TournamentPreview } from "@/types/projects";

import TournamentCardShell from "./tournament_card_shell";

type Props = { item: TournamentPreview };

const QuestionSeriesCard: React.FC<Props> = ({ item }) => {
  const t = useTranslations();
  const questionsCount = item.questions_count ?? 0;

  return (
    <TournamentCardShell item={item}>
      <div className="relative h-16 w-full overflow-hidden  bg-blue-100/40 p-3 pb-0 dark:bg-blue-100-dark/20 lg:h-20 lg:p-4">
        {item.header_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.header_image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-blue-400 dark:bg-blue-400-dark">
            <FontAwesomeIcon
              icon={faList}
              className="text-[20px] text-blue-600/30 dark:text-blue-600-dark/30 lg:text-[24px]"
            />
          </div>
        )}
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
    </TournamentCardShell>
  );
};

export default QuestionSeriesCard;
