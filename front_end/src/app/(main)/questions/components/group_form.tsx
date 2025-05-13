"use client";

import {
  faChevronDown,
  faChevronUp,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import { forEach, isNil } from "lodash";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import GroupFormBulkModal, {
  BulkBulkQuestionAttrs,
} from "@/app/(main)/questions/components/group_form_bulk_modal";
import ProjectPickerInput from "@/app/(main)/questions/components/project_picker_input";
import Button from "@/components/ui/button";
import DatetimeUtc from "@/components/ui/datetime_utc";
import {
  FormError,
  FormErrorMessage,
  Input,
  MarkdownEditorField,
  Textarea,
} from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { MarkdownText } from "@/components/ui/markdown_text";
import Select from "@/components/ui/select";
import { useDebouncedCallback } from "@/hooks/use_debounce";
import {
  Category,
  Post,
  PostGroupOfQuestionsSubquestionsOrder,
  PostStatus,
  PostWithForecasts,
} from "@/types/post";
import {
  Tournament,
  TournamentPreview,
  TournamentType,
} from "@/types/projects";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { logError } from "@/utils/core/errors";
import {
  deleteQuestionDraft,
  getQuestionDraft,
  saveQuestionDraft,
  QUESTION_DRAFT_DEBOUNCE_TIME,
} from "@/utils/drafts/questionForm";
import { getPostLink } from "@/utils/navigation";
import { sortGroupPredictionOptions } from "@/utils/questions/groupOrdering";

import BacktoCreate from "./back_to_create";
import CategoryPicker from "./category_picker";
import NumericQuestionInput from "./numeric_question_input";
import { createQuestionPost, updatePost } from "../actions";

type PostCreationData = {
  group_of_questions: any;
  title: string;
  short_title: string;
  categories: number[];
  default_project: number;
};

const createGroupQuestionSchema = (t: ReturnType<typeof useTranslations>) => {
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
      .max(80, {
        message: t("errorMaxLength", { field: "String", maxLength: 80 }),
      }),
    group_variable: z.string().max(200, {
      message: t("errorMaxLength", { field: "String", maxLength: 200 }),
    }),
    description: z.string().min(10, {
      message: t("errorMinLength", { field: "String", minLength: 10 }),
    }),
    resolution_criteria: z.string().min(1, { message: t("errorRequired") }),
    fine_print: z.string().optional(),
    default_project: z.nullable(z.union([z.number(), z.string()])),
    subquestions_order: z
      .union([
        z.literal(PostGroupOfQuestionsSubquestionsOrder.MANUAL),
        z.literal(PostGroupOfQuestionsSubquestionsOrder.CP_ASC),
        z.literal(PostGroupOfQuestionsSubquestionsOrder.CP_DESC),
      ])
      .optional(),
  });
};

type SupportedType =
  | QuestionType.Binary
  | QuestionType.Numeric
  | QuestionType.Date
  | string;

type Props = {
  subtype: SupportedType;
  tournament_id?: number;
  community_id?: number;
  post?: PostWithForecasts | null;
  mode: "create" | "edit";
  allCategories: Category[];
  tournaments: TournamentPreview[];
  siteMain: Tournament;
};

const GroupForm: React.FC<Props> = ({
  subtype,
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
  const isDraftMounted = useRef(false);
  const draftKey = `group_${subtype}`;
  const [isLoading, setIsLoading] = useState<boolean>();
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [error, setError] = useState<
    (Error & { digest?: string }) | string | undefined
  >();

  const defaultProject = post
    ? post.projects.default_project
    : tournament_id
      ? ([...tournaments, siteMain].filter(
          (x) => x.id === tournament_id
        )[0] as Tournament)
      : siteMain;
  const [currentProject, setCurrentProject] =
    useState<Tournament>(defaultProject);

  const submitQuestion = async (data: any) => {
    setIsLoading(true);
    setError(undefined);

    if (form.getValues("default_project") === "") {
      form.setValue("default_project", null);
    }
    const labels = subQuestions.map((q) => q.label);
    if (new Set(labels).size !== labels.length) {
      setError(t("duplicateSubQuestionLabel"));
      setIsLoading(false);
      return;
    }

    if (subQuestions.length === 0) {
      setError(t("postCreateErrorMinSubquestions"));
      setIsLoading(false);
      return;
    }

    let break_out = false;
    const groupData = subQuestions.map((x) => {
      const subquestionData = {
        id: x.id,
        type: subtype,
        title: `${data["title"]} (${x.label})`,
        label: x.label,
        scheduled_close_time: x.scheduled_close_time,
        scheduled_resolve_time: x.scheduled_resolve_time,
        open_time: x.open_time,
        cp_reveal_time: x.cp_reveal_time,
        group_rank: x.group_rank,
      };

      if (!x.scheduled_close_time || !x.scheduled_resolve_time) {
        setError("Please enter a closing and resolving date");
        break_out = true;
        return;
      }
      if (subtype === QuestionType.Binary) {
        return subquestionData;
      } else if (subtype === QuestionType.Numeric) {
        if (isNil(x.scaling?.range_max) || isNil(x.scaling?.range_min)) {
          setError(
            "Please enter a range_max and range_min value for numeric questions"
          );
          break_out = true;
          return;
        }
        return {
          ...subquestionData,
          unit: x.unit,
          scaling: x.scaling,
          open_lower_bound: x.open_lower_bound,
          open_upper_bound: x.open_upper_bound,
        };
      } else if (subtype === QuestionType.Date) {
        if (isNil(x.scaling?.range_max) || isNil(x.scaling?.range_min)) {
          setError(
            "Please enter a range_max and range_min value for date questions"
          );
          break_out = true;
          return;
        }
        return {
          ...subquestionData,
          scaling: x.scaling,
          open_lower_bound: x.open_lower_bound,
          open_upper_bound: x.open_upper_bound,
        };
      } else {
        setError("Invalid sub-question type");
        return;
      }
    });

    if (break_out) {
      setIsLoading(false);
      return;
    }
    const questionToDelete: number[] = [];
    if (post?.group_of_questions?.questions) {
      forEach(post?.group_of_questions.questions, (sq) => {
        if (!subQuestions.map((x) => x.id).includes(sq.id)) {
          questionToDelete.push(sq.id);
        }
      });
    }
    const post_data: PostCreationData = {
      title: data["title"],
      short_title: data["short_title"],
      default_project: data["default_project"],
      categories: categoriesList.map((x) => x.id),
      group_of_questions: {
        delete: questionToDelete,
        title: data["title"],
        fine_print: data["fine_print"],
        resolution_criteria: data["resolution_criteria"],
        description: data["description"],
        group_variable: data["group_variable"],
        questions: groupData,
        subquestions_order: data["subquestions_order"],
      },
    };
    let resp: { post: Post };
    try {
      if (mode === "edit" && post) {
        resp = await updatePost(post.id, post_data);
      } else {
        resp = await createQuestionPost(post_data);
        deleteQuestionDraft(draftKey);
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

  const [subQuestions, setSubQuestions] = useState<any[]>(() => {
    const initialSubQuestions = post?.group_of_questions?.questions
      ? sortGroupPredictionOptions(
          post?.group_of_questions?.questions as QuestionWithNumericForecasts[],
          post?.group_of_questions
        )
      : [];

    return initialSubQuestions.map((x, idx) => {
      return {
        id: x.id,
        scheduled_close_time: x.scheduled_close_time,
        scheduled_resolve_time: x.scheduled_resolve_time,
        open_time: x.open_time,
        cp_reveal_time: x.cp_reveal_time,
        label: x.label,
        unit: x.unit,
        scaling: x.scaling,
        open_lower_bound: x.open_lower_bound,
        open_upper_bound: x.open_upper_bound,
        has_forecasts: (x.nr_forecasters || 0) > 0,
        group_rank: x.group_rank ?? idx,
      };
    });
  });

  const [categoriesList, setCategoriesList] = useState<Category[]>(
    post?.projects.category ? post?.projects.category : ([] as Category[])
  );
  const [collapsedSubQuestions, setCollapsedSubQuestions] = useState<boolean[]>(
    subQuestions.map(() => true)
  );
  const groupQuestionSchema = createGroupQuestionSchema(t);
  const form = useForm<any>({
    mode: "all",
    resolver: zodResolver(groupQuestionSchema),
    defaultValues: {
      subquestions_order:
        post?.group_of_questions?.subquestions_order ??
        PostGroupOfQuestionsSubquestionsOrder.MANUAL,
    },
  });

  const questionSubtypeDisplayMap: Record<
    string,
    { title: string; description: string }
  > = {
    binary: {
      title: t("binaryQuestionGroup"),
      description: t("binaryQuestionGroupDescription"),
    },
    numeric: {
      title: t("numericQuestionGroup"),
      description: t("numericQuestionGroupDescription"),
    },
    date: {
      title: t("dateQuestionGroup"),
      description: t("dateQuestionGroupDescription"),
    },
  };

  const { title: formattedQuestionType, description: questionDescription } =
    questionSubtypeDisplayMap[subtype] || { title: subtype, description: "" };

  const onBulkEdit = (attrs: BulkBulkQuestionAttrs) => {
    setSubQuestions(
      subQuestions.map((subQuestion) => ({
        ...subQuestion,
        ...attrs,
      }))
    );
  };

  const isEditingActivePost =
    mode == "edit" && post?.curation_status == PostStatus.APPROVED;

  /**
   * Shifts an element in an array by a specified number of positions
   */
  const shiftArrayElement = <T,>(
    array: T[],
    index: number,
    shift: number
  ): T[] => {
    // Return original array if shift is not possible or zero
    if (
      shift === 0 ||
      (shift < 0 && index + shift < 0) ||
      (shift > 0 && index + shift >= array.length)
    ) {
      return [...array];
    }

    const newArray = [...array];
    const targetIndex = index + shift;

    // Remove the element and insert it at the target position
    const element = newArray[index];
    if (element !== undefined) {
      newArray.splice(index, 1);
      newArray.splice(targetIndex, 0, element);
    }

    return newArray;
  };

  useEffect(() => {
    if (mode === "create") {
      const draft = getQuestionDraft(draftKey);
      if (draft) {
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
        setSubQuestions(draft.subQuestions ?? []);
        setCollapsedSubQuestions(
          [...(draft.subQuestions ?? [])].map(() => true)
        );
        form.reset(draft);
      }
      const timeout = setTimeout(() => {
        isDraftMounted.current = true;
      }, QUESTION_DRAFT_DEBOUNCE_TIME);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormChange = useCallback(() => {
    if (mode === "create") {
      const formData = form.getValues();
      saveQuestionDraft(draftKey, {
        ...formData,
        categories: categoriesList,
        subQuestions: subQuestions,
      });
    }
  }, [form, mode, categoriesList, subQuestions, draftKey]);

  const debouncedHandleFormChange = useDebouncedCallback(
    handleFormChange,
    QUESTION_DRAFT_DEBOUNCE_TIME
  );

  // update draft when form values changes
  useEffect(() => {
    const subscription = form.watch(() => {
      if (mode === "create" && isDraftMounted.current) {
        debouncedHandleFormChange();
      }
    });
    return () => subscription.unsubscribe();
  }, [form, mode, debouncedHandleFormChange]);

  // update draft when subquestions state changes
  useEffect(() => {
    if (mode === "create" && isDraftMounted.current) {
      debouncedHandleFormChange();
    }
  }, [form, mode, debouncedHandleFormChange, subQuestions]);

  return (
    <main className="mb-4 mt-2 flex max-w-4xl flex-col justify-center self-center rounded-none bg-gray-0 px-4 py-4 pb-5 dark:bg-gray-0-dark md:m-8 md:mx-auto md:rounded-md md:px-8 md:pb-8 lg:m-12 lg:mx-auto">
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
        className="mt-4 flex w-full flex-col gap-4 rounded"
      >
        {!community_id && defaultProject.type !== TournamentType.Community && (
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
          labelText={t("longTitle")}
          explanation={t("longTitleExplanation")}
        >
          <Textarea
            {...form.register("title")}
            errors={form.formState.errors.title}
            defaultValue={post?.title}
            className="min-h-36 rounded border border-gray-500 p-5 text-xl font-normal dark:border-gray-500-dark dark:bg-blue-50-dark"
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
            className={
              "rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
            }
          />
        </InputContainer>
        <InputContainer
          labelText={t("backgroundInformation")}
          isNativeFormControl={false}
          explanation={t.rich("backgroundInfoExplanation", {
            link: (chunks) => <Link href="/help/markdown">{chunks}</Link>,
            markdown: (chunks) => <MarkdownText>{chunks}</MarkdownText>,
          })}
        >
          <MarkdownEditorField
            control={form.control}
            name={"description"}
            defaultValue={post?.group_of_questions?.description}
            errors={form.formState.errors.description}
          />
        </InputContainer>
        <InputContainer
          labelText={t("groupVariable")}
          explanation={t("groupVariableDescription")}
        >
          <Input
            {...form.register("group_variable")}
            errors={form.formState.errors.group_variable}
            defaultValue={post?.group_of_questions?.group_variable}
            className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
          />
        </InputContainer>
        <InputContainer
          labelText={t("resolutionCriteria")}
          isNativeFormControl={false}
          explanation={t.rich("resolutionCriteriaExplanation", {
            markdown: (chunks) => <MarkdownText>{chunks}</MarkdownText>,
          })}
        >
          <MarkdownEditorField
            control={form.control}
            name={"resolution_criteria"}
            defaultValue={post?.group_of_questions?.resolution_criteria}
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
            defaultValue={post?.group_of_questions?.fine_print}
            errors={form.formState.errors.fine_print}
          />
        </InputContainer>
        <InputContainer
          labelText={t("categories")}
          explanation={t("categoryPickerDescription")}
        >
          <CategoryPicker
            allCategories={allCategories}
            categories={categoriesList}
            onChange={(categories) => {
              setCategoriesList(categories);
            }}
          />
        </InputContainer>
        <div className="flex flex-col gap-4 rounded border bg-gray-200 p-4 dark:bg-gray-200-dark">
          <h4 className="m-0 capitalize">{t("subquestions")}</h4>
          <InputContainer
            labelText={t("groupSorting")}
            explanation={t("groupSortingDescription")}
          >
            <Select
              className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
              options={[
                {
                  value: PostGroupOfQuestionsSubquestionsOrder.MANUAL,
                  label: t("manualSubquestionOrder"),
                },
                {
                  value: PostGroupOfQuestionsSubquestionsOrder.CP_ASC,
                  label: t("cpAscendingSubquestionOrder"),
                },
                {
                  value: PostGroupOfQuestionsSubquestionsOrder.CP_DESC,
                  label: t("cpDescendingSubquestionOrder"),
                },
              ]}
              {...form.register("subquestions_order")}
              defaultValue={
                post?.group_of_questions?.subquestions_order ??
                PostGroupOfQuestionsSubquestionsOrder.MANUAL
              }
            />
          </InputContainer>
          {subQuestions.map((subQuestion, index) => {
            return (
              <div
                key={index}
                className="flex w-full flex-col gap-4 rounded border bg-gray-0 p-4 dark:bg-gray-0-dark"
              >
                <InputContainer
                  labelText={
                    collapsedSubQuestions[index]
                      ? t("subquestionLabel")
                      : undefined
                  }
                  explanation={
                    collapsedSubQuestions[index]
                      ? t("subquestionLabelDescription")
                      : undefined
                  }
                >
                  <Input
                    onChange={(e) => {
                      setSubQuestions(
                        subQuestions.map((subQuestion, iter_index) => {
                          if (index === iter_index) {
                            subQuestion["label"] = e.target.value;
                          }
                          return subQuestion;
                        })
                      );
                    }}
                    className="rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
                    value={subQuestion?.label}
                  />
                </InputContainer>
                {collapsedSubQuestions[index] && (
                  <div className="flex w-full flex-col gap-4">
                    {subtype === QuestionType.Numeric && (
                      <InputContainer
                        labelText={t("subquestionUnit")}
                        explanation={t("questionUnitDescription")}
                      >
                        <Input
                          onChange={(e) => {
                            setSubQuestions(
                              subQuestions.map((subQuestion, iter_index) => {
                                if (index === iter_index)
                                  subQuestion.unit = e.target.value;
                                return subQuestion;
                              })
                            );
                          }}
                          className="rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
                          value={subQuestion?.unit ?? ""}
                        />
                      </InputContainer>
                    )}
                    <div className="flex flex-col gap-4 md:flex-row">
                      <InputContainer
                        labelText={t("closingDate")}
                        className="w-full"
                      >
                        <DatetimeUtc
                          className="rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
                          defaultValue={subQuestion.scheduled_close_time}
                          onChange={(value) => {
                            form.clearErrors(
                              `subQuestion-${index}-scheduled_close_time`
                            );
                            setSubQuestions(
                              subQuestions.map((subQuestion, iter_index) => {
                                if (index === iter_index) {
                                  subQuestion.scheduled_close_time = value;
                                }
                                return subQuestion;
                              })
                            );
                          }}
                          onError={(error: { message: string }) => {
                            form.setError(
                              `subQuestion-${index}-scheduled_close_time`,
                              {
                                type: "manual",
                                message: error.message,
                              }
                            );
                          }}
                        />
                        <FormError
                          errors={
                            form.formState.errors[
                              `subQuestion-${index}-scheduled_close_time`
                            ]
                          }
                          name={`subQuestion-${index}-scheduled_close_time`}
                        />
                      </InputContainer>
                      <InputContainer
                        labelText={t("resolvingDate")}
                        className="w-full"
                      >
                        <DatetimeUtc
                          className="rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
                          defaultValue={subQuestion.scheduled_resolve_time}
                          onChange={(value) => {
                            form.clearErrors(
                              `subQuestion-${index}-scheduled_resolve_time`
                            );
                            setSubQuestions(
                              subQuestions.map((subQuestion, iter_index) => {
                                if (index === iter_index) {
                                  subQuestion.scheduled_resolve_time = value;
                                }
                                return subQuestion;
                              })
                            );
                          }}
                          onError={(error: { message: string }) => {
                            form.setError(
                              `subQuestion-${index}-scheduled_resolve_time`,
                              {
                                type: "manual",
                                message: error.message,
                              }
                            );
                          }}
                        />
                        <FormError
                          errors={
                            form.formState.errors[
                              `subQuestion-${index}-scheduled_resolve_time`
                            ]
                          }
                          name={`subQuestion-${index}-scheduled_resolve_time`}
                        />
                      </InputContainer>
                    </div>
                    {isEditingActivePost && (
                      <div className="flex flex-row gap-4">
                        <InputContainer
                          labelText={t("openTime")}
                          className="w-full"
                        >
                          <DatetimeUtc
                            className="rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
                            defaultValue={subQuestion.open_time}
                            onChange={(value) => {
                              setSubQuestions(
                                subQuestions.map((subQuestion, iter_index) => {
                                  if (index === iter_index) {
                                    subQuestion.open_time = value;
                                  }
                                  return subQuestion;
                                })
                              );
                            }}
                          />
                        </InputContainer>
                        <InputContainer
                          labelText={t("cpRevealTime")}
                          className="w-full"
                        >
                          <DatetimeUtc
                            className="rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
                            defaultValue={subQuestion.cp_reveal_time}
                            onChange={(value) => {
                              setSubQuestions(
                                subQuestions.map((subQuestion, iter_index) => {
                                  if (index === iter_index) {
                                    subQuestion.cp_reveal_time = value;
                                  }
                                  return subQuestion;
                                })
                              );
                            }}
                          />
                        </InputContainer>
                      </div>
                    )}
                    {(subtype === QuestionType.Date ||
                      subtype === QuestionType.Numeric) && (
                      <NumericQuestionInput
                        draftKey={draftKey}
                        questionType={subtype}
                        defaultMin={subQuestion.scaling.range_min}
                        defaultMax={subQuestion.scaling.range_max}
                        defaultOpenLowerBound={subQuestion.open_lower_bound}
                        defaultOpenUpperBound={subQuestion.open_upper_bound}
                        defaultZeroPoint={subQuestion.scaling.zero_point}
                        hasForecasts={
                          subQuestion.has_forecasts && mode !== "create"
                        }
                        onChange={({
                          min: range_min,
                          max: range_max,
                          open_lower_bound,
                          open_upper_bound,
                          zero_point,
                        }) => {
                          setSubQuestions(
                            subQuestions.map((subQuestion, iter_index) =>
                              index === iter_index
                                ? {
                                    ...subQuestion,
                                    open_lower_bound,
                                    open_upper_bound,
                                    scaling: {
                                      range_min,
                                      range_max,
                                      zero_point,
                                    },
                                  }
                                : subQuestion
                            )
                          );
                        }}
                        control={form}
                        index={index}
                      />
                    )}
                  </div>
                )}

                <div className="flex justify-between">
                  <div className="flex flex-row gap-2">
                    <Button
                      size="sm"
                      variant="tertiary"
                      onClick={() => {
                        setCollapsedSubQuestions(
                          collapsedSubQuestions.map((x, iter_index) => {
                            if (iter_index === index) {
                              return !x;
                            }
                            return x;
                          })
                        );
                      }}
                    >
                      {collapsedSubQuestions[index] === false
                        ? "Expand"
                        : "Collapse"}
                    </Button>

                    <Button
                      size="sm"
                      variant="tertiary"
                      disabled={index === 0}
                      onClick={() => {
                        setSubQuestions(
                          shiftArrayElement(subQuestions, index, -1).map(
                            (q, idx) => ({ ...q, group_rank: idx })
                          )
                        );
                        setCollapsedSubQuestions(
                          shiftArrayElement(collapsedSubQuestions, index, -1)
                        );
                      }}
                    >
                      <FontAwesomeIcon icon={faChevronUp} />
                    </Button>
                    <Button
                      size="sm"
                      variant="tertiary"
                      disabled={index === subQuestions.length - 1}
                      onClick={() => {
                        setSubQuestions(
                          shiftArrayElement(subQuestions, index, 1).map(
                            (q, idx) => ({ ...q, group_rank: idx })
                          )
                        );
                        setCollapsedSubQuestions(
                          shiftArrayElement(collapsedSubQuestions, index, 1)
                        );
                      }}
                    >
                      <FontAwesomeIcon icon={faChevronDown} />
                    </Button>
                  </div>

                  <Button
                    size="md"
                    presentationType="icon"
                    variant="tertiary"
                    className="border-red-200 text-red-400 hover:border-red-400 active:border-red-600 active:bg-red-100/50 dark:border-red-400/50 dark:text-red-400 dark:hover:border-red-400 dark:active:border-red-300/75 dark:active:bg-red-400/15"
                    onClick={() => {
                      setSubQuestions(
                        subQuestions.filter(
                          (subQuestion, iter_index) => index !== iter_index
                        )
                      );
                      setCollapsedSubQuestions(
                        collapsedSubQuestions.filter(
                          (_, iter_index) => index !== iter_index
                        )
                      );
                    }}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </div>
              </div>
            );
          })}
          <div className="flex justify-between">
            <Button
              onClick={() => {
                if (subQuestions.length > 0) {
                  // Clone subquestion attributes from the previous one
                  setSubQuestions([
                    ...subQuestions,
                    {
                      ...subQuestions[subQuestions.length - 1],
                      has_forecasts: false,
                      id: undefined,
                      label: "",
                    },
                  ]);
                } else {
                  if (subtype === "numeric") {
                    setSubQuestions([
                      ...subQuestions,
                      {
                        type: "numeric",
                        label: "",
                        scheduled_close_time:
                          form.getValues().scheduled_close_time,
                        scheduled_resolve_time:
                          form.getValues().scheduled_resolve_time,
                        scaling: {
                          range_min: null,
                          range_max: null,
                          zero_point: null,
                        },
                        open_lower_bound: null,
                        open_upper_bound: null,
                      },
                    ]);
                  } else if (subtype === "date") {
                    setSubQuestions([
                      ...subQuestions,
                      {
                        type: "date",
                        label: "",
                        scheduled_close_time:
                          form.getValues().scheduled_close_time,
                        scheduled_resolve_time:
                          form.getValues().scheduled_resolve_time,
                        scaling: {
                          range_min: null,
                          range_max: null,
                          zero_point: null,
                        },
                        open_lower_bound: null,
                        open_upper_bound: null,
                      },
                    ]);
                  } else {
                    setSubQuestions([
                      ...subQuestions,
                      {
                        type: "binary",
                        label: "",
                        scheduled_close_time:
                          form.getValues().scheduled_close_time,
                        scheduled_resolve_time:
                          form.getValues().scheduled_resolve_time,
                      },
                    ]);
                  }
                }
                setCollapsedSubQuestions([...collapsedSubQuestions, true]);
              }}
              className="w-fit capitalize"
            >
              <FontAwesomeIcon icon={faPlus} />
              {t("newSubquestion")}
            </Button>
            <Button
              className="w-fit capitalize"
              onClick={() => setIsBulkModalOpen(true)}
              variant="link"
            >
              {t("bulkEdit")}
            </Button>
          </div>
        </div>

        <div className="flex-col">
          <div className="-mt-2 min-h-[32px] flex-col">
            {isLoading && <LoadingIndicator />}
            {!isLoading && (
              <FormErrorMessage
                errors={typeof error === "string" ? error : error?.digest}
              />
            )}
          </div>
          <Button
            type="submit"
            className="w-max capitalize"
            disabled={isLoading}
          >
            {mode === "create" ? t("createQuestion") : t("editQuestion")}
          </Button>
        </div>
        <GroupFormBulkModal
          isOpen={isBulkModalOpen}
          setIsOpen={setIsBulkModalOpen}
          onSubmit={onBulkEdit}
          fields={[
            "scheduled_close_time",
            "scheduled_resolve_time",
            ...(isEditingActivePost
              ? (["open_time", "cp_reveal_time"] as const)
              : []),
          ]}
        />
      </form>
    </main>
  );
};

export default GroupForm;
