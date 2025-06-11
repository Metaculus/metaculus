"use client";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { Tournament } from "@/types/projects";
import cn from "@/utils/core/cn";

import Button from "./button";
import TournamentCarousel from "./tournament_carousel";

type Props = {
  tournaments: Tournament[];
  className?: string;
};

const TournamentBlock: FC<Props> = ({ tournaments, className }) => {
  const t = useTranslations();

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center rounded-2xl bg-blue-800 p-8",
        className
      )}
    >
      <div className="flex flex-col items-center justify-center">
        <h3 className="m-0 text-2xl font-bold tracking-tight text-blue-200 sm:text-3xl">
          {t("runTournament")}
        </h3>
        <p className="m-0 mt-5 text-center text-sm font-normal text-blue-500 sm:text-sm sm:font-medium">
          {t("runTournamentDescription")}
        </p>
        <Button href="/services/tournaments" className="mt-8 uppercase">
          {t("learnMore")}
        </Button>
      </div>

      <TournamentCarousel
        tournaments={tournaments}
        className="mt-10 sm:mt-12"
      />
    </div>
  );
};

export default TournamentBlock;
