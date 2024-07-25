"use client";

import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { forEach } from "lodash";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import Button from "@/components/ui/button";
import { FormError, Input, Textarea } from "@/components/ui/form_field";
import {
  Category,
  PostStatus,
  PostWithForecasts,
  ProjectPermissions,
} from "@/types/post";
import { Tournament } from "@/types/projects";
import { QuestionType } from "@/types/question";

import BacktoCreate from "./back_to_create";
import CategoryPicker from "./category_picker";
import NumericQuestionInput from "./numeric_question_input";
import ProjectPicker from "./project_picker";
import { createQuestionPost, updatePost } from "../actions";

type PostCreationData = {
  group_of_questions: any;
  title: string;
  categories: number[];
  default_project_id: number;
};

const groupQuestionSchema = z.object({
  title: z.string().min(4).max(200),
  url_title: z.string().min(1),
  group_variable: z.string().max(200),
  description: z.string().min(10),
  resolution_criteria_description: z.string().min(1),
  fine_print: z.string(),
  default_project_id: z.nullable(z.union([z.number(), z.string()])),
});

type Props = {
  subtype: "binary" | "numeric" | "date";
  tournament_id?: number;
  post?: PostWithForecasts | null;
  mode: "create" | "edit";
  allCategories: Category[];
  tournaments: Tournament[];
  siteMain: Tournament;
};

const GroupForm: React.FC<Props> = ({
  subtype,
  mode,
  allCategories,
  tournaments,
  siteMain,
  tournament_id = null,
  post = null,
}) => {
  const router = useRouter();
  const t = useTranslations();
  const isLive =
    post?.curation_status == PostStatus.APPROVED ||
    post?.curation_status == PostStatus.OPEN;
  const isDone =
    post?.curation_status == PostStatus.RESOLVED ||
    post?.curation_status == PostStatus.CLOSED ||
    post?.curation_status == PostStatus.DELETED;

  const defaultProject = post
    ? post.projects.default_project
    : tournament_id
      ? [...tournaments, siteMain].filter((x) => x.id === tournament_id)[0]
      : siteMain;

  const submitQuestion = async (data: any) => {
    if (control.getValues("default_project_id") === "") {
      control.setValue("default_project_id", null);
    }
    const labels = subQuestions.map((q) => q.label);
    if (new Set(labels).size !== labels.length) {
      alert("Duplicate sub question labels");
      return;
    }

    let break_out = false;
    const groupData = subQuestions
      .filter((x) => !x.id)
      .map((x) => {
        if (subtype == QuestionType.Binary) {
          return {
            type: subtype,
            title: x.label,
            scheduled_close_time: x.scheduled_close_time,
            scheduled_resolve_time: x.scheduled_resolve_time,
          };
        } else if (subtype == QuestionType.Numeric) {
          if (
            x.range_max == null ||
            x.range_min == null ||
            x.range_max == undefined ||
            x.range_min == undefined
          ) {
            alert(
              "Please enter a range_max or range_min value for numeric questions"
            );
            break_out = true;
            return;
          }
          return {
            type: subtype,
            title: x.label,
            scheduled_close_time: x.scheduled_close_time,
            scheduled_resolve_time: x.scheduled_resolve_time,
            range_min: x.range_min,
            range_max: x.range_max,
            open_lower_bound: x.openLowerBound,
            open_upper_bound: x.openUpperBound,
            zero_point: x.zeroPoint,
          };
        } else if (subtype == QuestionType.Date) {
          if (
            x.range_max == null ||
            x.range_min == null ||
            x.range_max == undefined ||
            x.range_min == undefined
          ) {
            alert("Please enter a max or min value for numeric questions");
            break_out = true;
            return;
          }
          return {
            type: subtype,
            title: x.label,
            scheduled_close_time: x.scheduled_close_time,
            scheduled_resolve_time: x.scheduled_resolve_time,
            range_min: x.range_min,
            range_max: x.range_max,
            open_lower_bound: x.openLowerBound,
            open_upper_bound: x.openUpperBound,
            zero_point: x.zeroPoint,
          };
        } else {
          alert("Invalid sub-question type");
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
      default_project_id: data["default_project_id"],
      categories: categoriesList.map((x) => x.id),
      group_of_questions: {
        delete: questionToDelete,
        title: data["title"],
        fine_print: data["fine_print"],
        resolution_criteria_description:
          data["resolution_criteria_description"],
        description: data["description"],
        group_variable: data["group_variable"],
        questions: groupData,
      },
    };
    if (mode == "edit" && post) {
      const resp = await updatePost(post.id, post_data);
      router.push(`/questions/${resp.post?.id}`);
    } else {
      const resp = await createQuestionPost(post_data);
      router.push(`/questions/${resp.post?.id}`);
    }
  };

  const [subQuestions, setSubQuestions] = useState<any[]>(
    post?.group_of_questions?.questions
      ? post?.group_of_questions?.questions.map((x) => {
          return {
            id: x.id,
            scheduled_close_time: x.scheduled_close_time,
            scheduled_resolve_time: x.scheduled_resolve_time,
            label: x.title,
            range_max: x.range_max,
            range_min: x.range_min,
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

  const control = useForm({
    // @ts-ignore
    resolver: zodResolver(groupQuestionSchema),
  });

  const questionSubtypeDisplayMap: Record<
    string,
    { title: string; description: string }
  > = {
    binary: {
      title: "Binary Question Group",
      description:
        'Binary question groups contain questions that generally have the form "Will X happen?" and resolve as Yes or No.',
    },
    numeric: {
      title: "Numeric Question Group",
      description:
        "Numeric question groups contain questions that ask about the value of an unknown future quantity and resolve within a specified range.",
    },
    date: {
      title: "Date Question Group",
      description:
        "Date question groups contain questions that ask when something will happen and resolve within a specified date range.",
    },
  };

  const { title: formattedQuestionType, description: questionDescription } =
    questionSubtypeDisplayMap[subtype] || { title: subtype, description: "" };

  const inputContainerStyles = "flex flex-col gap-1.5";
  const baseInputStyles =
    "px-3 py-2 text-base border border-gray-500 rounded dark:bg-blue-950";
  const baseTextareaStyles = "border border-gray-500 rounded dark:bg-blue-950";
  const inputLabelStyles = "text-sm font-bold text-gray-600 dark:text-gray-400";
  const inputDescriptionStyles = "text-xs text-gray-700 dark:text-gray-300";
  const markdownStyles =
    "text-xs font-mono pb-0.5 pt-0 px-1 rounded-sm bg-blue-400 dark:bg-yellow-500/25";

  return (
    <div className="mb-4 mt-2 flex max-w-[840px] flex-col justify-center self-center rounded-none bg-white px-4 py-4 pb-5 dark:bg-blue-900 md:m-8 md:mx-auto md:rounded-md md:px-8 md:pb-8 lg:m-12 lg:mx-auto">
      <BacktoCreate
        backText="Create"
        backHref="/questions/create"
        currentPage={formattedQuestionType}
      />
      <p className="mt-0 text-sm text-gray-600 dark:text-gray-300 md:mt-1 md:text-base">
        {questionDescription}
      </p>
      <form
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
        className="mt-4 flex w-[540px] w-full flex-col gap-4 rounded"
      >
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
        <div className={inputContainerStyles}>
          <span className={inputLabelStyles}>Background Information</span>
          <Textarea
            {...control.register("description")}
            errors={control.formState.errors.description}
            className={`${baseTextareaStyles} h-[120px] w-full p-3 text-sm`}
            defaultValue={post?.group_of_questions?.description}
          />
          <span className={inputDescriptionStyles}>
            Provide background information for your question in a factual and
            unbiased tone. Links should be added to relevant and helpful
            resources using markdown syntax:{" "}
            <span className={markdownStyles}>
              [Link title](https://link-url.com)
            </span>
            .
          </span>
        </div>
        <div className={inputContainerStyles}>
          <span className={inputLabelStyles}>{t("groupVariable")}</span>
          <Input
            {...control.register("group_variable")}
            errors={control.formState.errors.group_variable}
            defaultValue={post?.group_of_questions?.group_variable}
            className={baseInputStyles}
          />
          <span className={inputDescriptionStyles}>
            What the subquestion labels represent (e.g. year, country, etc).
          </span>
        </div>
        <span>Resolution Criteria</span>
        <Textarea
          {...control.register("resolution_criteria_description")}
          errors={control.formState.errors.resolution_criteria_description}
          className="h-[120px] w-full"
          defaultValue={
            post?.group_of_questions?.resolution_criteria_description
              ? post?.group_of_questions?.resolution_criteria_description
              : undefined
          }
        />
        <span>Fine Print</span>
        <Textarea
          {...control.register("fine_print")}
          errors={control.formState.errors.fine_print}
          className="h-[120px] w-full"
          defaultValue={
            post?.group_of_questions?.fine_print
              ? post?.group_of_questions?.fine_print
              : undefined
          }
        />

        <CategoryPicker
          allCategories={allCategories}
          categories={categoriesList}
          onChange={(categories) => {
            setCategoriesList(categories);
          }}
        ></CategoryPicker>
        <span className="text-xs font-thin text-gray-800">{`A name for the parameter which varies between subquestions, like "Option", "Year" or "Country"`}</span>

        <div className="flex-col rounded border bg-zinc-200 p-4 dark:bg-blue-700">
          <div className="mb-4">Subquestions</div>

          {subQuestions.map((subQuestion, index) => {
            return (
              <div
                key={index}
                className="flex w-full flex-col space-y-4 rounded border bg-white p-4 dark:bg-blue-900"
              >
                <div className={inputContainerStyles}>
                  {collapsedSubQuestions[index] && (
                    <span className={inputLabelStyles}>Subquestion Label</span>
                  )}
                  <Input
                    onChange={(e) => {
                      setSubQuestions(
                        subQuestions.map((subQuestion, iter_index) => {
                          if (index == iter_index) {
                            subQuestion["label"] = e.target.value;
                          }
                          return subQuestion;
                        })
                      );
                    }}
                    className={baseInputStyles}
                    value={subQuestion?.label}
                  />
                  {collapsedSubQuestions[index] && (
                    <span className={inputDescriptionStyles}>
                      {`The label or parameter which identifies this subquestion, like "Option 1", "2033" or "France"`}
                    </span>
                  )}
                </div>
                {collapsedSubQuestions[index] && (
                  <div className="flex w-full flex-col gap-4 md:flex-row">
                    <div className="flex w-full flex-col gap-2">
                      <span className={inputLabelStyles}>Closing Date</span>
                      <Input
                        readOnly={isLive}
                        type="datetime-local"
                        className={baseInputStyles}
                        defaultValue={
                          subQuestions[index].scheduled_close_time
                            ? format(
                                new Date(
                                  subQuestions[index].scheduled_close_time
                                ),
                                "yyyy-MM-dd'T'HH:mm"
                              )
                            : undefined
                        }
                        onChange={(e) => {
                          setSubQuestions(
                            subQuestions.map((subQuestion, iter_index) => {
                              if (index == iter_index) {
                                subQuestion.scheduled_close_time =
                                  e.target.value;
                              }
                              return subQuestion;
                            })
                          );
                        }}
                      />
                    </div>
                    <div className="flex w-full flex-col gap-2">
                      <span className={inputLabelStyles}>Resolving Date</span>
                      <Input
                        readOnly={isLive}
                        type="datetime-local"
                        className={baseInputStyles}
                        defaultValue={
                          subQuestions[index].scheduled_resolve_time
                            ? format(
                                new Date(
                                  subQuestions[index].scheduled_resolve_time
                                ),
                                "yyyy-MM-dd'T'HH:mm"
                              )
                            : undefined
                        }
                        onChange={(e) => {
                          setSubQuestions(
                            subQuestions.map((subQuestion, iter_index) => {
                              if (index == iter_index) {
                                subQuestion.scheduled_resolve_time =
                                  e.target.value;
                              }
                              return subQuestion;
                            })
                          );
                        }}
                      />
                    </div>
                    {(subtype === QuestionType.Date ||
                      subtype === QuestionType.Numeric) && (
                      <NumericQuestionInput
                        // @ts-ignore
                        questionType={subtype}
                        defaultMin={subQuestions[index].range_min}
                        defaultMax={subQuestions[index].range_max}
                        // @ts-ignore
                        defaultOpenLowerBound={
                          subQuestions[index].open_lower_bound
                        }
                        // @ts-ignore
                        defaultOpenUpperBound={
                          subQuestions[index].open_upper_bound
                        }
                        defaultZeroPoint={subQuestions[index].zero_point}
                        isLive={isLive}
                        canSeeLogarithmic={
                          post?.user_permission == ProjectPermissions.ADMIN ||
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
                              if (index == iter_index) {
                                subQuestion["range_min"] = range_min;
                                subQuestion["range_max"] = range_max;
                                subQuestion["openLowerBound"] = openLowerBound;
                                subQuestion["openUpperBound"] = openUpperBound;
                                subQuestion["zeroPoint"] = zeroPoint;
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
                          if (iter_index == index) {
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
                    disabled={isLive}
                    size="md"
                    presentationType="icon"
                    variant="tertiary"
                    className="border-red-200 text-red-400 hover:border-red-400 active:border-red-600 active:bg-red-100/50 dark:border-red-400/50 dark:text-red-400 dark:hover:border-red-400 dark:active:border-red-300/75 dark:active:bg-red-400/15"
                    onClick={() => {
                      setSubQuestions(
                        subQuestions.filter(
                          (subQuestion, iter_index) => index != iter_index
                        )
                      );
                      setCollapsedSubQuestions(
                        collapsedSubQuestions.filter(
                          (_, iter_index) => index != iter_index
                        )
                      );
                    }}
                  >
                    <FontAwesomeIcon icon={faTrash}></FontAwesomeIcon>
                  </Button>
                </div>
              </div>
            );
          })}
          <div className="mt-4">
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
                      range_min: null,
                      range_max: null,
                      zero_point: null,
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
                      range_min: null,
                      range_max: null,
                      zero_point: null,
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
            >
              + New Subquestion
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <Button type="submit">
            {mode == "create" ? "Create Question" : "Edit Question"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GroupForm;
