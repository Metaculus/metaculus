"use client";

import React, { FC, ReactNode } from "react";

import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  note?: ReactNode;
  secondaryAction: {
    label: ReactNode;
    onClick?: () => void;
  };
  primaryAction: {
    label: ReactNode;
    onClick: () => void;
  };
};

const FlowExitConfirmModal: FC<Props> = ({
  isOpen,
  onClose,
  title,
  description,
  note,
  secondaryAction,
  primaryAction,
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      closeButtonClassName="right-4 top-4"
    >
      <div className="flex flex-col gap-4 text-left sm:w-[468px]">
        <h2 className="m-0 text-xl text-blue-900 dark:text-blue-900-dark">
          {title}
        </h2>

        {description ? <div className="m-0 text-sm">{description}</div> : null}

        {note ? (
          <div className="m-0 text-sm text-gray-700 dark:text-gray-700-dark">
            {note}
          </div>
        ) : null}

        <div className="mt-2 flex gap-2">
          <Button
            variant="secondary"
            className="w-full"
            onClick={secondaryAction.onClick ?? onClose}
          >
            {secondaryAction.label}
          </Button>

          <Button
            variant="primary"
            className="w-full"
            onClick={primaryAction.onClick}
          >
            {primaryAction.label}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default FlowExitConfirmModal;
