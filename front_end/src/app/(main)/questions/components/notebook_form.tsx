"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import ProjectPickerInput from "@/app/(main)/questions/components/project_picker_input";
import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import { FormErrorMessage, Input, Textarea } from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useAuth } from "@/contexts/auth_context";
import useConfirmPageLeave from "@/hooks/use_confirm_page_leave";
import { Category, Post, PostWithForecasts } from "@/types/post";
import { Tournament, TournamentPreview } from "@/types/projects";
import { logError } from "@/utils/errors";
import { getPostLink } from "@/utils/navigation";

import BacktoCreate from "./back_to_create";
import CategoryPicker from "./category_picker";
import { createQuestionPost, updatePost } from "../actions";

const createNotebookSchema = (t: ReturnType<typeof useTranslations>) => {
  return z.object({
    title: z
      .string()
      .min(4, {
        message: t("errorMinLength", { field: "String", minLength: 4 }),
      })
      .max(200, {
        message: t("errorMaxLength", { field: "String", maxLength: 200 }),
      }),
    url_title: z
      .string()
      .min(4, {
        message: t("errorMinLength", { field: "String", minLength: 4 }),
      })
      .max(60, {
        message: t("errorMaxLength", { field: "String", maxLength: 60 }),
      }),
    default_project: z.number(),
  });
};

type Props = {
  mode: "create" | "edit";
  post: PostWithForecasts | null;
  allCategories: Category[];
  tournament_id: number | null;
  tournaments: TournamentPreview[];
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
  const { user } = useAuth();
  const [markdown, setMarkdown] = useState(post?.notebook?.markdown ?? "");
  const [isMarkdownDirty, setIsMarkdownDirty] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>();
  const [error, setError] = useState<
    (Error & { digest?: string }) | undefined
  >();
  const t = useTranslations();
  const notebookSchema = createNotebookSchema(t);
  const control = useForm({
    mode: "all",
    resolver: zodResolver(notebookSchema),
  });
  const [categoriesList, setCategoriesList] = useState<Category[]>(
    post?.projects.category ? post?.projects.category : ([] as Category[])
  );
  const [isCategoriesDirty, setIsCategoriesDirty] = useState(false);

  const defaultProject = post
    ? post.projects.default_project
    : tournament_id
      ? [...tournaments, siteMain].filter((x) => x.id === tournament_id)[0]
      : siteMain;
  const isFormDirty =
    !!Object.keys(control.formState.dirtyFields).length ||
    isMarkdownDirty ||
    isCategoriesDirty;

  const router = useRouter();

  const submitQuestion = async (data: any) => {
    setIsLoading(true);
    setError(undefined);
    let post_data = {
      title: data["title"],
      url_title: data["url_title"],
      default_project: data["default_project"],
      categories: categoriesList.map((x) => x.id),
      news_type: news_type,
      notebook: {
        markdown: markdown,
        type: news_type ? "news" : "discussion",
        image_url: null,
      },
    };

    let resp: { post: Post };

    try {
      if (mode === "edit" && post) {
        resp = await updatePost(post.id, post_data);
      } else {
        resp = await createQuestionPost(post_data);
      }

      router.push(getPostLink(resp.post));
    } catch (e) {
      logError(e);
      const error = e as Error & { digest?: string };
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useConfirmPageLeave(isFormDirty);

  return (
    <main className="mb-4 mt-2 flex max-w-4xl flex-col justify-center self-center rounded-none bg-gray-0 px-4 pb-5 pt-4 dark:bg-gray-0-dark md:m-8 md:mx-auto md:rounded-md md:px-8 md:pb-8 lg:m-12 lg:mx-auto">
      <BacktoCreate
        backText={t("create")}
        backHref="/questions/create"
        currentPage={t("notebook")}
      />
      <form
        className="mt-4 flex w-full flex-col gap-6"
        onSubmit={async (e) => {
          if (!control.getValues("default_project")) {
            control.setValue("default_project", siteMain.id);
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
        {post && user?.is_superuser && (
          <a href={`/admin/posts/post/${post.id}/change`}>
            {t("viewInDjangoAdmin")}
          </a>
        )}
        <ProjectPickerInput
          tournaments={tournaments}
          siteMain={siteMain}
          currentProject={defaultProject}
          onChange={(project) => {
            control.setValue("default_project", project.id);
          }}
        />
        <InputContainer labelText={t("longTitle")}>
          <Textarea
            {...control.register("title")}
            errors={control.formState.errors.title}
            defaultValue={post?.title}
            className="min-h-36 rounded border border-gray-500 p-5 text-xl font-normal dark:border-gray-500-dark dark:bg-blue-50-dark"
          />
        </InputContainer>
        <InputContainer labelText={t("shortTitle")}>
          <Input
            {...control.register("url_title")}
            errors={control.formState.errors.url_title}
            defaultValue={post?.url_title}
            className="rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
          />
        </InputContainer>
        <div className="rounded border border-gray-300 dark:border-gray-300-dark">
          <MarkdownEditor
            markdown={markdown}
            shouldConfirmLeave={isMarkdownDirty}
            onChange={(value) => {
              setMarkdown(value);
              setIsMarkdownDirty(true);
            }}
            mode="write"
          />
        </div>
        <InputContainer labelText={t("categories")}>
          <CategoryPicker
            allCategories={allCategories}
            categories={categoriesList}
            onChange={(categories) => {
              setCategoriesList(categories);
              setIsCategoriesDirty(true);
            }}
          ></CategoryPicker>
        </InputContainer>

        <div className="flex-col">
          <div className="-mt-2 min-h-[32px] flex-col">
            {isLoading && <LoadingIndicator />}
            {!isLoading && <FormErrorMessage errors={error?.digest} />}
          </div>
          <Button
            type="submit"
            className="w-max capitalize"
            disabled={isLoading}
          >
            {mode === "create" ? t("createQuestion") : t("editQuestion")}
          </Button>
        </div>
      </form>
    </main>
  );
};

export default NotebookForm;
