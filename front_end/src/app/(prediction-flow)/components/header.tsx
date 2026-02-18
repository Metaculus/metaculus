"use client";

import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import {
  FlowHeaderActions,
  FlowHeaderBrand,
  FlowHeaderRoot,
  FlowHeaderTitle,
} from "@/components/flow/flow_header";
import { useExitGuard } from "@/components/flow/use_exit_guard";
import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

import ExitFlowModal from "./exit_flow_modal";
import { usePredictionFlow } from "./prediction_flow_provider";

type Props = {
  tournamentSlug: string;
  tournamentName: string;
};

const PredictionFlowHeader: FC<Props> = ({
  tournamentName,
  tournamentSlug,
}) => {
  const router = useRouter();
  const t = useTranslations();
  const { postsLeft } = usePredictionFlow();

  const { isExitModalOpen, requestExit, closeExitModal } = useExitGuard({
    canExitImmediately: postsLeft === 0,
    onExit: () => router.push(`/tournament/${tournamentSlug}`),
  });

  return (
    <>
      <FlowHeaderRoot title={tournamentName}>
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
            {t("exitPredictionFlow")}
          </Button>

          <Button
            className="mr-2 border-none bg-transparent text-gray-0 dark:bg-transparent dark:text-gray-0 dark:hover:bg-blue-800 dark:active:bg-gray-800 sm:hidden"
            onClick={requestExit}
            variant="primary"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="h-5 w-5" />
          </Button>
        </FlowHeaderActions>
      </FlowHeaderRoot>

      <ExitFlowModal
        isOpen={isExitModalOpen}
        onClose={closeExitModal}
        tournamentSlug={tournamentSlug}
      />
    </>
  );
};

export default PredictionFlowHeader;
