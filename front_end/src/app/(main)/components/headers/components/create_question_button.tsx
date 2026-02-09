"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

const CreateQuestionButton: FC = () => {
  const t = useTranslations();

  return (
    <div className="flex h-full items-center rounded-full bg-blue-700 px-2 py-1 capitalize">
      <FontAwesomeIcon size="xs" className="mr-1" icon={faPlus} />
      {t("create")}
    </div>
  );
};

export default CreateQuestionButton;
