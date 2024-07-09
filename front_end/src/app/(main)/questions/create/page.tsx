// page.tsx

import Link from "next/link";
import React from "react";

import { SearchParams } from "@/types/navigation";

import QuestionTypePicker from "../components/question_type_picker";

const Creator: React.FC<{ searchParams: SearchParams }> = ({
  searchParams,
}) => {
  const createHref = (
    path: string,
    extra_params: { [key: string]: string } = {}
  ) => {
    const params = new URLSearchParams(
      searchParams as { [key: string]: string }
    );
    Object.entries(extra_params).forEach(([key, value]) => {
      params.append(key, value);
    });
    return `${path}?${params.toString()}`;
  };

  return (
    <div className="mb-4 flex max-w-[840px] flex-col justify-center self-center rounded-md bg-white px-4 py-4 pb-5 dark:bg-blue-900 md:m-8 md:mx-auto md:px-8 md:pb-8 lg:m-12 lg:mx-auto">
      <div className="flex flex-col gap-2 md:gap-3">
        <h1 className="text-2xl font-medium md:text-3xl">Create New Content</h1>
        <span className="text-sm text-gray-600 dark:text-gray-300 md:text-base">
          Check out our <a href="/question-writing">question writing guide</a>{" "}
          for tips. Good questions are approved faster, and get more
          predictions.
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-300 md:text-base">
          We have high standards for question quality. We also favor questions
          on our core topic areas or that we otherwise judge valuable. We may
          not publish questions that are not a good fit.
        </span>
        <hr className="my-1.5 border-blue-400 dark:border-blue-700/50" />
      </div>
      <p className="text-lg font-light text-gray-700 dark:text-gray-300">
        Single Question
      </p>
      <div className="flex w-full flex-wrap gap-3 md:flex-row md:flex-nowrap md:gap-4">
        <div className="flex w-full flex-col gap-3 md:gap-4">
          <QuestionTypePicker
            url={createHref("/questions/create/question", { type: "binary" })}
            questionType="Binary Question"
            questionExample="Will it rain today?"
          />
          <QuestionTypePicker
            url={createHref("/questions/create/question", { type: "numeric" })}
            questionType="Numeric Range"
            questionExample="How much rain next month?"
          />
        </div>
        <div className="flex w-full flex-col gap-3 md:gap-4">
          <QuestionTypePicker
            url={createHref("/questions/create/question", { type: "date" })}
            questionType="Date Range"
            questionExample="When will it rain?"
          />
          <QuestionTypePicker
            url={createHref("/questions/create/question", {
              type: "multiple_choice",
            })}
            questionType="Multiple Choice"
            questionExample="Which city will get the most rain?"
          />
        </div>
      </div>

      <p className="text-lg  font-light text-gray-600 dark:text-gray-200">
        Question Group
      </p>
      <div className="flex w-full flex-wrap gap-3 md:flex-row md:flex-nowrap md:gap-4">
        <div className="flex w-full flex-col gap-3 md:gap-4">
          <QuestionTypePicker
            url={createHref("/questions/create/group", { subtype: "binary" })}
            questionType="Binary Group"
            questionExample="Will it rain in these cities today?"
          />
          <QuestionTypePicker
            url={createHref("/questions/create/group", { subtype: "numeric" })}
            questionType="Numeric Group"
            questionExample="How much will it rain for these cities?"
          />
        </div>
        <div className="flex w-full flex-col gap-3 md:gap-4">
          <QuestionTypePicker
            url={createHref("/questions/create/group", { subtype: "date" })}
            questionType="Date Group"
            questionExample="When will it rain for the following cities?"
          />
          <QuestionTypePicker
            url={createHref("/questions/create/conditional")}
            questionType="Conditional Pair"
            questionExample="If it rains today, will it rain tomorrow?"
          />
        </div>
      </div>

      <p className="text-lg  font-light text-gray-600 dark:text-gray-200">
        Posts
      </p>
      <div className="flex w-full flex-wrap md:flex-row md:flex-nowrap">
        <div className="w-full flex-row">
          <QuestionTypePicker
            url={createHref("/questions/create/notebook")}
            questionType="Notebook"
            questionExample="A text-based content that is not a question"
          />
        </div>
      </div>
    </div>
  );
};

export default Creator;
