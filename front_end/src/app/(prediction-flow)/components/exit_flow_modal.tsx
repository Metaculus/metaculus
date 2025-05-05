"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC } from "react";

import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";

import { usePredictionFlow } from "./prediction_flow_provider";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tournamentSlug: string;
};

const ExitFlowModal: FC<Props> = ({ isOpen, onClose, tournamentSlug }) => {
  const t = useTranslations();
  const router = useRouter();
  const { postsLeft } = usePredictionFlow();

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      closeButtonClassName="right-4 top-4"
    >
      <div className="flex flex-col gap-4 text-left sm:w-[468px]">
        <h2 className="m-0 text-xl text-blue-900 dark:text-blue-900-dark">
          {t("exitPredictionFlow")}
        </h2>
        <p className="m-0 text-sm">
          {t.rich("thereAreQuestionsThatRequireAttention", {
            count: postsLeft,
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
        <p className="m-0 text-sm text-gray-700 dark:text-gray-700-dark">
          {t("youCanComeBackAnytime")}
        </p>
        <div className="mt-2 flex gap-2">
          <Button variant="secondary" className="w-full" onClick={onClose}>
            {t("keepPredicting")}
          </Button>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => {
              router.push(`/tournament/${tournamentSlug}`);
            }}
          >
            {t("exit")}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ExitFlowModal;
