"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { forEach } from "lodash";
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

import CategoryPicker from "./category_picker";
import { createQuestionPost, updatePost } from "../actions";

type PostCreationData = {
  group_of_questions: any;
  title: string;
  categories: number[];
  default_project_id: number;
};

const groupQuestionSchema = z.object({
  title: z.string().min(4).max(200),
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
};

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
        if (x["min"] || x["max"]) {
          if (x["max"] <= x["min"]) {
            alert("Max should be > min");
            break_out = true;
          }
        }
        if (subtype == "binary") {
          return {
            type: subtype,
            title: x.label,
            scheduled_close_time: x.scheduled_close_time,
            scheduled_resolve_time: x.scheduled_resolve_time,
          };
        } else if (subtype == "numeric") {
          return {
            type: subtype,
            title: x.label,
            scheduled_close_time: x.scheduled_close_time,
            scheduled_resolve_time: x.scheduled_resolve_time,
            min: x.min,
            max: x.max,
          };
        } else if (subtype == "date") {
          return {
            type: subtype,
            title: x.label,
            scheduled_close_time: x.scheduled_close_time,
            scheduled_resolve_time: x.scheduled_resolve_time,
            min: new Date(x.min).getTime() / 1000,
            max: new Date(x.max).getTime() / 1000,
          };
        }
      });
    if (break_out) {
      return;
    }
    const questionToDelete: number[] = [];
    if (post?.group_of_questions.questions) {
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
            max: x.max,
            min: x.min,
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

  return (
    <div className="flex flex-row justify-center">
      <form
        onSubmit={async (e) => {
          e.preventDefault(); // Good for debugging
          await control.handleSubmit(
            async (data) => {
              await submitQuestion(data);
            },
            async (e) => {
              console.log("Error: ", e);
            }
          )(e);
        }}
        className="text-light-100 text-m mb-8 mt-8 flex w-[540px] flex-col space-y-4 rounded-s bg-white p-8 dark:bg-blue-900"
      >
        <span>Project</span>
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
        />
        <div>
          <span className="">
            Initial project:
            <span className="border-1 ml-1 rounded bg-blue-600 pl-1 pr-1">
              <Link
                href={`/tournament/${control.getValues("default_project_id")}`}
                className="no-underline"
              >
                {control.getValues("default_project_id")
                  ? control.getValues("default_project_id")
                  : "Global"}
              </Link>
            </span>
          </span>
        </div>
        <>
          <span>Title</span>
          <Input
            {...control.register("title")}
            errors={control.formState.errors.title}
            defaultValue={post?.title}
          />

          <span>Description</span>
          <Textarea
            {...control.register("description")}
            errors={control.formState.errors.description}
            className="h-[120px] w-full"
            defaultValue={post?.group_of_questions?.description}
          />

          <span>Group Variable</span>
          <Input
            {...control.register("group_variable")}
            errors={control.formState.errors.group_variable}
            defaultValue={post?.group_of_questions.group_variable}
          />

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
                  className="m-4 flex flex-col space-y-4 rounded border bg-white p-4 dark:bg-blue-900"
                >
                  <span className="">Subquestion Label</span>
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
                    defaultValue={subQuestion?.label}
                    disabled={subQuestions[index]["id"]}
                  />
                  <span className="text-xs font-thin text-gray-800">{`The label or parameter which identifies this subquestion, like "Option 1", "2033" or "France"`}</span>
                  {collapsedSubQuestions[index] && (
                    <>
                      <span>Closing Date</span>
                      <Input
                        disabled={subQuestions[index]["id"]}
                        type="datetime-local"
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

                      <span>Resolving Date</span>
                      <Input
                        disabled={subQuestions[index]["id"]}
                        type="datetime-local"
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

                      {subtype == "numeric" && (
                        <>
                          <div>
                            <span>Max</span>
                            <Input
                              disabled={subQuestions[index]["id"]}
                              type="number"
                              defaultValue={subQuestions[index].max}
                              onChange={(e) => {
                                setSubQuestions(
                                  subQuestions.map(
                                    (subQuestion, iter_index) => {
                                      if (index == iter_index) {
                                        subQuestion.max = Number(
                                          e.target.value
                                        );
                                      }
                                      return subQuestion;
                                    }
                                  )
                                );
                              }}
                            />
                          </div>
                          <div>
                            <span>Min</span>
                            <Input
                              disabled={subQuestions[index]["id"]}
                              type="number"
                              defaultValue={subQuestions[index].min}
                              onChange={(e) => {
                                setSubQuestions(
                                  subQuestions.map(
                                    (subQuestion, iter_index) => {
                                      if (index == iter_index) {
                                        subQuestion.min = Number(
                                          e.target.value
                                        );
                                      }
                                      return subQuestion;
                                    }
                                  )
                                );
                              }}
                            />
                          </div>
                        </>
                      )}
                      {subtype == "date" && (
                        <>
                          <div>
                            <span>Max</span>
                            <Input
                              disabled={subQuestions[index]["id"]}
                              type="date"
                              defaultValue={
                                subQuestions[index].max
                                  ? format(
                                      new Date(subQuestions[index].max),
                                      "yyyy-MM-dd"
                                    )
                                  : undefined
                              }
                              onChange={(e) => {
                                setSubQuestions(
                                  subQuestions.map(
                                    (subQuestion, iter_index) => {
                                      if (index == iter_index) {
                                        subQuestion.max = e.target.value;
                                      }
                                      return subQuestion;
                                    }
                                  )
                                );
                              }}
                            />
                          </div>
                          <div>
                            <span>Min</span>
                            <Input
                              disabled={subQuestions[index]["id"]}
                              type="date"
                              defaultValue={
                                subQuestions[index].min
                                  ? format(
                                      new Date(subQuestions[index].min),
                                      "yyyy-MM-dd"
                                    )
                                  : undefined
                              }
                              onChange={(e) => {
                                setSubQuestions(
                                  subQuestions.map(
                                    (subQuestion, iter_index) => {
                                      if (index == iter_index) {
                                        subQuestion.min = e.target.value;
                                      }
                                      return subQuestion;
                                    }
                                  )
                                );
                              }}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}

                  <div className="flex justify-between">
                    <Button
                      className="rounded-xxl border border-0 bg-gray-300 text-black dark:bg-blue-300 dark:text-blue-800"
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
                        ? "⌄ Expand"
                        : "^ Collapse"}
                    </Button>

                    <Button
                      disabled={isLive}
                      className="rounded-xxl border-0 bg-red-200 text-red-800 dark:bg-red-200 dark:text-red-800"
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
                      x Remove Subquestion
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
          <div className=""></div>
          <Button type="submit">
            {mode == "create" ? "Create Question" : "Edit Question"}
          </Button>
        </>
      </form>
    </div>
  );
};

export default GroupForm;
