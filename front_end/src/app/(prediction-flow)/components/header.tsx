"use client";

import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

type Props = {
  tournamentSlug: string;
  tournamentName: string;
};

const PredictionFlowHeader: FC<Props> = ({
  tournamentName,
  tournamentSlug,
}) => {
  const t = useTranslations();
  return (
    <header className="fixed left-0 top-0 z-50 flex h-12 w-full flex-auto flex-nowrap items-center justify-between bg-blue-900 text-gray-0">
      <div className="flex h-full items-center">
        <Link
          href="/"
          className={cn(
            "inline-flex h-full max-w-60 flex-shrink-0 flex-grow-0 basis-auto flex-col justify-center text-center no-underline lg:bg-blue-800 lg:dark:bg-gray-0-dark"
          )}
        >
          <h1 className="mx-3 my-0 font-league-gothic text-[28px] font-light tracking-widest !text-gray-0 antialiased">
            <span className="inline">M</span>
          </h1>
        </Link>
      </div>
      <p className="m-0 mx-3 max-w-[255px] truncate text-lg leading-7">
        {tournamentName}
      </p>
      <Button
        className="mr-2 hidden sm:block"
        href={`/tournament/${tournamentSlug}`}
      >
        {t("exitPredictionFlow")}
      </Button>
      <Button
        className="mr-2 border-none bg-transparent text-gray-0 dark:text-gray-0-dark sm:hidden"
        href={`/tournament/${tournamentSlug}`}
        variant="primary"
      >
        <FontAwesomeIcon icon={faRightFromBracket} className="h-5 w-5" />
      </Button>
    </header>
  );
};

export default PredictionFlowHeader;
