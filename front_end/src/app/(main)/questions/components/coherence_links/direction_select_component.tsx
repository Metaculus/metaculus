import { Select } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { DIRECTION_OPTIONS } from "@/types/coherence";
import { QuestionType } from "@/types/question";
import { getTermByDirectionAndQuestionType } from "@/utils/coherence";

export const DirectionSelect: FC<{
  value: number;
  onChange: (number: number) => void;
  typeOfSecondQuestion: QuestionType | null;
  t: ReturnType<typeof useTranslations>;
}> = ({ value, onChange, typeOfSecondQuestion, t }) => {
  if (!typeOfSecondQuestion) return null;
  return (
    <Select
      value={value}
      onChange={(event) => onChange(parseInt(event.target.value))}
      className="rounded-md border border-gray-300 bg-gray-50 py-1.5 pl-2.5 pr-4 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-400"
    >
      {DIRECTION_OPTIONS.map((option) => (
        <option
          key={option}
          value={option}
          className="bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
        >
          {t(getTermByDirectionAndQuestionType(option, typeOfSecondQuestion))}
        </option>
      ))}
    </Select>
  );
};
