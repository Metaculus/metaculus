// question_type_picker.tsx

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
    <Link href={url} className="no-underline">
      <div className="flex h-full w-full flex-col gap-1 rounded-s border border-blue-400 p-3 hover:bg-blue-300 dark:border-blue-700 hover:dark:bg-blue-700 md:p-4">
        <div className="text-lg font-medium text-blue-700 dark:text-blue-300 md:text-xl">
          {questionType}
        </div>
        <div className="text-sm font-light text-gray-600 dark:text-gray-400 md:text-lg">
          {`"${questionExample}"`}
        </div>
      </div>
    </Link>
  );
};

export default QuestionTypePicker;
