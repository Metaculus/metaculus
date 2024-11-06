import Link from "next/link";
import React from "react";

interface QuestionTypePickerProps {
  url: string;
  questionType: string;
  questionExample: string;
}

const QuestionTypePicker: React.FC<QuestionTypePickerProps> = ({
  url,
  questionType,
  questionExample,
}) => {
  return (
    <Link
      href={url}
      className="flex w-full flex-col gap-1 rounded-s border border-blue-400 p-3 no-underline hover:bg-blue-200 dark:border-blue-400-dark hover:dark:bg-blue-200-dark md:p-4"
    >
      <div className="text-lg font-medium capitalize text-blue-700 dark:text-blue-700-dark md:text-xl">
        {questionType}
      </div>
      <div className="text-sm font-light text-gray-700 dark:text-gray-700-dark md:text-lg">
        {`"${questionExample}"`}
      </div>
    </Link>
  );
};

export default QuestionTypePicker;
