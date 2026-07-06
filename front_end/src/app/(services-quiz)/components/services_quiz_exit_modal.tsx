"use client";

import { useTranslations } from "next-intl";
import React, { FC } from "react";

import FlowExitConfirmModal from "@/components/flow/flow_exit_confirm_modal";

import { useServicesQuizExitGuard } from "./quiz_state/services_quiz_exit_guard_provider";

const ServicesQuizExitModal: FC = () => {
  const t = useTranslations();
  const { isExitModalOpen, closeExitModal, exitNow } =
    useServicesQuizExitGuard();

  return (
    <FlowExitConfirmModal
      isOpen={isExitModalOpen}
      onClose={closeExitModal}
      title={t("exit")}
      description={t("youHaveUnsavedProgress")}
      secondaryAction={{
        label: t("stay"),
        onClick: closeExitModal,
      }}
      primaryAction={{
        label: t("exit"),
        onClick: exitNow,
      }}
    />
  );
};

export default ServicesQuizExitModal;
