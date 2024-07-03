"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import Button from "@/components/ui/button";
import { FormError, Input, Textarea } from "@/components/ui/form_field";
import { PostWithForecasts } from "@/types/post";

import { createQuestionPost, updatePost } from "../actions";

type PostCreationData = {
  title: string;
  group_of_questions: any;
};

const groupQuestionSchema = z.object({
  subtype: z.enum(["binary", "date", "numeric"]),
  title: z.string().min(4).max(200),
  description: z.string().min(10),
  resolution_criteria_description: z.string().optional(),
  fine_print: z.string().optional(),
  scheduled_close_time: z.date().optional(),
  scheduled_resolve_time: z.date().optional(),
  tournament_id: z.number().optional(),
});

type Props = {
  subtype: "binary" | "numeric" | "date";
  tournament_id?: number;
  post?: PostWithForecasts | null;
  mode: "create" | "edit";
};

const GroupForm: React.FC<Props> = ({
  subtype,
  mode,
  tournament_id = null,
  post = null,
}) => {
  const router = useRouter();
  const t = useTranslations();

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

  const [advanced, setAdvanced] = useState(false);
  const [subQuestions, setSubQuestions] = useState<any[]>([]);

  const control = useForm({
    // @ts-ignore
    resolver: zodResolver(groupQuestionSchema),
  });

  return (
    <div className="flex flex-row justify-center">
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
        onChange={async (e) => {
          const data = control.getValues();
        }}
        className="text-light-100 text-m mb-8 mt-8 flex w-[540px] flex-col space-y-4 rounded-s border border-blue-800 bg-blue-900 p-8"
      >
        {tournament_id && (
          <div className="mb-2">
            <span className="">
              For tournament:{" "}
              <span className="border-1 ml-1 rounded bg-blue-600 pl-1 pr-1">
                <Link
                  href={`/tournaments/${tournament_id}`}
                  className="no-underline"
                >
                  {tournament_id}
                </Link>
              </span>
            </span>
          </div>
        )}

        <FormError
          errors={control.formState.errors}
          className="text-red-500-dark"
          {...control.register("type")}
        />
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
            defaultValue={post?.question?.description}
          />

          <span>Closing Date</span>
          <Input
            type="date"
            {...control.register("scheduled_close_time", {
              setValueAs: (value: string) => {
                return new Date(value);
              },
            })}
            errors={control.formState.errors.scheduled_close_time}
            defaultValue={post?.scheduled_close_time}
          />

          <span>Resolving Date</span>
          <Input
            type="date"
            {...control.register("scheduled_resolve_time", {
              setValueAs: (value: string) => {
                return new Date(value);
              },
            })}
            errors={control.formState.errors.scheduled_resolve_time}
            defaultValue={post?.scheduled_resolve_time}
          />

          <span>Opening date</span>
          <Input
            type="date"
            {...control.register("open_time", {
              setValueAs: (value: string) => {
                return new Date(value);
              },
            })}
            errors={control.formState.errors.open_time}
            defaultValue={post?.question?.open_time}
          />

          {advanced && (
            <>
              <span>Resolution Criteria</span>
              <Textarea
                {...control.register("resolution_criteria_description")}
                errors={
                  control.formState.errors.resolution_criteria_description
                }
                className="h-[120px] w-full"
                defaultValue={
                  post?.question?.resolution_criteria_description
                    ? post?.question?.resolution_criteria_description
                    : undefined
                }
              />
              <span>Fine Print</span>
              <Textarea
                {...control.register("fine_print")}
                errors={control.formState.errors.fine_print}
                className="h-[120px] w-full"
                defaultValue={
                  post?.question?.resolution_criteria_description
                    ? post?.question?.resolution_criteria_description
                    : undefined
                }
              />
            </>
          )}
          <div className="flex-col rounded border bg-zinc-200 p-4 dark:bg-blue-700">
            <div className="mb-4">Subquestions</div>

            {subQuestions.map((subQuestion, index) => {
              return (
                <div
                  key={index}
                  className="m-4 flex flex-col space-y-4 rounded border bg-white p-4 dark:bg-blue-900"
                >
                  <span className="text-gray-300">Subquestion Label</span>
                  <Input
                    onChange={(e) => {
                      setSubQuestions(
                        subQuestions.map((subQuestion, iter_index) => {
                          if (index == iter_index) {
                            subQuestion.label = e.target.value;
                          }
                          return subQuestion;
                        })
                      );
                    }}
                    defaultValue={post?.title}
                  />
                  <span className="text-xs font-thin text-gray-300"></span>

                  <span>Closing Date</span>
                  <Input
                    type="date"
                    onChange={(e) => {
                      setSubQuestions(
                        subQuestions.map((subQuestion, iter_index) => {
                          if (index == iter_index) {
                            subQuestion.scheduled_close_time = e.target.value;
                          }
                          return subQuestion;
                        })
                      );
                    }}
                    defaultValue={post?.scheduled_close_time}
                  />

                  <span>Resolving Date</span>
                  <Input
                    type="date"
                    onChange={(e) => {
                      setSubQuestions(
                        subQuestions.map((subQuestion, iter_index) => {
                          if (index == iter_index) {
                            subQuestion.scheduled_resolve_time = e.target.value;
                          }
                          return subQuestion;
                        })
                      );
                    }}
                    defaultValue={post?.scheduled_resolve_time}
                  />
                  <span>Opening date</span>
                  <Input
                    type="date"
                    onChange={(e) => {
                      setSubQuestions(
                        subQuestions.map((subQuestion, iter_index) => {
                          if (index == iter_index) {
                            subQuestion.open_time = e.target.value;
                          }
                          return subQuestion;
                        })
                      );
                    }}
                    defaultValue={post?.question?.open_time}
                  />
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
                      open_time: control.getValues().open_time,
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
                      open_time: control.getValues().open_time,
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
                      open_time: control.getValues().open_time,
                      scheduled_close_time:
                        control.getValues().scheduled_close_time,
                      scheduled_resolve_time:
                        control.getValues().scheduled_resolve_time,
                    },
                  ]);
                }
              }}
            >
              + New Subquestion
            </Button>
          </div>
          <div className=""></div>
          <Button type="submit">
            {mode == "create" ? "Create Question" : "Edit Question"}
          </Button>
          <Button onClick={() => setAdvanced(!advanced)}>
            {advanced ? "Change to Simple Mode" : "Change to Advanced Mode"}
          </Button>
        </>
      </form>
    </div>
  );
};

export default GroupForm;
