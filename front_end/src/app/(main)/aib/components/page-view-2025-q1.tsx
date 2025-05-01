"use client";

import { faArrowRight, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";

import { Dates, Prize } from "./cards-q1";
import HeroQ1 from "./hero-q1";
import BotLeaderboard from "./leaderboard-q1";

const AiBenchmarkingTournamentPage: FC<{ token: string | null }> = () => {
  const t = useTranslations();

  return (
    <div className="mx-auto h-auto w-full flex-auto items-stretch bg-gradient-to-tl from-blue-300/30 via-blue-100/30 to-blue-400/30 px-4 py-4 text-blue-700 dark:bg-blue-800 dark:from-blue-600/50 dark:via-blue-800/30 dark:to-blue-500/30 dark:text-blue-700-dark">
      <Link href="/aib/2024/q4" className="mb-3 flex w-full no-underline">
        <div className="flex flex w-full cursor-pointer flex-col items-center items-center justify-center justify-center gap-2 text-balance rounded-md bg-purple-200 p-3 text-center text-base text-purple-800 transition-colors hover:bg-purple-300 dark:bg-purple-200-dark dark:text-purple-800-dark dark:hover:bg-purple-300-dark md:flex-row md:gap-4 md:p-6 md:text-xl">
          <FontAwesomeIcon
            icon={faArrowLeft}
            className="text-lg md:text-lg min-[1920px]:text-xl"
          />{" "}
          Check out final rankings for Q4 - 2024
        </div>
      </Link>{" "}
      <div className="flex size-full flex-col items-center gap-3">
        <div className="flex w-full flex-col gap-3 md:flex-row">
          <div className="flex w-full flex-col gap-3 md:w-1/3">
            <HeroQ1 />
          </div>
          <div className="flex h-auto w-full flex-row gap-3 md:w-1/3 md:flex-col">
            <Prize />
            <Dates />
          </div>
          <div className="relative flex h-auto min-h-[8rem] w-full flex-row overflow-hidden rounded md:w-1/3 lg:h-auto">
            <Image
              src="https://metaculus-web-media.s3.amazonaws.com/2025-q1.webp"
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
          <BotLeaderboard />
          <Link href="/aib" className="group flex w-full no-underline">
            <div className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 text-balance rounded-md bg-gradient-to-r from-purple-500/35 to-purple-700/35 p-3 text-center text-lg text-purple-800 transition-colors dark:text-gray-1000-dark md:gap-4 md:p-6 md:text-2xl">
              <FontAwesomeIcon
                icon={faArrowRight}
                className="text-4xl opacity-20 transition-all group-hover:opacity-80 md:text-6xl xl:text-8xl"
              />{" "}
              2025&apos;s Q2 tournament is underway!
              <Button
                size="lg"
                variant="primary"
                className="mb-3 mt-2 bg-purple-800 opacity-45 transition-all group-hover:opacity-80 md:mb-0 lg:mt-4"
              >
                {t("FABQ3ConcludeButton")}
              </Button>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AiBenchmarkingTournamentPage;
