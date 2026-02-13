"use client";

import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import {
  FlowHeaderActions,
  FlowHeaderBrand,
  FlowHeaderRoot,
  FlowHeaderTitle,
} from "@/components/flow/flow_header";
import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

import { useServicesQuizExitGuard } from "./quiz_state/services_quiz_exit_guard_provider";

const ServicesQuizHeader: FC = () => {
  const t = useTranslations();
  const { requestExit } = useServicesQuizExitGuard();

  return (
    <FlowHeaderRoot title={t("workWithMetaculus")}>
      <FlowHeaderBrand>
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
      </FlowHeaderBrand>

      <FlowHeaderTitle />

      <FlowHeaderActions>
        <Button className="mr-2 hidden sm:block" onClick={requestExit}>
          {t("exit")}
        </Button>

        <Button
          className="mr-2 border-none bg-transparent text-gray-0 dark:bg-transparent dark:text-gray-0 dark:hover:bg-blue-800 dark:active:bg-gray-800 sm:hidden"
          onClick={requestExit}
          variant="primary"
          aria-label={t("exit")}
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="h-5 w-5" />
        </Button>
      </FlowHeaderActions>
    </FlowHeaderRoot>
  );
};

export default ServicesQuizHeader;
