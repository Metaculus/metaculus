"use client";

import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { title } from "process";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import Button from "@/components/ui/button";
import { FormError, Input, Textarea } from "@/components/ui/form_field";
import { Category, PostStatus, PostWithForecasts } from "@/types/post";

import BacktoCreate from "./back_to_create";
import CategoryPicker from "./category_picker";
import { createQuestionPost, updatePost } from "../actions";

type PostCreationData = {
  title: string;
  group_of_questions: any;
};

const groupQuestionSchema = z.object({
  subtype: z.enum(["binary", "date", "numeric"]),
  title: z.string().min(4).max(200),
  group_variable: z.string().max(200),
  description: z.string().min(10),
  resolution_criteria_description: z.string().optional(),
  fine_print: z.string().optional(),
  tournament_id: z.number().optional(),
});

type Props = {
  subtype: "binary" | "numeric" | "date";
  tournament_id?: number;
  post?: PostWithForecasts | null;
  mode: "create" | "edit";
  allCategories: Category[];
};

function fmtDateStrForInput(
  dt_string: string | null | undefined
): string | undefined {
  if (dt_string === null || dt_string === undefined) {
    return undefined;
  }
  const as_date = new Date(dt_string);
  return as_date.toISOString().split("T")[0];
}

const GroupForm: React.FC<Props> = ({
  subtype,
  mode,
  allCategories,
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

  const submitQuestion = async (data: any) => {
    data["tournament_id"] = tournament_id;
    let post_data: PostCreationData = {
      title: data["title"],
      group_of_questions: data,
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
            scheduled_close_time: x.scheduled_close_time,
            scheduled_resolve_time: x.scheduled_resolve_time,
            title: x.title,
          };
        })
      : []
  );
  const [collapsedSubQuestions, setCollapsedSubQuestions] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>(
    post?.projects.category ? post?.projects.category : ([] as Category[])
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
        className="mt-4 flex flex w-[540px] w-full flex-col space-y-4 rounded"
      >
        <div className={inputContainerStyles}>
          <span className={inputLabelStyles}>Project ID</span>
          <Input
            type="number"
            {...control.register("default_project_id")}
            errors={control.formState.errors.default_project_id}
            defaultValue={
              control.getValues("default_project_id")
                ? control.getValues("default_project_id")
                : tournament_id
            }
            readOnly={isLive}
            className={baseInputStyles}
          />

          <span className="text-xs">
            Initial project:
            <span className="border-1 ml-1 rounded bg-blue-600 pl-1 pr-1">
              <Link
                href={`/tournament/${control.getValues("default_project_id")}`}
                className="text-white no-underline"
              >
                {control.getValues("default_project_id")
                  ? control.getValues("default_project_id")
                  : "Global"}
              </Link>
            </span>
          </span>
        </div>
        <div className="flex flex-col gap-6">
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
            <span className={inputLabelStyles}>Background Information</span>
            <Textarea
              {...control.register("description")}
              errors={control.formState.errors.description}
              className={`${baseTextareaStyles} h-[120px] w-full p-3 text-sm`}
              defaultValue={post?.question?.description}
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
            <span className={inputLabelStyles}>Group Variable</span>
            <Input
              disabled={isLive}
              {...control.register("group_variable")}
              errors={control.formState.errors.group_variable}
              defaultValue={post?.group_of_questions.group_variable}
              className={baseInputStyles}
            />{" "}
            <span className={inputDescriptionStyles}>
              A name for the parameter which varies between subquestions, like
              &quot;Option&quot;, &quot;Year&quot; or &quot;Country&quot;
            </span>
          </div>
          <div className={inputContainerStyles}>
            <span className={inputLabelStyles}>Resolution Criteria</span>
            <Textarea
              {...control.register("resolution_criteria_description")}
              errors={control.formState.errors.resolution_criteria_description}
              className={`${baseTextareaStyles} h-[120px] w-full p-3 text-sm`}
              defaultValue={
                post?.question?.resolution_criteria_description
                  ? post?.question?.resolution_criteria_description
                  : undefined
              }
            />
            <span className={inputDescriptionStyles}>
              A good question will almost always resolve unambiguously. If you
              have a data source by which the question will resolve, link to it
              here. If there is some simple math that will need to be done to
              resolve this question, define the equation in markdown:{" "}
              <span className={markdownStyles}>\[ y = ax^2+b \]</span>.
            </span>
          </div>
          <div className={inputContainerStyles}>
            <span className={inputLabelStyles}>Fine Print</span>
            <Textarea
              {...control.register("fine_print")}
              errors={control.formState.errors.fine_print}
              className={`${baseTextareaStyles} h-[120px] w-full p-3 text-sm`}
              defaultValue={
                post?.question?.fine_print
                  ? post?.question?.fine_print
                  : undefined
              }
            />
            <span className={inputDescriptionStyles}>
              Use the fine print for any sort of lawyerly details which
              don&apos;t need to be prominently displayed. This is optional.
            </span>
          </div>
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
          <div className="flex flex-col items-start gap-4 rounded border border-gray-300 bg-blue-200/50 p-4 dark:bg-blue-700/50">
            <div className="text-xl">Subquestions</div>

            {subQuestions.map((subQuestion, index) => {
              return (
                <div
                  key={index}
                  className="flex w-full flex-col space-y-4 rounded border bg-white p-4 dark:bg-blue-900"
                >
                  <div className={inputContainerStyles}>
                    <span className={inputLabelStyles}>Subquestion Label</span>
                    <Input
                      onChange={(e) => {
                        setSubQuestions(
                          subQuestions.map((subQuestion, iter_index) => {
                            if (index == iter_index) {
                              subQuestion["title"] = e.target.value;
                            }
                            return subQuestion;
                          })
                        );
                      }}
                      className={baseInputStyles}
                      value={subQuestion?.title}
                    />
                    <span
                      className={inputDescriptionStyles}
                    >{`The label or parameter which identifies this subquestion, like "Option 1", "2033" or "France"`}</span>
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
                                  subQuestion.scheduled_close_time =
                                    e.target.value;
                                }
                                return subQuestion;
                              })
                            );
                          }}
                        />
                      </div>
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

            <Button
              onClick={() => {
                if (subtype === "numeric") {
                  setSubQuestions([
                    ...subQuestions,
                    {
                      type: "numeric",
                      title: "",
                      scheduled_close_time:
                        control.getValues().scheduled_close_time,
                      scheduled_resolve_time:
                        control.getValues().scheduled_resolve_time,
                      min: null,
                      max: null,
                      zero_point: null,
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
                      min: null,
                      max: null,
                      zero_point: null,
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
          <Button type="submit">
            {mode == "create" ? "Create Question" : "Edit Question"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GroupForm;
