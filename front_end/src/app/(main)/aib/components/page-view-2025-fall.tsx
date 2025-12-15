"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { DatesFall2025, PrizeFall2025 } from "./cards-2025-fall";
import HeroFall2025 from "./hero-2025-fall";
import FallBotLeaderboard2025 from "./leaderboard-2025-fall";
import NextTournamentCard from "./next-tournament-card";
import TournamentPager, { TOURNAMENT_ITEMS } from "./tournament-pager";

const AiBenchmarkingTournamentPage: FC<{ token: string | null }> = () => {
  const t = useTranslations();

  return (
    <div className="mx-auto h-auto w-full flex-auto items-stretch bg-gradient-to-tl from-blue-300/30 via-blue-100/30 to-blue-400/30 px-4 py-4 text-blue-700 dark:bg-blue-800 dark:from-blue-600/50 dark:via-blue-800/30 dark:to-blue-500/30 dark:text-blue-700-dark">
      <TournamentPager items={TOURNAMENT_ITEMS} />
      <div className="flex size-full flex-col items-center gap-3">
        <div className="flex w-full flex-col gap-3 md:flex-row">
          <div className="flex w-full flex-col gap-3 md:w-1/3">
            <HeroFall2025 />
          </div>
          <div className="flex h-auto w-full flex-row gap-3 md:w-1/3 md:flex-col">
            <PrizeFall2025 />
            <DatesFall2025 />
          </div>
          <div className="relative flex h-auto min-h-[8rem] w-full flex-row overflow-hidden rounded md:w-1/3 lg:h-auto">
            <Image
              src="https://cdn.metaculus.com/aib-q3.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="size-full object-cover object-center grayscale"
              quality={100}
            />
          </div>
        </div>
        <div className="flex size-full flex-col-reverse gap-3 md:flex-row">
          <FallBotLeaderboard2025 />
          <NextTournamentCard />
        </div>
      </div>
    </div>
  );
};

export default AiBenchmarkingTournamentPage;
