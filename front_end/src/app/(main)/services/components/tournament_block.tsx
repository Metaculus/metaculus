"use client";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { TournamentPreview } from "@/types/projects";
import cn from "@/utils/core/cn";

import Button from "./button";
import EmblaCarousel from "./embla_carousel";
import TournamentCard from "./tournament_card";

type Props = {
  tournaments: TournamentPreview[];
  className?: string;
};

const TournamentBlock: FC<Props> = ({ tournaments, className }) => {
  const t = useTranslations();
  // Duplicate tournaments to allow for infinite scrolling
  const carouselTournaments =
    tournaments.length < 4 ? [...tournaments, ...tournaments] : tournaments;
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center rounded-2xl bg-blue-800 p-8 sm:p-14",
        className
      )}
    >
      <div className="flex flex-col items-center justify-center">
        <h3 className="m-0 text-2xl font-bold tracking-tight text-blue-200 sm:text-3xl">
          {t("runTournament")}
        </h3>
        <p className="m-0 mt-5 max-w-[560px] text-center text-sm font-normal text-blue-500 sm:text-lg sm:font-medium">
          {t("runTournamentDescription")}
        </p>
        <Button href="/services/tournaments" className="mt-8 uppercase">
          {t("learnMore")}
        </Button>
      </div>

      <div className="mt-10 w-full sm:mt-12">
        <EmblaCarousel className={tournaments.length <= 4 ? "xl:hidden" : ""}>
          <div className="-ml-6 flex">
            {carouselTournaments.map((tournament, index) => (
              <div
                key={index}
                className="flex-[0_0_100%] pl-6 xs:flex-[0_0_50%] md:flex-[0_0_33.33%] xl:flex-[0_0_25%]"
              >
                <TournamentCard tournament={tournament} className="h-full" />
              </div>
            ))}
          </div>
        </EmblaCarousel>
        {/* Desktop tournaments list */}
        <div
          className={cn("hidden gap-6 ", {
            "xl:flex": tournaments.length <= 4,
          })}
        >
          {tournaments.map((tournament) => (
            <div key={tournament.id} className="flex-1">
              <TournamentCard key={tournament.id} tournament={tournament} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TournamentBlock;
