"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

const CreateQuestionButton: FC<{ className?: string }> = ({ className }) => {
  const t = useTranslations();

  return (
    <div
      className={cn(
        "flex h-full items-center rounded-full bg-blue-700 px-2 py-1 capitalize",
        className
      )}
    >
      <FontAwesomeIcon size="xs" className="mr-1" icon={faPlus} />
      {t("create")}
    </div>
  );
};

export default CreateQuestionButton;
