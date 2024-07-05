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
  question: any;
};

const baseQuestionSchema = z.object({
  type: z.enum(["binary", "multiple_choice", "date", "numeric"]),
  title: z.string().min(4).max(200),
  url_title: z.string().min(4).max(200),
  description: z.string().min(10),
  resolution_criteria_description: z.string(),
  fine_print: z.string(),
  scheduled_close_time: z.date(),
  scheduled_resolve_time: z.date(),
  default_project_id: z.number(),
  cp_reveal_date: z.date(),
  categories: z.array(z.number()),
});

const binaryQuestionSchema = baseQuestionSchema;

const continuousQuestionSchema = baseQuestionSchema.merge(
  z.object({
    zero_point: z.number().default(0),
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
    options: z.array(z.string()).min(1),
  })
);

type Props = {
  questionType: string;
  tournament_id?: number;
  post?: PostWithForecasts | null;
  mode: "create" | "edit";
};

const QuestionForm: React.FC<Props> = ({
  questionType,
  mode,
  tournament_id = null,
  post = null,
}) => {
  const router = useRouter();
  const t = useTranslations();

  const submitQuestion = async (data: any) => {
    data["tournament_id"] = tournament_id;
    data["type"] = questionType;
    let post_data: PostCreationData = {
      title: data["title"],
      question: data,
    };
    if (mode == "edit" && post) {
      const resp = await updatePost(post.id, post_data);
      router.push(`/questions/${resp.post?.id}`);
    } else {
      const resp = await createQuestionPost(post_data);
      router.push(`/questions/${resp.post?.id}`);
    }
  };

  const [optionsList, setOptionsList] = useState<string[]>(
    post?.question?.options ? post?.question?.options : []
  );
  const [isLogarithmic, setIsLogarithmic] = useState<boolean>(false);

  const getFormSchema = (type: string) => {
    switch (type) {
      case "binary":
        return binaryQuestionSchema;
      case "numeric":
        return numericQuestionSchema;
      case "date":
        return dateQuestionSchema;
      case "multiple_choice":
        return multipleChoiceQuestionSchema;
      default:
        throw new Error("Invalid question type");
    }
  };

  const control = useForm({
    // @ts-ignore
    resolver: zodResolver(getFormSchema(questionType)),
  });

  if (questionType) {
    control.setValue("type", questionType);
  }

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
          data["type"] = questionType;
        }}
        className="text-light-100 text-m mb-8 mt-8 flex w-[540px] flex-col space-y-4 rounded-s border border-blue-800 bg-blue-900 p-8"
      >
        <div>
          {" "}
          <span>Django admin view: </span>
          {post && (
            <a>http://localhost:3000/admin/posts/post/{post.id}/change</a>
          )}
        </div>
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
          <div>
            <span>URL Title</span>
            <Input
              {...control.register("url_title")}
              errors={control.formState.errors.title}
              defaultValue={post?.title}
            />
          </div>
          <span>Description</span>
          <Textarea
            {...control.register("description")}
            errors={control.formState.errors.description}
            className="h-[120px] w-full"
            defaultValue={post?.question?.description}
          />
          <div>
            <span>Closing Date</span>
            <Input
              type="date"
              {...control.register("scheduled_close_time", {
                setValueAs: (value: string) => {
                  if (value == "" || value == null || value == undefined) {
                    return null;
                  }
                  return new Date(value);
                },
              })}
              errors={control.formState.errors.scheduled_close_time}
              defaultValue={post?.scheduled_close_time}
            />
          </div>
          <div>
            <span>Resolving Date</span>
            <Input
              type="date"
              {...control.register("scheduled_resolve_time", {
                setValueAs: (value: string) => {
                  if (value == "" || value == null || value == undefined) {
                    return null;
                  }
                  return new Date(value);
                },
              })}
              errors={control.formState.errors.scheduled_resolve_time}
              defaultValue={post?.scheduled_resolve_time}
            />
          </div>

          {questionType == "numeric" && (
            <>
              <div>
                <span>Max</span>
                <Input
                  type="number"
                  {...control.register("max", {
                    setValueAs: (value: string) => Number(value),
                  })}
                  errors={control.formState.errors.max}
                  defaultValue={post?.question?.max}
                />
              </div>
              <div>
                <span>Min</span>
                <Input
                  type="number"
                  {...control.register("min", {
                    setValueAs: (value: string) => Number(value),
                  })}
                  errors={control.formState.errors.min}
                  defaultValue={post?.question?.min}
                />
              </div>
            </>
          )}
          {questionType == "date" && (
            <>
              <div>
                <span>Max</span>
                <Input
                  type="date"
                  {...control.register("max", {
                    setValueAs: (value: string) => {
                      if (value == "" || value == null || value == undefined) {
                        return null;
                      }
                      return new Date(value);
                    },
                  })}
                  errors={control.formState.errors.max}
                  defaultValue={post?.question?.max}
                />
              </div>
              <div>
                <span>Min</span>
                <Input
                  type="date"
                  {...control.register("min", {
                    setValueAs: (value: string) => {
                      if (value == "" || value == null || value == undefined) {
                        return null;
                      }
                      return new Date(value);
                    },
                  })}
                  errors={control.formState.errors.min}
                  defaultValue={post?.question?.min}
                />
              </div>
            </>
          )}
          {(questionType == "numeric" || questionType == "date") && (
            <>
              <div>
                <span>Open Upper Bound</span>
                <Input
                  type="checkbox"
                  {...control.register("open_upper_bound")}
                  errors={control.formState.errors.open_upper_bound}
                />
              </div>
              <div>
                <span>Open Lower Bound</span>
                <Input
                  type="checkbox"
                  {...control.register("open_lower_bound")}
                  errors={control.formState.errors.open_lower_bound}
                />
              </div>
              <div>
                <span className="mr-2">Is Logarithmic ?</span>
                <Input
                  type="checkbox"
                  onChange={(e) => {
                    setIsLogarithmic(e.target.checked);
                  }}
                  checked={isLogarithmic}
                  errors={control.formState.errors.open_lower_bound}
                />
              </div>
              {(questionType == "numeric" || questionType == "date") &&
                isLogarithmic && (
                  <>
                    <span>Zero Point</span>
                    <Input
                      type="number"
                      {...control.register("zero_point", {
                        setValueAs: (value: string) => Number(value),
                      })}
                      errors={control.formState.errors.zero_point}
                      defaultValue={post?.question?.zero_point}
                    />
                  </>
                )}
            </>
          )}

          {questionType == "multiple_choice" && (
            <>
              <span>Multiple Choice (separate by ,)</span>
              <Input
                type="text"
                onChange={(event) => {
                  const options = String(event.target.value)
                    .split(",")
                    .map((option) => option.trim());
                  setOptionsList(options);
                }}
                errors={control.formState.errors.options}
                value={optionsList.join(",")}
              />
              {optionsList && (
                <div className="flex flex-col">
                  {optionsList.map((option: string, opt_index: number) => {
                    return (
                      <Input
                        key={opt_index}
                        className="m-2 w-min min-w-[120px] border p-2 text-xs"
                        value={option}
                        onChange={(e) => {
                          setOptionsList(
                            optionsList.map((opt, index) => {
                              if (index == opt_index) {
                                return e.target.value;
                              }
                              return opt;
                            })
                          );
                        }}
                      ></Input>
                    );
                  })}
                </div>
              )}
            </>
          )}

          <span>Resolution Criteria</span>
          <Textarea
            {...control.register("resolution_criteria_description")}
            errors={control.formState.errors.resolution_criteria_description}
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

          <div className=""></div>
          <Button type="submit">
            {mode == "create" ? "Create Question" : "Edit Question"}
          </Button>
        </>
      </form>
    </div>
  );
};

export default QuestionForm;
