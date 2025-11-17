"use client";

import { useTranslations } from "next-intl";
import { PropsWithChildren } from "react";

import Button from "@/components/ui/button";

import { useKeyFactorsCtx } from "../key_factors_context";

type Props = PropsWithChildren<{
  onSubmit: () => void;
  onCancel: () => void;
  disableSubmit?: boolean;
  submitLabel?: string;
}>;

const KeyFactorsAddInCommentWrapper: React.FC<Props> = ({
  onSubmit,
  onCancel,
  children,
  submitLabel,
  disableSubmit = false,
}) => {
  const { isPending } = useKeyFactorsCtx();
  const t = useTranslations();

  return (
    <div className="mt-[14px] flex flex-col gap-[14px] pb-1">
      {children}
      <div className="flex w-full items-end gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
          className="ml-auto border-blue-400 text-blue-700 dark:border-blue-400-dark dark:text-blue-700-dark"
        >
          {t("cancel")}
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onSubmit}
          disabled={isPending || disableSubmit}
        >
          {submitLabel || t("submit")}
        </Button>
      </div>
    </div>
  );
};

export default KeyFactorsAddInCommentWrapper;
