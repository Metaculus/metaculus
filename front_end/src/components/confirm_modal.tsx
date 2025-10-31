"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

type Props = {
  isOpen: boolean;
  onCloseModal: (isOpen: boolean) => void;
  title: string;
  description?: string;
  onConfirm: () => void;
  onClose?: () => void;
  actionText?: string;
};

const ConfirmModal: FC<Props> = ({
  isOpen,
  onCloseModal,
  title,
  description,
  onConfirm,
  onClose,
  actionText,
}) => {
  const t = useTranslations();
  if (!actionText) {
    actionText = t("confirm");
  }

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    onCloseModal(isOpen);
  };

  const handleConfirm = () => {
    onConfirm();
    onCloseModal(isOpen);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      className="w-full max-w-xl"
      closeButtonClassName="hidden"
    >
      <div className="flex flex-col gap-6">
        <div className="flex w-full items-center justify-between">
          <h2 className="m-0 text-2xl text-blue-900 dark:text-blue-900-dark">
            {title}
          </h2>
          <button
            onClick={() => handleClose()}
            className={cn(
              "text-2xl text-blue-800 no-underline opacity-50 hover:text-blue-900 active:text-blue-700 disabled:text-blue-800 disabled:opacity-30 dark:text-blue-800-dark dark:hover:text-blue-900-dark dark:active:text-blue-700-dark dark:disabled:text-blue-800-dark"
            )}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        {description && (
          <p className="m-0 text-base text-gray-700 dark:text-gray-700-dark">
            {description}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button
            variant="tertiary"
            className="capitalize"
            onClick={handleClose}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            className="capitalize"
            onClick={handleConfirm}
          >
            {actionText}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ConfirmModal;
