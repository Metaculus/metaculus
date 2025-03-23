"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import * as z from "zod";

import ProjectPickerInput from "@/app/(main)/questions/components/project_picker_input";
import PostDjangoAdminLink from "@/app/(main)/questions/create/components/django_admin_link";
import Button from "@/components/ui/button";
import {
  DateInput,
  FormError,
  FormErrorMessage,
  Input,
  MarkdownEditorField,
} from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { MarkdownText } from "@/components/ui/markdown_text";
import SectionToggle from "@/components/ui/section_toggle";
import { ErrorResponse } from "@/types/fetch";
import { Category, Post, PostStatus, PostWithForecasts } from "@/types/post";
import {
  Tournament,
  TournamentPreview,
  TournamentType,
} from "@/types/projects";
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
  short_title: string;
  categories: number[];
  question: any;
  default_project: number;
  published_at: string;
};

const createQuestionSchemas = (
  t: ReturnType<typeof useTranslations>,
  post: PostWithForecasts | null
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
    short_title: z
      .string()
      .min(4, {
        message: t("errorMinLength", { field: "String", minLength: 4 }),
      })
      .max(80, {
        message: t("errorMaxLength", { field: "String", maxLength: 80 }),
      }),
    description: z.string().min(4, {
      message: t("errorMinLength", { field: "String", minLength: 4 }),
    }),
    resolution_criteria: z.string().min(1, { message: t("errorRequired") }),
    fine_print: z.string().optional(),
    published_at: z
      .string()
      .datetime({ offset: true })
      .nullable()
      .optional()
      .refine(
        (value) => {
          if (!post) {
            return true;
          }

          if (post.status !== PostStatus.APPROVED) {
            return true;
          }

          return !!value;
        },
        {
          message: t("errorRequired"),
        }
      ),
    open_time: z
      .string()
      .datetime({ offset: true })
      .nullable()
      .optional()
      .refine(
        (value) => {
          if (!post) {
            return true;
          }

          if (post.status !== PostStatus.APPROVED) {
            return true;
          }

          return !!value;
        },
        {
          message: t("errorRequired"),
        }
      ),
    scheduled_close_time: z
      .string()
      .datetime({ offset: true })
      .nullable()
      .optional()
      .refine(
        (value) => {
          if (!post) {
            return true;
          }

          if (post.status !== PostStatus.APPROVED) {
            return true;
          }

          return !!value;
        },
        {
          message: t("errorRequired"),
        }
      ),
    scheduled_resolve_time: z
      .string()
      .datetime({ offset: true })
      .nullable()
      .optional()
      .refine(
        (value) => {
          if (!post) {
            return true;
          }

          if (post.status !== PostStatus.APPROVED) {
            return true;
          }

          return !!value;
        },
        {
          message: t("errorRequired"),
        }
      ),
    cp_reveal_time: z
      .string()
      .datetime({ offset: true })
      .nullable()
      .optional()
      .refine(
        (value) => {
          if (!post) {
            return true;
          }

          if (post.status !== PostStatus.APPROVED) {
            return true;
          }

          return !!value;
        },
        {
          message: t("errorRequired"),
        }
      ),
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
      unit: z.string().max(200, {
        message: t("errorMaxLength", { field: "String", maxLength: 20 }),
      }),
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
      group_variable: z.string().max(200, {
        message: t("errorMaxLength", { field: "String", maxLength: 200 }),
      }),
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
  const router = useRouter();
  const t = useTranslations();
  const { isDone, hasForecasts } = getQuestionStatus(post);
  const [isLoading, setIsLoading] = useState<boolean>();
  const [error, setError] = useState<
    (Error & { digest?: string }) | undefined
  >();

  const defaultProject = post
    ? post.projects.default_project
    : tournament_id
      ? ([...tournaments, siteMain].filter(
          (x) => x.id === tournament_id
        )[0] as Tournament)
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

  const submitQuestion = async (data: FieldValues) => {
    setIsLoading(true);
    setError(undefined);

    data["type"] = questionType;
    data["options"] =
      questionType === QuestionType.MultipleChoice
        ? optionsList.map((option) => option.trim())
        : [];

    const post_data: PostCreationData = {
      title: data["title"],
      short_title: data["short_title"],
      default_project: data["default_project"],
      categories: categoriesList.map((x) => x.id),
      published_at: data["published_at"],
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

  const schemas = createQuestionSchemas(t, post);
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

  // TODO: refactor validation schema setup to properly populate useForm generic
  const form = useForm({
    mode: "all",
    resolver: zodResolver(getFormSchema(questionType)),
  });
  if (questionType) {
    form.setValue("type", questionType);
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
          if (!form.getValues("default_project")) {
            form.setValue(
              "default_project",
              community_id ? community_id : defaultProject.id
            );
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
        onChange={async () => {
          const data = form.getValues();
          data["type"] = questionType;
        }}
        className="mt-4 flex w-full flex-col gap-6"
      >
        <PostDjangoAdminLink post={post} />

        <FormError
          errors={form.formState.errors}
          className="text-red-500 dark:text-red-500-dark"
          {...form.register("type")}
        />
        <InputContainer
          labelText={t("longTitle")}
          explanation={t("longTitleExplanation")}
        >
          <Input
            {...form.register("title")}
            errors={form.formState.errors.title}
            defaultValue={post?.title}
            className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
          />
        </InputContainer>
        <InputContainer
          labelText={t("shortTitle")}
          explanation={t("shortTitleExplanation")}
        >
          <Input
            {...form.register("short_title")}
            errors={form.formState.errors.short_title}
            defaultValue={post?.short_title}
            className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
          />
        </InputContainer>
        {questionType === "numeric" && (
          <InputContainer
            labelText={t("questionUnit")}
            explanation={t("questionUnitDescription")}
          >
            <Input
              {...form.register("unit")}
              errors={form.formState.errors.unit}
              defaultValue={post?.question?.unit}
              className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
            />
          </InputContainer>
        )}
        <InputContainer
          labelText={t("backgroundInformation")}
          explanation={t.rich("backgroundInfoExplanation", {
            link: (chunks) => <Link href="/help/markdown">{chunks}</Link>,
            markdown: (chunks) => <MarkdownText>{chunks}</MarkdownText>,
          })}
          isNativeFormControl={false}
        >
          <MarkdownEditorField
            control={form.control}
            name={"description"}
            defaultValue={post?.question?.description}
            errors={form.formState.errors.description}
          />
        </InputContainer>
        <InputContainer
          labelText={t("resolutionCriteria")}
          explanation={t.rich("resolutionCriteriaExplanation", {
            markdown: (chunks) => <MarkdownText>{chunks}</MarkdownText>,
          })}
          isNativeFormControl={false}
        >
          <MarkdownEditorField
            control={form.control}
            name={"resolution_criteria"}
            defaultValue={post?.question?.resolution_criteria}
            errors={form.formState.errors.resolution_criteria}
          />
        </InputContainer>
        <InputContainer
          labelText={t("finePrint")}
          explanation={t("finePrintDescription")}
          isNativeFormControl={false}
        >
          <MarkdownEditorField
            control={form.control}
            name={"fine_print"}
            defaultValue={post?.question?.fine_print}
            errors={form.formState.errors.fine_print}
          />
        </InputContainer>

        {(questionType === QuestionType.Date ||
          questionType === QuestionType.Numeric) && (
          <NumericQuestionInput
            questionType={questionType}
            defaultMin={post?.question?.scaling.range_min ?? undefined}
            defaultMax={post?.question?.scaling.range_max ?? undefined}
            defaultOpenLowerBound={post?.question?.open_lower_bound}
            defaultOpenUpperBound={post?.question?.open_upper_bound}
            defaultZeroPoint={post?.question?.scaling.zero_point}
            hasForecasts={hasForecasts && mode !== "create"}
            control={form}
            onChange={({
              min: rangeMin,
              max: rangeMax,
              open_upper_bound: openUpperBound,
              open_lower_bound: openLowerBound,
              zero_point: zeroPoint,
            }) => {
              form.setValue("scaling", {
                range_min: rangeMin,
                range_max: rangeMax,
                zero_point: zeroPoint,
              });
              form.setValue("open_lower_bound", openLowerBound);
              form.setValue("open_upper_bound", openUpperBound);
            }}
          />
        )}

        {questionType === "multiple_choice" && (
          <>
            <InputContainer
              labelText={t("groupVariable")}
              explanation={t("groupVariableDescription")}
            >
              <Input
                {...form.register("group_variable")}
                errors={form.formState.errors.group_variable}
                defaultValue={post?.question?.group_variable}
                className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
              />
            </InputContainer>
            <div className="flex-col">
              <InputContainer labelText={t("choices")} />
              {optionsList && (
                <div className="flex flex-col">
                  {optionsList.map((option, opt_index) => (
                    <div key={opt_index} className="flex">
                      <div className="w-full">
                        <Input
                          {...form.register(`options.${opt_index}`)}
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
                            (
                              form.formState.errors.options as
                                | ErrorResponse[]
                                | undefined
                            )?.[opt_index]
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
                              form.setValue("options", newOptionsArray);
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
          </>
        )}

        <SectionToggle title="Advanced Options" defaultOpen={false}>
          <div className="mb-4 text-sm text-gray-700 dark:text-gray-700-dark md:mt-1 md:text-base">
            {t("advancedOptionsDescription")}
          </div>

          <div className="mb-6 flex w-full flex-col gap-4 md:flex-row">
            <InputContainer
              labelText={t("openTime")}
              explanation={"When this question will be open for predictions."}
              className="w-full gap-2"
            >
              <DateInput
                control={form.control}
                name="open_time"
                defaultValue={post?.question?.open_time}
                errors={form.formState.errors.open_time}
                className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
              />
            </InputContainer>
            <InputContainer
              labelText={"Publish Time"}
              explanation={t("publishTimeDescription")}
              className="w-full gap-2"
            >
              <DateInput
                control={form.control}
                name="published_at"
                defaultValue={post?.published_at}
                errors={form.formState.errors.published_at}
                className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
              />
            </InputContainer>
          </div>
          <div className="mb-6 flex w-full flex-col gap-4 md:flex-row">
            <InputContainer
              labelText={"Closing Time"}
              explanation={t("closingTimeDescription")}
              className="w-full gap-2"
            >
              <DateInput
                control={form.control}
                name="scheduled_close_time"
                defaultValue={post?.question?.scheduled_close_time}
                errors={form.formState.errors.scheduled_close_time}
                className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
              />
            </InputContainer>
            <InputContainer
              labelText={"Resolving Time"}
              explanation={t("resolvingTimeDescription")}
              className="w-full gap-2"
            >
              <DateInput
                control={form.control}
                name="scheduled_resolve_time"
                defaultValue={post?.question?.scheduled_resolve_time}
                errors={form.formState.errors.scheduled_resolve_time}
                className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
              />
            </InputContainer>
          </div>
          <div className="mb-6 flex w-full flex-col gap-4 md:flex-row">
            <InputContainer
              labelText={t("cpRevealTime")}
              explanation={t("cpRevealTimeDescription")}
              className="w-full gap-2"
            >
              <DateInput
                control={form.control}
                name="cp_reveal_time"
                defaultValue={post?.question?.cp_reveal_time}
                errors={form.formState.errors.cp_reveal_time}
                className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
              />
            </InputContainer>
          </div>
          <InputContainer labelText={t("categories")}>
            <CategoryPicker
              allCategories={allCategories}
              categories={categoriesList}
              onChange={(categories) => {
                setCategoriesList(categories);
              }}
            />
          </InputContainer>
          {!community_id &&
            defaultProject.type !== TournamentType.Community && (
              <ProjectPickerInput
                tournaments={tournaments}
                siteMain={siteMain}
                currentProject={defaultProject}
                onChange={(project) => {
                  form.setValue("default_project", project.id);
                }}
              />
            )}
        </SectionToggle>

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
