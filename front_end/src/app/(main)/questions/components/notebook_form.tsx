"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isNil } from "lodash";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import ProjectPickerInput from "@/app/(main)/questions/components/project_picker_input";
import Button from "@/components/ui/button";
import {
  FormErrorMessage,
  Input,
  MarkdownEditorField,
  Textarea,
} from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useDebouncedCallback } from "@/hooks/use_debounce";
import { Category, Post, PostWithForecasts } from "@/types/post";
import {
  Tournament,
  TournamentPreview,
  TournamentType,
} from "@/types/projects";
import { logError } from "@/utils/core/errors";
import { getPostLink } from "@/utils/navigation";
import {
  QUESTION_DRAFT_DEBOUNCE_TIME,
  cleanupQuestionDrafts,
  deleteQuestionDraft,
  getQuestionDraft,
  saveQuestionDraft,
} from "@/utils/questions";

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
    short_title: z
      .string()
      .min(4, {
        message: t("errorMinLength", { field: "String", minLength: 4 }),
      })
      .max(60, {
        message: t("errorMaxLength", { field: "String", maxLength: 60 }),
      }),
    default_project: z.number(),
    markdown: z.string().min(1, {
      message: t("errorMinLength", { field: "String", minLength: 1 }),
    }),
  });
};
type FormData = z.infer<ReturnType<typeof createNotebookSchema>>;

type Props = {
  mode: "create" | "edit";
  post?: PostWithForecasts;
  allCategories: Category[];
  tournament_id?: number;
  community_id?: number;
  news_category_id?: number;
  tournaments: TournamentPreview[];
  siteMain: Tournament;
};

const NotebookForm: React.FC<Props> = ({
  mode,
  post,
  allCategories,
  tournament_id,
  community_id,
  tournaments,
  siteMain,
  news_category_id,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>();
  const [error, setError] = useState<
    (Error & { digest?: string }) | undefined
  >();
  const draftKey = `notebook`;
  const t = useTranslations();
  const notebookSchema = createNotebookSchema(t);
  const form = useForm<FormData>({
    mode: "all",
    resolver: zodResolver(notebookSchema),
  });

  // TODO: consider refactoring this field to be part of zod schema
  const [categoriesList, setCategoriesList] = useState<Category[]>(
    post?.projects.category ? post?.projects.category : ([] as Category[])
  );

  const defaultProjectId =
    post?.projects?.default_project?.id ??
    community_id ??
    tournament_id ??
    news_category_id ??
    siteMain.id;

  // Only works for Tournaments & question series
  const defaultProject = post
    ? post.projects.default_project
    : tournament_id
      ? ([...tournaments, siteMain].find(
          (x) => x.id === tournament_id
        ) as Tournament)
      : siteMain;
  const [defaultProjectState, setDefaultProjectState] =
    useState<Tournament>(defaultProject);

  const router = useRouter();

  const submitQuestion = async (data: FormData) => {
    setIsLoading(true);
    setError(undefined);
    const post_data = {
      title: data["title"],
      short_title: data["short_title"],
      default_project: data["default_project"],
      categories: categoriesList.map((x) => x.id),
      notebook: {
        markdown: data["markdown"],
        type:
          post?.notebook?.type ?? (news_category_id ? "news" : "discussion"),
      },
    };

    let resp: { post: Post };

    try {
      if (mode === "edit" && post) {
        resp = await updatePost(post.id, post_data);
      } else {
        resp = await createQuestionPost(post_data);
      }
      deleteQuestionDraft(draftKey);
      router.push(getPostLink(resp.post));
    } catch (e) {
      const error = e as Error & { digest?: string };
      logError(error, { payload: post_data });
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "create") {
      cleanupQuestionDrafts();
      const draft = getQuestionDraft(draftKey);
      if (draft) {
        Object.entries(draft).forEach(([key, value]) => {
          if (
            !["lastModified", "type", "options", "categories"].includes(key)
          ) {
            if (key === "default_project") {
              // prevent draft value overwrite query value
              form.setValue(key as any, tournament_id ?? community_id ?? value);
            } else {
              form.setValue(key as any, value);
            }
          }
        });

        setCategoriesList(draft.categories ?? []);
        setDefaultProjectState(
          draft.default_project &&
            !isNil(draft.default_project) &&
            isNil(tournament_id) &&
            isNil(community_id) &&
            isNil(news_category_id)
            ? ([...tournaments, siteMain].filter(
                (x) => x.id === draft.default_project
              )[0] as Tournament)
            : defaultProject
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormChange = useCallback(() => {
    if (mode === "create") {
      const formData = form.getValues();
      saveQuestionDraft(draftKey, {
        ...formData,
        categories: categoriesList,
      });
    }
  }, [form, mode, categoriesList, draftKey]);

  const debouncedHandleFormChange = useDebouncedCallback(
    handleFormChange,
    QUESTION_DRAFT_DEBOUNCE_TIME
  );

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
          if (!form.getValues("default_project")) {
            form.setValue("default_project", defaultProjectId);
          }
          // e.preventDefault(); // Good for debugging
          await form.handleSubmit(
            async (data) => {
              await submitQuestion(data);
            },
            async (e) => {
              console.log("Error: ", e);
            }
          )(e);
        }}
        onChange={debouncedHandleFormChange}
      >
        {!community_id &&
          !news_category_id &&
          defaultProject?.type !== TournamentType.Community &&
          defaultProject?.type !== TournamentType.NewsCategory && (
            <ProjectPickerInput
              tournaments={tournaments}
              siteMain={siteMain}
              currentProject={defaultProjectState}
              onChange={(project) => {
                form.setValue("default_project", project.id);
                debouncedHandleFormChange("");
              }}
            />
          )}
        <InputContainer labelText={t("longTitle")}>
          <Textarea
            {...form.register("title")}
            errors={form.formState.errors.title}
            defaultValue={post?.title}
            className="min-h-36 rounded border border-gray-500 p-5 text-xl font-normal dark:border-gray-500-dark dark:bg-blue-50-dark"
          />
        </InputContainer>
        <InputContainer labelText={t("shortTitle")}>
          <Input
            {...form.register("short_title")}
            errors={form.formState.errors.short_title}
            defaultValue={post?.short_title}
            className="rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
          />
        </InputContainer>
        <div className="flex flex-col gap-1.5">
          <MarkdownEditorField
            control={form.control}
            name={"markdown"}
            defaultValue={post?.notebook?.markdown}
            errors={form.formState.errors.markdown}
            onChange={debouncedHandleFormChange}
          />
        </div>
        <InputContainer labelText={t("categories")}>
          <CategoryPicker
            allCategories={allCategories}
            categories={categoriesList}
            onChange={(categories) => {
              setCategoriesList(categories);
              debouncedHandleFormChange("");
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
