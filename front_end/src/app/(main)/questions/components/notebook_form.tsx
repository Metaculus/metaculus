"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Button from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form_field";
import { Category, PostWithForecasts } from "@/types/post";
import { Tournament } from "@/types/projects";

import BacktoCreate from "./back_to_create";
import CategoryPicker from "./category_picker";
import ProjectPicker from "./project_picker";
import { createQuestionPost, updatePost } from "../actions";

const MarkdownEditor = dynamic(() => import("@/components/markdown_editor"), {
  ssr: false,
});

const notebookSchema = z.object({
  title: z.string().min(4).max(200),
  url_title: z.string().min(4).max(60),
  default_project_id: z.number(),
});

type Props = {
  mode: "create" | "edit";
  post: PostWithForecasts | null;
  allCategories: Category[];
  tournament_id: number | null;
  tournaments: Tournament[];
  siteMain: Tournament;
  news_type: string | undefined | null;
};

const NotebookForm: React.FC<Props> = ({
  mode,
  post,
  allCategories,
  tournament_id,
  tournaments,
  siteMain,
  news_type,
}) => {
  const [markdown, setMarkdown] = useState("");
  const t = useTranslations();
  const control = useForm({
    resolver: zodResolver(notebookSchema),
  });
  const [categoriesList, setCategoriesList] = useState<Category[]>(
    post?.projects.category ? post?.projects.category : ([] as Category[])
  );
  const defaultProject = post
    ? post.projects.default_project
    : tournament_id
      ? [...tournaments, siteMain].filter((x) => x.id === tournament_id)[0]
      : siteMain;

  const router = useRouter();

  const submitQuestion = async (data: any) => {
    let post_data = {
      title: data["title"],
      url_title: data["url_title"],
      default_project_id: data["default_project_id"],
      categories: categoriesList.map((x) => x.id),
      news_type: news_type,
      notebook: {
        markdown: markdown,
        type: news_type ? "news" : "discussion",
        image_url: null,
      },
    };

    if (mode == "edit") {
      const resp = await updatePost(post?.id as number, post_data);
      router.push(`/questions/${resp.post?.id}`);
    } else {
      const resp = await createQuestionPost(post_data);
      router.push(`/questions/${resp.post?.id}`);
    }
  };

  const inputContainerStyles = "flex flex-col gap-1.5";
  const baseInputStyles =
    "px-3 py-2 text-base border border-gray-500 rounded dark:bg-blue-950";
  const baseTextareaStyles = "border border-gray-500 rounded dark:bg-blue-950";
  const inputLabelStyles = "text-sm font-bold text-gray-600 dark:text-gray-400";
  const inputDescriptionStyles = "text-xs text-gray-700 dark:text-gray-300";

  return (
    <div className="mb-4 mt-2 flex max-w-[840px] flex-col justify-center self-center rounded-none bg-white px-4 py-4 pb-5 dark:bg-blue-900 md:m-8 md:mx-auto md:rounded-md md:px-8 md:pb-8 lg:m-12 lg:mx-auto">
      <BacktoCreate
        backText="Create"
        backHref="/questions/create"
        currentPage="Notebook"
      />
      <form
        className="mt-4 flex flex w-[540px] w-full flex-col space-y-4 rounded"
        onSubmit={async (e) => {
          if (!control.getValues("default_project_id")) {
            control.setValue("default_project_id", siteMain.id);
          }
          // e.preventDefault(); // Good for debugging
          await control.handleSubmit(
            async (data) => {
              await submitQuestion(data);
            },
            async (e) => {
              console.log("Error: ", e);
            }
          )(e);
        }}
      >
        {post && (
          <div>
            <a href={`/admin/posts/post/${post.id}/change`}>
              View in django admin
            </a>
          </div>
        )}
        <div className={inputContainerStyles}>
          <ProjectPicker
            tournaments={tournaments}
            siteMain={siteMain}
            currentProject={defaultProject}
            onChange={(project) => {
              control.setValue("default_project_id", project.id);
            }}
          />
        </div>
        <div className={inputContainerStyles}>
          <span className={inputLabelStyles}>Long Title</span>
          <Textarea
            {...control.register("title")}
            errors={control.formState.errors.title}
            defaultValue={post?.title}
            className={`${baseTextareaStyles} min-h-[148px] p-5 text-xl font-normal`}
          />
          <span className={inputDescriptionStyles}>
            This should be a shorter version of the question text, used where
            there is less space to display a title. It should end with a
            question mark. Examples: &quot;NASA 2022 spacesuit contract
            winner?&quot; or &quot;EU GDP from 2025 to 2035?&quot;.
          </span>
        </div>
        <div className={inputContainerStyles}>
          <span className={inputLabelStyles}>{t("Short Title")}</span>
          <Input
            {...control.register("url_title")}
            errors={control.formState.errors.url_title}
            defaultValue={post?.url_title}
            className={baseInputStyles}
          />
          <span className={inputDescriptionStyles}>
            This should be a shorter version of the Long Title, used where there
            is less space to display a title. Examples: &quot;NASA 2022
            Spacesuit Contract Winner&quot; ; &quot;EU GDP From 2025 to
            2035&quot;.
          </span>
        </div>
        <div className="rounded border border-gray-300 dark:border-gray-600/60">
          <MarkdownEditor
            markdown={markdown}
            onChange={setMarkdown}
            mode="write"
          />
        </div>
        <div>
          <div className={inputContainerStyles}>
            <span className={inputLabelStyles}>Categories</span>
            <CategoryPicker
              allCategories={allCategories}
              categories={categoriesList}
              onChange={(categories) => {
                setCategoriesList(categories);
              }}
            ></CategoryPicker>
          </div>
          <Button type="submit">
            {mode === "edit" ? "Edit Notebook" : "Create Notebook"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NotebookForm;
