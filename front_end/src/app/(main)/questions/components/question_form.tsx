"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import { isNil } from "lodash";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import {
  Control,
  FieldErrors,
  FieldValues,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import * as z from "zod";

import ProjectPickerInput from "@/app/(main)/questions/components/project_picker_input";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
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
import { ContinuousQuestionTypes } from "@/constants/questions";
import { useDebouncedCallback } from "@/hooks/use_debounce";
import { ErrorResponse } from "@/types/fetch";
import { Post, PostStatus, PostWithForecasts } from "@/types/post";
import {
  Tournament,
  TournamentPreview,
  TournamentType,
  Category,
} from "@/types/projects";
import {
  ContinuousQuestionType,
  DefaultInboundOutcomeCount,
  QuestionDraft,
  QuestionType,
} from "@/types/question";
import { logError } from "@/utils/core/errors";
import {
  deleteQuestionDraft,
  getQuestionDraft,
  QUESTION_DRAFT_DEBOUNCE_TIME,
  saveQuestionDraft,
} from "@/utils/drafts/questionForm";
import { getPostLink } from "@/utils/navigation";
import { getQuestionStatus } from "@/utils/questions/helpers";

import { createQuestionPost, updatePost } from "../actions";
import BacktoCreate from "./back_to_create";
import CategoryPicker from "./category_picker";
import NumericQuestionInput from "./numeric_question_input";

// Extended interface to include additional fields being used
interface ExtendedQuestionDraft extends QuestionDraft {
  short_title?: string;
  published_at?: string;
  open_time?: string;
  scheduled_close_time?: string;
  scheduled_resolve_time?: string;
  cp_reveal_time?: string;
}

const MIN_OPTIONS_AMOUNT = 2;

type PostCreationData = {
  title: string;
  short_title: string;
  categories: number[];
  question: unknown;
  default_project: number;
  published_at: string | null;
};

const createQuestionSchemas = (
  t: ReturnType<typeof useTranslations>,
  post: PostWithForecasts | null
) => {
  const baseQuestionSchema = z.object({
    type: z.enum([
      QuestionType.Binary,
      QuestionType.MultipleChoice,
      QuestionType.Numeric,
      QuestionType.Discrete,
      QuestionType.Date,
    ]),
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
      inbound_outcome_count: z.number().default(DefaultInboundOutcomeCount),
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
  const discreteQuestionSchema = numericQuestionSchema;

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
    multipleChoiceQuestionSchema,
    continuousQuestionSchema,
    numericQuestionSchema,
    discreteQuestionSchema,
    dateQuestionSchema,
  };
};

type Props = {
  questionType: QuestionType;
  tournament_id?: number;
  community_id?: number;
  allCategories: Category[];
  post?: PostWithForecasts | null;
  mode: "create" | "edit";
  tournaments: TournamentPreview[];
  siteMain: Tournament;
  shouldUseDraftValue: boolean;
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
  shouldUseDraftValue,
}) => {
  const router = useRouter();
  const t = useTranslations();
  const { isDone, hasForecasts } = getQuestionStatus(post);
  const optionsLocked = hasForecasts && mode !== "create";
  const [isLoading, setIsLoading] = useState<boolean>();
  const [error, setError] = useState<
    (Error & { digest?: string }) | undefined
  >();
  const isDraftMounted = useRef(false);
  const defaultProject = post
    ? post.projects.default_project
    : tournament_id
      ? ([...tournaments, siteMain].filter(
          (x) => x.id === tournament_id
        )[0] as Tournament)
      : siteMain;
  const [currentProject, setCurrentProject] =
    useState<Tournament>(defaultProject);
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
    numeric: {
      title: t("numericRange"),
      description: t("numericRangeDescription"),
    },
    discrete: {
      title: t("discrete"),
      description: t("discreteDescription"),
    },
    date: {
      title: t("dateRange"),
      description: t("dateRangeDescription"),
    },
  };

  const { title: formattedQuestionType, description: questionDescription } =
    questionTypeDisplayMap[questionType] || {
      title: questionType,
      description: "",
    };

  const submitQuestion = async (data: FormSchemaType) => {
    setIsLoading(true);
    setError(undefined);

    const questionPayload: unknown =
      questionType === QuestionType.MultipleChoice
        ? ({
            ...(data as MultipleChoiceQuestionType),
            type: QuestionType.MultipleChoice,
            options: optionsList.map((o) => o.trim()),
          } as MultipleChoiceQuestionType)
        : ({
            ...data,
            type: questionType,
          } as Exclude<FormSchemaType, MultipleChoiceQuestionType>);

    const base = data;
    const defaultProjectId =
      typeof base.default_project === "number"
        ? base.default_project
        : typeof base.default_project === "string"
          ? Number(base.default_project)
          : community_id ?? defaultProject.id;

    const post_data: PostCreationData = {
      title: base.title,
      short_title: base.short_title,
      default_project: defaultProjectId,
      categories: categoriesList.map((x) => x.id),
      published_at: base.published_at ?? null,
      question: questionPayload,
    };

    let resp: { post: Post };

    try {
      if (mode === "edit" && post) {
        resp = await updatePost(post.id, post_data);
      } else {
        resp = await createQuestionPost(post_data);
        if (shouldUseDraftValue) {
          deleteQuestionDraft(questionType);
        }
      }
      router.push(getPostLink(resp.post));
    } catch (e) {
      const error = e as Error & { digest?: string };
      logError(error, { payload: post_data });
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

  type BinaryQuestionType = z.infer<typeof schemas.binaryQuestionSchema>;
  type NumericQuestionType = z.infer<typeof schemas.numericQuestionSchema>;
  type DiscreteQuestionType = z.infer<typeof schemas.discreteQuestionSchema>;
  type DateQuestionType = z.infer<typeof schemas.dateQuestionSchema>;
  type MultipleChoiceQuestionType = z.infer<
    typeof schemas.multipleChoiceQuestionSchema
  >;

  type UnitFieldErrors = FieldErrors<{ unit?: unknown }>;
  type GroupVarFieldErrors = FieldErrors<{ group_variable?: unknown }>;
  type OptionsFieldErrors = FieldErrors<{ options?: unknown[] }>;
  const schemas = createQuestionSchemas(t, post);
  const getFormSchema = (type: string) => {
    switch (type) {
      case QuestionType.Binary:
        return schemas.binaryQuestionSchema;
      case QuestionType.MultipleChoice:
        return schemas.multipleChoiceQuestionSchema;
      case QuestionType.Numeric:
        return schemas.numericQuestionSchema;
      case QuestionType.Discrete:
        return schemas.discreteQuestionSchema;
      case QuestionType.Date:
        return schemas.dateQuestionSchema;
      default:
        throw new Error("Invalid question type");
    }
  };
  type FormSchemaType =
    | BinaryQuestionType
    | MultipleChoiceQuestionType
    | NumericQuestionType
    | DiscreteQuestionType
    | DateQuestionType;

  // TODO: refactor validation schema setup to properly populate useForm generic
  const form = useForm<FormSchemaType>({
    mode: "all",
    resolver: zodResolver(getFormSchema(questionType)),
    defaultValues: {
      open_time: post?.question?.open_time,
      published_at: post?.published_at,
      cp_reveal_time: post?.question?.cp_reveal_time,
      include_bots_in_aggregates: post?.question?.include_bots_in_aggregates ?? false,
    },
  });
  if (
    questionType === QuestionType.Binary ||
    questionType === QuestionType.MultipleChoice ||
    questionType === QuestionType.Numeric ||
    questionType === QuestionType.Discrete ||
    questionType === QuestionType.Date
  ) {
    form.setValue("type", questionType);
  }

  const handleFormChange = useCallback(() => {
    if (shouldUseDraftValue) {
      const formData = form.getValues();
      // Explicitly convert to the ExtendedQuestionDraft type
      saveQuestionDraft(questionType, {
        ...formData,
        options: optionsList,
        categories: categoriesList,
        type: formData.type as unknown as QuestionType,
      } as Partial<ExtendedQuestionDraft>);
    }
  }, [form, shouldUseDraftValue, questionType, optionsList, categoriesList]);

  const debouncedHandleFormChange = useDebouncedCallback(
    handleFormChange,
    QUESTION_DRAFT_DEBOUNCE_TIME
  );

  // Helper to convert QuestionDraft to the specific form type
  const convertDraftToFormSchema = (
    draft: ExtendedQuestionDraft
  ): FormSchemaType => {
    // Create a basic object with common properties
    const baseValues = {
      type: draft.type as
        | QuestionType.Binary
        | QuestionType.MultipleChoice
        | QuestionType.Numeric
        | QuestionType.Discrete
        | QuestionType.Date,
      title: draft.title || "",
      short_title: draft.short_title || "",
      description: draft.description || "",
      resolution_criteria: draft.resolution_criteria || "",
      fine_print: draft.fine_print,
      published_at: draft.published_at,
      open_time: draft.open_time,
      scheduled_close_time: draft.scheduled_close_time,
      scheduled_resolve_time: draft.scheduled_resolve_time,
      cp_reveal_time: draft.cp_reveal_time,
      default_project: draft.default_project,
    };

    // Depending on the question type, add specific properties
    switch (draft.type) {
      case QuestionType.MultipleChoice:
        return {
          ...baseValues,
          group_variable: draft.group_variable || "",
          options: draft.options || [],
        } as MultipleChoiceQuestionType;
      case QuestionType.Numeric:
        return {
          ...baseValues,
          scaling: draft.scaling || {
            range_min: null,
            range_max: null,
            zero_point: null,
          },
          open_lower_bound: draft.open_lower_bound ?? true,
          open_upper_bound: draft.open_upper_bound ?? true,
          unit: draft.unit || "",
          min: draft.scaling?.range_min || undefined,
          max: draft.scaling?.range_max || undefined,
        } as NumericQuestionType;
      case QuestionType.Discrete:
        return {
          ...baseValues,
          scaling: draft.scaling || {
            range_min: null,
            range_max: null,
            zero_point: null,
          },
          open_lower_bound: draft.open_lower_bound ?? true,
          open_upper_bound: draft.open_upper_bound ?? true,
          inbound_outcome_count:
            draft.inbound_outcome_count ?? DefaultInboundOutcomeCount,
          unit: draft.unit || "",
          min: draft.scaling?.range_min || undefined,
          max: draft.scaling?.range_max || undefined,
        } as DiscreteQuestionType;

      case QuestionType.Date:
        return {
          ...baseValues,
          scaling: draft.scaling || {
            range_min: null,
            range_max: null,
            zero_point: null,
          },
          open_lower_bound: draft.open_lower_bound ?? true,
          open_upper_bound: draft.open_upper_bound ?? true,
          min: draft.scaling?.range_min
            ? new Date(draft.scaling.range_min)
            : undefined,
          max: draft.scaling?.range_max
            ? new Date(draft.scaling.range_max)
            : undefined,
        } as DateQuestionType;

      default:
        return baseValues as BinaryQuestionType;
    }
  };

  useEffect(() => {
    if (shouldUseDraftValue && !isDraftMounted.current) {
      const draft = getQuestionDraft(questionType);
      if (draft) {
        setOptionsList(draft.options ?? Array(MIN_OPTIONS_AMOUNT).fill("")); // MC questions
        setCategoriesList(draft.categories ?? []);
        setCurrentProject(
          !isNil(draft.default_project) &&
            isNil(tournament_id) &&
            isNil(community_id)
            ? ([...tournaments, siteMain].filter(
                (x) => x.id === draft.default_project
              )[0] as Tournament)
            : defaultProject
        );
        // Convert the draft to the correct type expected by the form
        form.reset(convertDraftToFormSchema(draft));
      }
      setTimeout(() => {
        isDraftMounted.current = true;
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update draft when form values change
  useEffect(() => {
    const subscription = form.watch(() => {
      if (shouldUseDraftValue && isDraftMounted.current) {
        debouncedHandleFormChange();
      }
    });
    return () => subscription.unsubscribe();
  }, [form, shouldUseDraftValue, debouncedHandleFormChange]);

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
        className="mt-4 flex w-full flex-col gap-6"
      >
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
        {(questionType === QuestionType.Numeric ||
          questionType === QuestionType.Discrete) && (
          <InputContainer
            labelText={t("questionUnit")}
            explanation={t("questionUnitDescription")}
          >
            <Input
              {...form.register("unit")}
              errors={(form.formState.errors as UnitFieldErrors).unit}
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
            control={form.control as unknown as Control<FieldValues>}
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
            control={form.control as unknown as Control<FieldValues>}
            name={"resolution_criteria"}
            defaultValue={post?.question?.resolution_criteria}
            errors={form.formState.errors.resolution_criteria}
            withCodeBlocks
          />
        </InputContainer>
        <InputContainer
          labelText={t("finePrint")}
          explanation={t("finePrintDescription")}
          isNativeFormControl={false}
        >
          <MarkdownEditorField
            control={form.control as unknown as Control<FieldValues>}
            name={"fine_print"}
            defaultValue={post?.question?.fine_print}
            errors={form.formState.errors.fine_print}
            withCodeBlocks
          />
        </InputContainer>

        {ContinuousQuestionTypes.some((type) => type === questionType) && (
          <NumericQuestionInput
            draftKey={shouldUseDraftValue ? questionType : undefined}
            questionType={questionType as ContinuousQuestionType}
            defaultMin={post?.question?.scaling.range_min ?? undefined}
            defaultMax={post?.question?.scaling.range_max ?? undefined}
            defaultZeroPoint={post?.question?.scaling.zero_point}
            defaultOpenLowerBound={post?.question?.open_lower_bound}
            defaultOpenUpperBound={post?.question?.open_upper_bound}
            defaultInboundOutcomeCount={post?.question?.inbound_outcome_count}
            hasForecasts={hasForecasts && mode !== "create"}
            unit={post?.question?.unit}
            control={form as unknown as UseFormReturn<FieldValues>}
            onChange={({
              range_min,
              range_max,
              zero_point,
              open_upper_bound,
              open_lower_bound,
              inbound_outcome_count,
            }) => {
              form.setValue("scaling", {
                range_min,
                range_max,
                zero_point,
              });
              form.setValue("open_lower_bound", open_lower_bound);
              form.setValue("open_upper_bound", open_upper_bound);
              form.setValue("inbound_outcome_count", inbound_outcome_count);
            }}
          />
        )}

        {questionType === QuestionType.MultipleChoice && (
          <>
            <InputContainer
              labelText={t("groupVariable")}
              explanation={t("groupVariableDescription")}
            >
              <Input
                {...form.register("group_variable")}
                errors={
                  (form.formState.errors as GroupVarFieldErrors).group_variable
                }
                defaultValue={post?.question?.group_variable}
                className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
              />
            </InputContainer>
            <div className="flex-col">
              <InputContainer
                labelText={t("choices")}
                explanation={optionsLocked ? t("choicesLockedHelp") : undefined}
              />
              {optionsList && (
                <div className="flex flex-col">
                  {optionsList.map((option, opt_index) => (
                    <div key={opt_index} className="flex">
                      <div className="w-full">
                        <Input
                          {...form.register(`options.${opt_index}`)}
                          readOnly={optionsLocked}
                          className="my-2 w-full min-w-32 rounded border  border-gray-500 p-2 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
                          value={option}
                          placeholder={`Option ${opt_index + 1}`}
                          onChange={(e) => {
                            if (optionsLocked) {
                              return;
                            }
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
                            (form.formState.errors as OptionsFieldErrors)
                              .options?.[opt_index] as ErrorResponse | undefined
                          }
                        />
                      </div>
                      {opt_index >= MIN_OPTIONS_AMOUNT && !optionsLocked && (
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
                disabled={optionsLocked}
                onClick={() => setOptionsList([...optionsList, ""])}
              >
                + {t("addOption")}
              </Button>
            </div>
          </>
        )}
        <div className="flex w-full flex-col gap-4 md:flex-row">
          <InputContainer
            labelText={"Closing Time"}
            explanation={t("closingTimeDescription")}
            className="w-full gap-2"
          >
            <DateInput
              control={form.control as unknown as Control<FieldValues>}
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
              control={form.control as unknown as Control<FieldValues>}
              name="scheduled_resolve_time"
              defaultValue={post?.question?.scheduled_resolve_time}
              errors={form.formState.errors.scheduled_resolve_time}
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
                control={form.control as unknown as Control<FieldValues>}
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
                control={form.control as unknown as Control<FieldValues>}
                name="published_at"
                defaultValue={post?.published_at}
                errors={form.formState.errors.published_at}
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
                control={form.control as unknown as Control<FieldValues>}
                name="cp_reveal_time"
                defaultValue={post?.question?.cp_reveal_time}
                errors={form.formState.errors.cp_reveal_time}
                className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
              />
            </InputContainer>
          </div>
          {!community_id &&
            defaultProject.type !== TournamentType.Community && (
              <ProjectPickerInput
                tournaments={tournaments}
                siteMain={siteMain}
                currentProject={currentProject}
                onChange={(project) => {
                  form.setValue("default_project", project.id);
                }}
              />
            )}

          <InputContainer
            labelText="Include Bots in Aggregates"
            explanation="When enabled, bot forecasts will be included in aggregate calculations for this question."
            isNativeFormControl={false}
            className="mb-6"
          >
            <Checkbox
              label="Include Bots in Aggregates"
              defaultChecked={post?.question?.include_bots_in_aggregates ?? false}
              onChange={(checked) => {
                form.setValue("include_bots_in_aggregates", checked);
              }}
            />
          </InputContainer>
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
