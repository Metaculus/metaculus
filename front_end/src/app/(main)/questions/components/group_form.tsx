"use client";

import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import { forEach } from "lodash";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import GroupFormBulkModal, {
  BulkBulkQuestionAttrs,
} from "@/app/(main)/questions/components/group_form_bulk_modal";
import ProjectPickerInput from "@/app/(main)/questions/components/project_picker_input";
import Button from "@/components/ui/button";
import DatetimeUtc from "@/components/ui/datetime_utc";
import { FormErrorMessage, Input, Textarea } from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { MarkdownText } from "@/components/ui/markdown_text";
import {
  Category,
  Post,
  PostStatus,
  PostWithForecasts,
  ProjectPermissions,
} from "@/types/post";
import {
  Tournament,
  TournamentPreview,
  TournamentType,
} from "@/types/projects";
import { QuestionType } from "@/types/question";
import { logErrorWithScope } from "@/utils/errors";
import { getPostLink } from "@/utils/navigation";
import { extractQuestionGroupName } from "@/utils/questions";

import BacktoCreate from "./back_to_create";
import CategoryPicker from "./category_picker";
import NumericQuestionInput from "./numeric_question_input";
import { createQuestionPost, updatePost } from "../actions";

type PostCreationData = {
  group_of_questions: any;
  title: string;
  url_title: string;
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
    url_title: z.string().min(1, { message: t("errorRequired") }),
    group_variable: z.string().max(200, {
      message: t("errorMaxLength", { field: "String", maxLength: 200 }),
    }),
    description: z.string().min(10, {
      message: t("errorMinLength", { field: "String", minLength: 10 }),
    }),
    resolution_criteria: z.string().min(1, { message: t("errorRequired") }),
    fine_print: z.string(),
    default_project: z.nullable(z.union([z.number(), z.string()])),
  });
};

type Props = {
  subtype: "binary" | "numeric" | "date";
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
  const [isLoading, setIsLoading] = useState<boolean>();
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [error, setError] = useState<
    (Error & { digest?: string }) | string | undefined
  >();

  const defaultProject = post
    ? post.projects.default_project
    : tournament_id
      ? [...tournaments, siteMain].filter((x) => x.id === tournament_id)[0]
      : siteMain;

  const submitQuestion = async (data: any) => {
    setIsLoading(true);
    setError(undefined);

    if (control.getValues("default_project") === "") {
      control.setValue("default_project", null);
    }
    const labels = subQuestions.map((q) => q.label);
    if (new Set(labels).size !== labels.length) {
      setError("Duplicate sub question labels");
      return;
    }

    let break_out = false;
    const groupData = subQuestions.map((x) => {
      const subquestionData = {
        id: x.id,
        type: subtype,
        title: `${data["title"]} (${x.label})`,
        scheduled_close_time: x.scheduled_close_time,
        scheduled_resolve_time: x.scheduled_resolve_time,
        open_time: x.open_time,
        cp_reveal_time: x.cp_reveal_time,
      };

      if (subtype === QuestionType.Binary) {
        return subquestionData;
      } else if (subtype === QuestionType.Numeric) {
        if (x.scaling.range_max == null || x.scaling.range_min == null) {
          setError(
            "Please enter a range_max and range_min value for numeric questions"
          );
          break_out = true;
          return;
        }
        return {
          ...subquestionData,
          scaling: x.scaling,
          open_lower_bound: x.openLowerBound,
          open_upper_bound: x.openUpperBound,
        };
      } else if (subtype === QuestionType.Date) {
        if (x.scaling.range_max === null || x.scaling.range_min === null) {
          setError("Please enter a max or min value for numeric questions");
          break_out = true;
          return;
        }
        return {
          ...subquestionData,
          scaling: x.scaling,
          open_lower_bound: x.openLowerBound,
          open_upper_bound: x.openUpperBound,
        };
      } else {
        setError("Invalid sub-question type");
        break_out = true;
        return;
      }
    });

    if (break_out) {
      return;
    }
    const questionToDelete: number[] = [];
    if (post?.group_of_questions?.questions) {
      forEach(post?.group_of_questions.questions, (sq, index) => {
        if (!subQuestions.map((x) => x.id).includes(sq.id)) {
          questionToDelete.push(sq.id);
        }
      });
    }
    let post_data: PostCreationData = {
      title: data["title"],
      url_title: data["url_title"],
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
      const error = e as Error & { digest?: string };
      logErrorWithScope(error, post_data);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const [subQuestions, setSubQuestions] = useState<any[]>(
    post?.group_of_questions?.questions
      ? post?.group_of_questions?.questions.map((x) => {
          return {
            id: x.id,
            scheduled_close_time: x.scheduled_close_time,
            scheduled_resolve_time: x.scheduled_resolve_time,
            open_time: x.open_time,
            cp_reveal_time: x.cp_reveal_time,
            label: extractQuestionGroupName(x.title),
            scaling: x.scaling,
          };
        })
      : []
  );
  const [categoriesList, setCategoriesList] = useState<Category[]>(
    post?.projects.category ? post?.projects.category : ([] as Category[])
  );
  const [collapsedSubQuestions, setCollapsedSubQuestions] = useState<any[]>(
    subQuestions.map((x) => true)
  );
  const groupQuestionSchema = createGroupQuestionSchema(t);
  const control = useForm({
    mode: "all",
    // @ts-ignore
    resolver: zodResolver(groupQuestionSchema),
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
        className="mt-4 flex w-full flex-col gap-4 rounded"
      >
        {!community_id && defaultProject.type !== TournamentType.Community && (
          <ProjectPickerInput
            tournaments={tournaments}
            siteMain={siteMain}
            currentProject={defaultProject}
            onChange={(project) => {
              control.setValue("default_project", project.id);
            }}
          />
        )}
        <InputContainer
          labelText={t("longTitle")}
          explanation={t("longTitleExplanation")}
        >
          <Textarea
            {...control.register("title")}
            errors={control.formState.errors.title}
            defaultValue={post?.title}
            className="min-h-36 rounded border border-gray-500 p-5 text-xl font-normal dark:border-gray-500-dark dark:bg-blue-50-dark"
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
            className={
              "rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
            }
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
            defaultValue={post?.group_of_questions?.description}
          />
        </InputContainer>
        <InputContainer
          labelText={t("groupVariable")}
          explanation={t("groupVariableDescription")}
        >
          <Input
            {...control.register("group_variable")}
            errors={control.formState.errors.group_variable}
            defaultValue={post?.group_of_questions?.group_variable}
            className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
          />
        </InputContainer>
        <InputContainer
          labelText={t("resolutionCriteria")}
          explanation={t.rich("resolutionCriteriaExplanation", {
            markdown: (chunks) => <MarkdownText>{chunks}</MarkdownText>,
          })}
        >
          <Textarea
            {...control.register("resolution_criteria")}
            errors={control.formState.errors.resolution_criteria}
            className="h-32 w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
            defaultValue={
              post?.group_of_questions?.resolution_criteria
                ? post?.group_of_questions?.resolution_criteria
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
            className="h-32 w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
            defaultValue={
              post?.group_of_questions?.fine_print
                ? post?.group_of_questions?.fine_print
                : undefined
            }
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

          {subQuestions.map((subQuestion, index) => {
            const subquestionHasForecasts =
              (subQuestion.aggregations?.recency_weighted?.history?.length ??
                0) > 0;
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
                    <div className="flex flex-row gap-4">
                      <InputContainer
                        labelText={t("closingDate")}
                        className="w-full"
                      >
                        <DatetimeUtc
                          readOnly={
                            subquestionHasForecasts && mode !== "create"
                          }
                          className="rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
                          defaultValue={subQuestion.scheduled_close_time}
                          onChange={(value) => {
                            setSubQuestions(
                              subQuestions.map((subQuestion, iter_index) => {
                                if (index === iter_index) {
                                  subQuestion.scheduled_close_time = value;
                                }
                                return subQuestion;
                              })
                            );
                          }}
                        />
                      </InputContainer>
                      <InputContainer
                        labelText={t("resolvingDate")}
                        className="w-full"
                      >
                        <DatetimeUtc
                          readOnly={
                            subquestionHasForecasts && mode !== "create"
                          }
                          className="rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
                          defaultValue={subQuestion.scheduled_resolve_time}
                          onChange={(value) => {
                            setSubQuestions(
                              subQuestions.map((subQuestion, iter_index) => {
                                if (index === iter_index) {
                                  subQuestion.scheduled_resolve_time = value;
                                }
                                return subQuestion;
                              })
                            );
                          }}
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
                        // @ts-ignore
                        questionType={subtype}
                        defaultMin={subQuestion.scaling.range_min}
                        defaultMax={subQuestion.scaling.range_max}
                        // @ts-ignore
                        defaultOpenLowerBound={subQuestion.open_lower_bound}
                        // @ts-ignore
                        defaultOpenUpperBound={subQuestion.open_upper_bound}
                        defaultZeroPoint={subQuestion.zero_point}
                        hasForecasts={
                          subquestionHasForecasts && mode !== "create"
                        }
                        canSeeLogarithmic={
                          post?.user_permission === ProjectPermissions.ADMIN ||
                          !post
                        }
                        onChange={(
                          range_min,
                          range_max,
                          openLowerBound,
                          openUpperBound,
                          zeroPoint
                        ) => {
                          setSubQuestions(
                            subQuestions.map((subQuestion, iter_index) => {
                              if (index === iter_index) {
                                subQuestion.scaling = {
                                  range_min: range_min,
                                  range_max: range_max,
                                  zero_point: zeroPoint,
                                };
                                subQuestion["openLowerBound"] = openLowerBound;
                                subQuestion["openUpperBound"] = openUpperBound;
                              }
                              return subQuestion;
                            })
                          );
                        }}
                      />
                    )}
                  </div>
                )}

                <div className="flex justify-between">
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
                if (subtype === "numeric") {
                  setSubQuestions([
                    ...subQuestions,
                    {
                      type: "numeric",
                      label: "",
                      scheduled_close_time:
                        control.getValues().scheduled_close_time,
                      scheduled_resolve_time:
                        control.getValues().scheduled_resolve_time,
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
                        control.getValues().scheduled_close_time,
                      scheduled_resolve_time:
                        control.getValues().scheduled_resolve_time,
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
                        control.getValues().scheduled_close_time,
                      scheduled_resolve_time:
                        control.getValues().scheduled_resolve_time,
                    },
                  ]);
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
