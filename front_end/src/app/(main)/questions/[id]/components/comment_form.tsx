import { useTranslations } from "next-intl";
import React, { FC } from "react";

import Button from "@/components/ui/button";

type Props = {
  onCancel: () => void;
  cancelDisabled?: boolean;
  submitDisabled?: boolean;
  buttonsDisplayed?: boolean;
  onSubmit: () => void;
  children: React.ReactNode;
};

export const CommentForm: FC<Props> = ({
  children,
  onSubmit,
  onCancel,
  cancelDisabled,
  submitDisabled,
  buttonsDisplayed,
}) => {
  const t = useTranslations();
  return (
    <div className="mt-3 flex flex-col gap-5 rounded border border-blue-800 bg-gray-0 p-4 text-base leading-tight dark:border-blue-800-dark dark:bg-gray-0-dark md:p-6">
      {children}
      {buttonsDisplayed !== false && (
        <div className="flex w-full items-end gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={cancelDisabled === true}
            className="ml-auto"
          >
            {t("close")}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onSubmit}
            disabled={submitDisabled === true}
          >
            {t("submit")}
          </Button>
        </div>
      )}
    </div>
  );
};
