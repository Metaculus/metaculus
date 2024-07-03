import Link from "next/link";
import React from "react";

import { SearchParams } from "@/types/navigation";

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
    <div className="m-12 flex max-w-[840px] flex-col justify-center bg-white p-4 dark:bg-blue-900">
      <p className="ml-4 text-3xl">Create New Content</p>
      <p className="ml-4">
        Check out our <a href="/question-writing">question writing guide</a> for
        tips. Good questions are approved faster, and get more predictions.
      </p>
      <p className="ml-4">
        We have high standards for question quality. We also favor questions on
        our core topic areas or that we otherwise judge valuable. We may not
        publish questions that are not a good fit.
      </p>
      <p className="text-l m-0 ml-4 mt-4 font-light text-gray-600 dark:text-gray-200">
        Questions
      </p>
      <div className="flex w-full flex-wrap md:flex-row md:flex-nowrap">
        <div className="w-full flex-row">
          <Link
            href={createHref("/questions/create/question", { type: "binary" })}
            className="no-underline"
          >
            <div className="w-100 m-4 rounded-s border p-4 hover:bg-blue-500">
              <p className="m-0 p-0 text-xl">Binary Question</p>
              <p className="text-m m-0 mt-2 p-0 font-light text-gray-600 dark:text-gray-200">
                “Will it rain today?”
              </p>
            </div>
          </Link>
          <Link
            href={createHref("/questions/create/question", { type: "numeric" })}
            className="no-underline"
          >
            <div className="w-100 m-4 rounded-s border p-4 hover:bg-blue-500">
              <p className="m-0 p-0 text-xl">Numeric Range</p>
              <p className="text-m m-0 mt-2 p-0 font-light text-gray-600 dark:text-gray-200">
                “How much rain next month?”
              </p>
            </div>
          </Link>
        </div>
        <div className="w-full flex-row">
          <Link
            href={createHref("/questions/create/question", { type: "date" })}
            className="no-underline"
          >
            <div className="w-100 m-4 rounded-s border p-4 hover:bg-blue-500">
              <p className="m-0 p-0 text-xl">Date Range</p>
              <p className="text-m m-0 mt-2 p-0 font-light text-gray-600 dark:text-gray-200">
                “When will it rain?”
              </p>
            </div>
          </Link>
          <Link
            href={createHref("/questions/create/question", {
              type: "multiple_choice",
            })}
            className="no-underline"
          >
            <div className="w-100 m-4 rounded-s border p-4 hover:bg-blue-500">
              <p className="m-0 p-0 text-xl">Multiple Choice</p>
              <p className="text-m m-0 mt-2 p-0 font-light text-gray-600 dark:text-gray-200">
                “Which city will get the most rain?”
              </p>
            </div>
          </Link>
        </div>
      </div>

      <p className="text-l m-0 ml-4 mt-4 font-light text-gray-600 dark:text-gray-200">
        Question Group
      </p>
      <div className="flex w-full flex-wrap md:flex-row md:flex-nowrap">
        <div className="w-full flex-row">
          <Link
            href={createHref("/questions/create/group", { subtype: "binary" })}
            className="no-underline"
          >
            <div className="w-100 m-4 rounded-s border p-4 hover:bg-blue-500">
              <p className="m-0 p-0 text-xl">Binary Group</p>
              <p className="text-m m-0 mt-2 p-0 font-light text-gray-600 dark:text-gray-200">
                “Will it rain in these cities today?”
              </p>
            </div>
          </Link>
          <Link
            href={createHref("/questions/create/group", { subtype: "numeric" })}
            className="no-underline"
          >
            <div className="w-100 m-4 rounded-s border p-4 hover:bg-blue-500">
              <p className="m-0 p-0 text-xl">Numeric Group</p>
              <p className="text-m m-0 mt-2 p-0 font-light text-gray-600 dark:text-gray-200">
                “How much will it rain for these cities?”
              </p>
            </div>
          </Link>
        </div>
        <div className="w-full flex-row">
          <Link
            href={createHref("/questions/create/group", { subtype: "date" })}
            className="no-underline"
          >
            <div className="w-100 m-4 rounded-s border p-4 hover:bg-blue-500">
              <p className="m-0 p-0 text-xl">Date Group</p>
              <p className="text-m m-0 mt-2 p-0 font-light text-gray-600 dark:text-gray-200">
                “When will it rain for the following cities?”
              </p>
            </div>
          </Link>
          <Link
            href={createHref("/questions/create/conditional")}
            className="no-underline"
          >
            <div className="w-100 m-4 rounded-s border p-4 hover:bg-blue-500">
              <p className="m-0 p-0 text-xl">Conditional Pair</p>
              <p className="text-m m-0 mt-2 p-0 font-light text-gray-600 dark:text-gray-200">
                “If it rains today, will it rain tomorrow?”
              </p>
            </div>
          </Link>
        </div>
      </div>

      <p className="text-l m-0 ml-4 mt-4 font-light text-gray-600 dark:text-gray-200">
        Posts
      </p>
      <div className="flex w-full flex-wrap md:flex-row md:flex-nowrap">
        <div className="w-full flex-row">
          <Link
            href={createHref("/questions/create/notebook")}
            className="no-underline"
          >
            <div className="w-100 m-4 rounded-s border p-4 hover:bg-blue-500">
              <p className="m-0 p-0 text-xl">Notebook</p>
              <p className="text-m m-0 mt-2 p-0 font-light text-gray-600 dark:text-gray-200">
                A text-based content that is not a question
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Creator;
