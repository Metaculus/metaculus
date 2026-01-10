"use client";

import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
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
        <div className="m-0 mx-3 max-w-[255px] truncate text-lg leading-7 md:absolute md:left-1/2 md:mx-0 md:max-w-[350px] md:-translate-x-1/2">
          {tournamentName}
        </div>
        <Button
          className="mr-2 hidden sm:block"
          onClick={() => {
            if (postsLeft === 0) {
              router.push(`/tournament/${tournamentSlug}`);
            } else {
              setIsModalOpen(true);
            }
          }}
        >
          {t("exitPredictionFlow")}
        </Button>
        <Button
          className="mr-2 border-none bg-transparent text-gray-0 dark:bg-transparent dark:text-gray-0 dark:hover:bg-blue-800 dark:active:bg-gray-800 sm:hidden"
          onClick={() => {
            if (postsLeft === 0) {
              router.push(`/tournament/${tournamentSlug}`);
            } else {
              setIsModalOpen(true);
            }
          }}
          variant="primary"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="h-5 w-5" />
        </Button>
      </header>
      <ExitFlowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tournamentSlug={tournamentSlug}
      />
    </>
  );
};

export default PredictionFlowHeader;
