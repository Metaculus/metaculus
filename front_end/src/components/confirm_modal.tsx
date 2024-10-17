"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";

type Props = {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
  onConfirm: () => void;
};

const ConfirmModal: FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const t = useTranslations();

  return (
    <BaseModal
      className="max-w-xs !overflow-y-auto"
      isOpen={isOpen}
      onClose={onClose}
    >
      <h4 className="mb-4 mt-0 text-center">{t("confirmAction")}</h4>
      <div className="flex justify-center">
        <Button
          className="my-auto w-32"
          onClick={() => {
            onConfirm();
            onClose(isOpen);
          }}
        >
          {t("confirm")}
        </Button>
      </div>
    </BaseModal>
  );
};

export default ConfirmModal;
