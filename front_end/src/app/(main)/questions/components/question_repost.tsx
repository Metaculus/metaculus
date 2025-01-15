import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React from "react";

interface QuestionTypePickerProps {
  url: string;
}

const QuestionRepost: React.FC<QuestionTypePickerProps> = ({ url }) => {
  const t = useTranslations();

  return (
    <div className="mb-8 mt-5">
      <Link
        href={url}
        className="bg-border-dashed-1 dark:bg-border-dashed-1-dark flex w-full flex-row items-center gap-3.5 rounded-s bg-blue-200 p-4 text-blue-800 no-underline dark:bg-blue-200-dark dark:text-blue-800-dark"
      >
        <FontAwesomeIcon icon={faPlus} width={14} />
        <div className="text-xl">{t("existingQuestionExample")}</div>
      </Link>
    </div>
  );
};

export default QuestionRepost;
