"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import useEmbedModalContext from "@/contexts/embed_modal_context";

const QuestionEmbedButton: FC = () => {
  const { updateIsOpen } = useEmbedModalContext();
  const t = useTranslations();

  return (
    <Button
      variant="secondary"
      onClick={() => updateIsOpen(true)}
      className="capitalize"
    >
      {t("embed")}
    </Button>
  );
};

export default QuestionEmbedButton;
