"use client";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";

const NextTournamentCard: FC = () => {
  const t = useTranslations();

  return (
    <Link href="/aib/2026/spring" className="group flex w-full no-underline">
      <div className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 text-balance rounded-md bg-gradient-to-r from-purple-500/35 to-purple-700/35 p-3 text-center text-lg text-purple-800 transition-colors dark:text-gray-1000-dark md:gap-4 md:p-6 md:text-2xl">
        <FontAwesomeIcon
          icon={faArrowRight}
          className="text-4xl opacity-20 transition-all group-hover:opacity-80 md:text-6xl xl:text-8xl"
        />{" "}
        {t("FABTournamentUnderway")}
        <Button
          size="lg"
          variant="primary"
          className="mb-3 mt-2 bg-purple-800 opacity-45 transition-all group-hover:opacity-80 md:mb-0 lg:mt-4"
        >
          {t("FABQ3ConcludeButton")}
        </Button>
      </div>
    </Link>
  );
};

export default NextTournamentCard;

