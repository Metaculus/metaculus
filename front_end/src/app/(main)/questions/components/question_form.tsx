"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FC } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import ProjectPickerInput from "@/app/(main)/questions/components/project_picker_input";
import Button from "@/components/ui/button";
import {
  FormError,
  FormErrorMessage,
  Input,
  Textarea,
} from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { MarkdownText } from "@/components/ui/markdown_text";
import { useAuth } from "@/contexts/auth_context";
import {
  Category,
  Post,
  PostWithForecasts,
  ProjectPermissions,
} from "@/types/post";
import { Tournament, TournamentPreview, TournamentType } from "@/types/projects";
import { QuestionType } from "@/types/question";
import { logErrorWithScope } from "@/utils/errors";
import { getPostLink } from "@/utils/navigation";
import { getQuestionStatus } from "@/utils/questions";

import BacktoCreate from "./back_to_create";
import CategoryPicker from "./category_picker";
import NumericQuestionInput from "./numeric_question_input";
import { createQuestionPost, updatePost } from "../actions";

const MIN_OPTIONS_AMOUNT = 2;

type PostCreationData = {
  title: string;
  url_title: string;
  categories: number[];
  question: any;
  default_project: number;
};

export const createQuestionSchemas = (
  t: ReturnType<typeof useTranslations>
) => {
  const baseQuestionSchema = z.object({
    type: z.enum(["binary", "multiple_choice", "date", "numeric"]),
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
    description: z.string().min(4, {
      message: t("errorMinLength", { field: "String", minLength: 4 }),
    }),
    resolution_criteria: z.string().min(1, { message: t("errorRequired") }),
    fine_print: z.string(),
    scheduled_close_time: z.date(),
    scheduled_resolve_time: z.date(),
    default_project: z.nullable(z.union([z.number(), z.string()])),
  });

  const binaryQuestionSchema = baseQuestionSchema;

  const continuousQuestionSchema = baseQuestionSchema.merge(
    z.object({
      scaling: z.object({
        range_min: z.number().optional().nullable(),
        range_max: z.number().optional().nullable(),
        zero_point: z.number().optional().nullable(),
      }),
      open_upper_bound: z.boolean().default(true),
      open_lower_bound: z.boolean().default(true),
    })
  );

  const numericQuestionSchema = continuousQuestionSchema.merge(
    z.object({
      max: z.number().optional(),
      min: z.number().optional(),
    })
  );

  const dateQuestionSchema = continuousQuestionSchema.merge(
    z.object({
      max: z.date().optional(),
      min: z.date().optional(),
    })
  );

  const multipleChoiceQuestionSchema = baseQuestionSchema.merge(
    z.object({
      options: z.array(
        z
          .string()
          .min(1, { message: t("errorRequired") })
          .refine((value) => value.trim() !== "", {
            message: t("emptyOptionError"),
          })
      ),
    })
  );

  return {
    baseQuestionSchema,
    binaryQuestionSchema,
    continuousQuestionSchema,
    numericQuestionSchema,
    dateQuestionSchema,
    multipleChoiceQuestionSchema,
  };
};

type Props = {
  questionType: string;
  tournament_id?: number;
  community_id?: number;
  allCategories: Category[];
  post?: PostWithForecasts | null;
  mode: "create" | "edit";
  tournaments: TournamentPreview[];
  siteMain: Tournament;
};

const QuestionForm: FC<Props> = ({
  questionType,
  mode,
  allCategories,
  tournaments,
  siteMain,
  tournament_id = null,
  community_id = null,
  post = null,
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const { isLive, isDone, hasForecasts } = getQuestionStatus(post);
  const [isLoading, setIsLoading] = useState<boolean>();
  const [error, setError] = useState<
    (Error & { digest?: string }) | undefined
  >();

  const defaultProject = post
    ? post.projects.default_project
    : tournament_id
      ? [...tournaments, siteMain].filter((x) => x.id === tournament_id)[0]
      : siteMain;

  if (isDone) {
    throw new Error(t("isDoneError"));
  }

  const questionTypeDisplayMap: Record<
    string,
    { title: string; description: string }
  > = {
    binary: {
      title: t("binaryQuestion"),
      description: t("binaryQuestionDescription"),
    },
    multiple_choice: {
      title: t("multipleChoice"),
      description: t("multipleChoiceDescription"),
    },
    date: {
      title: t("dateRange"),
      description: t("dateRangeDescription"),
    },
    numeric: {
      title: t("numericRange"),
      description: t("numericRangeDescription"),
    },
  };

  const { title: formattedQuestionType, description: questionDescription } =
    questionTypeDisplayMap[questionType] || {
      title: questionType,
      description: "",
    };

  const submitQuestion = async (data: any) => {
    setIsLoading(true);
    setError(undefined);

    data["type"] = questionType;
    data["options"] =
      questionType === QuestionType.MultipleChoice
        ? optionsList.map((option) => option.trim())
        : [];

    let post_data: PostCreationData = {
      title: data["title"],
      url_title: data["url_title"],
      default_project: data["default_project"],
      categories: categoriesList.map((x) => x.id),
      question: data,
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
      const error = e as Error & { digest?: string };
      logErrorWithScope(error, post_data);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };
  const [optionsList, setOptionsList] = useState<string[]>(
    post?.question?.options
      ? post.question.options
      : Array(MIN_OPTIONS_AMOUNT).fill("")
  );

  const [categoriesList, setCategoriesList] = useState<Category[]>(
    post?.projects.category ? post?.projects.category : ([] as Category[])
  );

  const schemas = createQuestionSchemas(t);
  const getFormSchema = (type: string) => {
    switch (type) {
      case "binary":
        return schemas.binaryQuestionSchema;
      case "numeric":
        return schemas.numericQuestionSchema;
      case "date":
        return schemas.dateQuestionSchema;
      case "multiple_choice":
        return schemas.multipleChoiceQuestionSchema;
      default:
        throw new Error("Invalid question type");
    }
  };

  const control = useForm({
    mode: "all",
    resolver: zodResolver(getFormSchema(questionType)),
  });

  if (questionType) {
    control.setValue("type", questionType);
  }

  return (
    <main className="mb-4 mt-2 flex max-w-4xl flex-col justify-center self-center rounded-none bg-gray-0 px-4 pb-5 pt-4 dark:bg-gray-0-dark md:m-8 md:mx-auto md:rounded-md md:px-8 md:pb-8 lg:m-12 lg:mx-auto">
      <BacktoCreate
        backText={t("create")}
        backHref="/questions/create"
        currentPage={formattedQuestionType}
      />
      <div className="text-sm text-gray-700 dark:text-gray-700-dark md:mt-1 md:text-base">
        {questionDescription}
      </div>
      <form
        onSubmit={async (e) => {
          if (!control.getValues("default_project")) {
            control.setValue(
              "default_project",
              community_id ? community_id : defaultProject.id
            );
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
        onChange={async () => {
          const data = control.getValues();
          data["type"] = questionType;
        }}
        className="mt-4 flex w-full flex-col gap-6"
      >
        {post && user?.is_superuser && (
          <a href={`/admin/posts/post/${post.id}/change`}>
            {t("viewInDjangoAdmin")}
          </a>
        )}
        {(!community_id ||
          defaultProject.type !== TournamentType.Community) && (
          <ProjectPickerInput
            tournaments={tournaments}
            siteMain={siteMain}
            currentProject={defaultProject}
            onChange={(project) => {
              control.setValue("default_project", project.id);
            }}
          />
        )}
        <FormError
          errors={control.formState.errors}
          className="text-red-500 dark:text-red-500-dark"
          {...control.register("type")}
        />
        <InputContainer
          labelText={t("longTitle")}
          explanation={t("longTitleExplanation")}
        >
          <Textarea
            {...control.register("title")}
            errors={control.formState.errors.title}
            defaultValue={post?.title}
            className="min-h-32 w-full rounded border border-gray-500 p-5 text-xl font-normal dark:border-gray-500-dark dark:bg-blue-50-dark"
          />
        </InputContainer>
        <InputContainer
          labelText={t("shortTitle")}
          explanation={t("shortTitleExplanation")}
        >
          <Input
            {...control.register("url_title")}
            errors={control.formState.errors.url_title}
            defaultValue={post?.url_title}
            className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
          />
        </InputContainer>
        <InputContainer
          labelText={t("backgroundInformation")}
          explanation={t.rich("backgroundInfoExplanation", {
            link: (chunks) => <Link href="/help/markdown">{chunks}</Link>,
            markdown: (chunks) => <MarkdownText>{chunks}</MarkdownText>,
          })}
        >
          <Textarea
            {...control.register("description")}
            errors={control.formState.errors.description}
            className="h-32 w-full rounded border border-gray-500 p-3 text-sm dark:border-gray-500-dark dark:bg-blue-50-dark"
            defaultValue={post?.question?.description}
          />
        </InputContainer>
        <div className="flex w-full flex-col gap-4 md:flex-row">
          <InputContainer labelText={t("closingDate")} className="w-full gap-2">
            <Input
              readOnly={hasForecasts && mode !== "create"}
              type="datetime-local"
              className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
              {...control.register("scheduled_close_time", {
                setValueAs: (value: string) => {
                  if (value === "" || value == null) {
                    return null;
                  }

                  return new Date(value);
                },
              })}
              errors={control.formState.errors.scheduled_close_time}
              defaultValue={
                post?.question?.scheduled_close_time
                  ? format(
                      new Date(post.question.scheduled_close_time),
                      "yyyy-MM-dd'T'HH:mm"
                    )
                  : undefined
              }
            />
          </InputContainer>
          <InputContainer
            labelText={t("resolvingDate")}
            className="w-full gap-2"
          >
            <Input
              readOnly={hasForecasts && mode !== "create"}
              type="datetime-local"
              className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
              {...control.register("scheduled_resolve_time", {
                setValueAs: (value: string) => {
                  if (value === "" || value == null) {
                    return null;
                  }

                  return new Date(value);
                },
              })}
              errors={control.formState.errors.scheduled_resolve_time}
              defaultValue={
                post?.question?.scheduled_resolve_time
                  ? format(
                      new Date(post.question.scheduled_resolve_time),
                      "yyyy-MM-dd'T'HH:mm"
                    )
                  : undefined
              }
            />
          </InputContainer>
        </div>
        {(questionType === QuestionType.Date ||
          questionType === QuestionType.Numeric) && (
          <NumericQuestionInput
            questionType={questionType}
            defaultMin={post?.question?.scaling.range_min!}
            defaultMax={post?.question?.scaling.range_max!}
            // @ts-ignore
            defaultOpenLowerBound={post?.question?.open_lower_bound}
            // @ts-ignore
            defaultOpenUpperBound={post?.question?.open_upper_bound}
            defaultZeroPoint={post?.question?.scaling.zero_point}
            hasForecasts={hasForecasts && mode !== "create"}
            canSeeLogarithmic={
              post?.user_permission === ProjectPermissions.ADMIN || !post
            }
            onChange={(
              rangeMin,
              rangeMax,
              openUpperBound,
              openLowerBound,
              zeroPoint
            ) => {
              control.setValue("scaling", {
                range_min: rangeMin,
                range_max: rangeMax,
                zero_point: zeroPoint,
              });
              control.setValue("open_lower_bound", openLowerBound);
              control.setValue("open_upper_bound", openUpperBound);
            }}
          />
        )}

        <InputContainer labelText={t("categories")}>
          <CategoryPicker
            allCategories={allCategories}
            categories={categoriesList}
            onChange={(categories) => {
              setCategoriesList(categories);
            }}
          />
        </InputContainer>
        {questionType === "multiple_choice" && (
          <div className="flex-col">
            <InputContainer labelText={t("choices")} />
            {optionsList && (
              <div className="flex flex-col">
                {optionsList.map((option, opt_index) => (
                  <div key={opt_index} className="flex">
                    <div className="w-full">
                      <Input
                        {...control.register(`options.${opt_index}`)}
                        readOnly={hasForecasts && mode !== "create"}
                        className="my-2 w-full min-w-32 rounded border  border-gray-500 p-2 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
                        value={option}
                        placeholder={`Option ${opt_index + 1}`}
                        onChange={(e) => {
                          setOptionsList(
                            optionsList.map((opt, index) => {
                              if (index === opt_index) {
                                return e.target.value;
                              }
                              return opt;
                            })
                          );
                        }}
                        errors={
                          // @ts-ignore
                          control.formState.errors.options?.[opt_index]
                        }
                      />
                    </div>
                    {opt_index >= MIN_OPTIONS_AMOUNT && !hasForecasts && (
                      <Button
                        className="my-2 h-[42px] w-max self-start capitalize"
                        variant="text"
                        onClick={() => {
                          setOptionsList((prev) => {
                            const newOptionsArray = [...prev].filter(
                              (_, index) => index !== opt_index
                            );
                            control.setValue("options", newOptionsArray);
                            return newOptionsArray;
                          });
                        }}
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <Button
              className="w-max capitalize"
              onClick={() => setOptionsList([...optionsList, ""])}
            >
              + {t("addOption")}
            </Button>
          </div>
        )}
        <InputContainer
          labelText={t("resolutionCriteria")}
          explanation={t.rich("resolutionCriteriaExplanation", {
            markdown: (chunks) => <MarkdownText>{chunks}</MarkdownText>,
          })}
        >
          <Textarea
            {...control.register("resolution_criteria")}
            errors={control.formState.errors.resolution_criteria}
            className="h-32 w-full rounded border border-gray-500 p-3 text-sm dark:border-gray-500-dark dark:bg-blue-50-dark"
            defaultValue={
              post?.question?.resolution_criteria
                ? post?.question?.resolution_criteria
                : undefined
            }
          />
        </InputContainer>
        <InputContainer
          labelText={t("finePrint")}
          explanation={t("finePrintDescription")}
        >
          <Textarea
            {...control.register("fine_print")}
            errors={control.formState.errors.fine_print}
            className="h-32 w-full rounded border border-gray-500 p-3 text-sm dark:border-gray-500-dark dark:bg-blue-50-dark"
            defaultValue={
              post?.question?.fine_print
                ? post?.question?.fine_print
                : undefined
            }
          />
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

export default QuestionForm;
