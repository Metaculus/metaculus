import React, { FC } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import { SharePostMenu } from "@/components/post_actions";
import { PostWithForecasts, PostWithForecastsAndWeight } from "@/types/post";

import "./styles.css";
import IndexQuestions from "./index_questions";

type Props = {
  postData: PostWithForecasts;
  questionTitle: string;
  indexQuestions: PostWithForecastsAndWeight[];
};

const NotebookIndex: FC<Props> = ({
  postData,
  questionTitle,
  indexQuestions,
}) => {
  // calculate value using formula
  const indexValue = 45;
  return (
    <main className="mx-auto mb-24 mt-12 flex w-full max-w-3xl flex-1 flex-col bg-gray-0 text-base text-gray-800 dark:bg-gray-0-dark dark:text-gray-800-dark">
      <div className="flex items-center justify-between bg-blue-700 p-2 py-2.5">
        <p className="m-0 ml-3 text-xl font-light uppercase leading-7 text-gray-0">
          Project
        </p>
        <SharePostMenu
          questionTitle={questionTitle}
          btnClassName="!bg-transparent !text-gray-0 dark:!text-gray-0 mr-2"
        />
      </div>
      <div className="px-4 py-5">
        <h1 className="mb-4 mt-0 font-serif text-3xl leading-9 text-gray-800 dark:text-gray-800-dark">
          {postData.title}
        </h1>
        {postData.notebook && (
          <MarkdownEditor mode="read" markdown={postData.notebook.markdown} />
        )}
        <p className="text-3xl capitalize leading-9">
          Index value: <b>{indexValue}</b>
        </p>
      </div>
      <IndexQuestions indexQuestions={indexQuestions} />
    </main>
  );
};

export default NotebookIndex;
