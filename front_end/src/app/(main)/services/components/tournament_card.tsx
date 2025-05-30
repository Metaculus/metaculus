"use client";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import tournamentPlaceholder from "@/app/assets/images/tournament.png";
import { Tournament } from "@/types/projects";
import cn from "@/utils/core/cn";
import { getProjectLink } from "@/utils/navigation";

type Props = {
  tournament: Tournament;
  className?: string;
};

const TournamentCard: FC<Props> = ({ tournament, className }) => {
  const t = useTranslations();
  const locale = useLocale();
  const {
    prize_pool: prizePool,
    header_image: headerImage,
    is_ongoing: isOngoing,
    questions_count: questionsCount,
  } = tournament;

  return (
    <Link
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md no-underline",
        className
      )}
      href={getProjectLink(tournament)}
    >
      <div className="relative h-[100px] w-full bg-cover bg-center">
        <Image
          src={tournamentPlaceholder}
          className="absolute size-full object-cover object-center"
          alt=""
          placeholder={"blur"}
          quality={100}
        />
        {!!headerImage && (
          <Image
            src={headerImage}
            alt=""
            fill
            className="size-full object-cover object-center"
            sizes="(max-width: 768px) 200vw, 100vw"
            quality={100}
          />
        )}
        {!!isOngoing && (
          <div className="z-2 absolute right-2.5 top-2.5 flex h-4 items-center gap-1 rounded-3xl bg-mc-option-2 px-1.5">
            <span className="h-1 w-1 rounded-full bg-gray-0"></span>
            <span className="text-xs font-medium uppercase text-gray-0">
              {t("live")}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between bg-gray-0 p-4">
        <p className="m-0 text-center text-lg font-bold text-blue-800">
          {tournament.name}
        </p>
        <div className="mt-4 flex flex-col items-center justify-center gap-0.5">
          <div className="flex w-full items-center justify-between rounded bg-olive-300 px-2.5 py-2">
            <span className="text-xs font-medium uppercase text-olive-800">
              {t("prizePool")}
            </span>
            <span className="text-sm font-medium text-olive-900">
              ${Number(prizePool).toLocaleString(locale)}
            </span>
          </div>

          <div className="flex w-full items-center justify-between rounded bg-blue-200 px-2.5 py-2">
            <span className="text-xs font-medium uppercase text-blue-700">
              {t("questions")}
            </span>
            <span className="text-sm font-medium text-blue-800">
              {questionsCount}
            </span>
          </div>

          <div className="flex w-full items-center justify-between rounded bg-blue-200 px-2.5 py-2">
            <span className="text-xs font-medium uppercase text-blue-700">
              {t("predictions")}
            </span>
            <span className="text-sm font-medium text-blue-800">
              {/* TODO: adjust with predictions count */}
              {questionsCount + Math.round(questionsCount * Math.random())}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TournamentCard;
