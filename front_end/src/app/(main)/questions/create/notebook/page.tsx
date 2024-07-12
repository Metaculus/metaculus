/* eslint-disable */
"use client";

import dynamic from "next/dynamic";

const MarkdownEditor = dynamic(() => import("@/components/markdown_editor"), {
  ssr: false,
});

import { useState } from "react";
import Button from "@/components/ui/button";
import { createQuestionPost } from "../../actions";
import { useTranslations } from "next-intl";
import ProjectsApi from "@/services/projects";
import { useRouter } from "next/navigation";
import BacktoCreate from "../../components/back_to_create";

const NotebookCreator: React.FC = ({}) => {
  const [markdown, setMarkdown] = useState("");
  const [title, setTitle] = useState("");
  const t = useTranslations();
  // @TODO Separate notebook editor client
  // const allCategories = await ProjectsApi.getCategories();
  const router = useRouter();

  return (
    <div className="mb-4 mt-2 flex max-w-[840px] flex-col justify-center gap-4 self-center rounded-none bg-white px-4 py-4 pb-5 dark:bg-blue-900 md:m-8 md:mx-auto md:rounded-md md:px-8 md:pb-8 lg:m-12 lg:mx-auto">
      <BacktoCreate
        backText="Create"
        backHref="/questions/create"
        currentPage="Notebook"
      />
      <input
        className="rounded border border-gray-500 px-3 py-2 text-xl dark:bg-blue-950"
        type="text"
        placeholder={t("Title")}
        onChange={(e) => setTitle(e.target.value)}
      ></input>
      <div className="rounded border border-gray-300 dark:border-gray-600/60">
        <MarkdownEditor
          markdown={markdown}
          onChange={setMarkdown}
          mode="write"
        />
      </div>
      <div>
        <Button
          size="lg"
          onClick={async () => {
            const resp = await createQuestionPost({
              title: title,
              notebook: {
                type: "discussion",
                image_url: null,
                markdown: markdown,
              },
            });
            router.push(`/questions/${resp?.post?.id}`);
          }}
        >
          Create Notebook
        </Button>
      </div>
    </div>
  );
};

export default NotebookCreator;
