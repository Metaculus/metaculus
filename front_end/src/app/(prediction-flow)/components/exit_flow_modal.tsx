"use client";

import { isNil } from "lodash";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import FlowExitConfirmModal from "@/components/flow/flow_exit_confirm_modal";

import { usePredictionFlow } from "./prediction_flow_provider";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tournamentSlug: string;
};

const ExitFlowModal: FC<Props> = ({ isOpen, onClose, tournamentSlug }) => {
  const t = useTranslations();
  const router = useRouter();
  const { postsLeft, flowType } = usePredictionFlow();

  return (
    <FlowExitConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("exitPredictionFlow")}
      description={t.rich(
        isNil(flowType)
          ? "thereAreQuestionsYouHaveNotPredicted"
          : "thereAreQuestionsThatRequireAttention",
        {
          count: postsLeft,
          bold: (chunks) => <strong>{chunks}</strong>,
        }
      )}
      note={t("youCanComeBackAnytime")}
      secondaryAction={{ label: t("keepPredicting") }}
      primaryAction={{
        label: t("exit"),
        onClick: () => router.push(`/tournament/${tournamentSlug}`),
      }}
    />
  );
};

export default ExitFlowModal;
