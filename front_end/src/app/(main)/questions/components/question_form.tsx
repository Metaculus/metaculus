"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { all } from "mathjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { FormError, Input, Textarea } from "@/components/ui/form_field";
import {
  Category,
  PostStatus,
  PostWithForecasts,
  ProjectPermissions,
} from "@/types/post";

import CategoryPicker from "./category_picker";
import { createQuestionPost, updatePost } from "../actions";

type PostCreationData = {
  title: string;
  categories: number[];
  question: any;
  default_project_id: number;
};

const baseQuestionSchema = z.object({
  type: z.enum(["binary", "multiple_choice", "date", "numeric"]),
  title: z.string().min(4).max(200),
  url_title: z.string().min(4).max(60),
  description: z.string().min(4),
  resolution_criteria_description: z.string().min(1),
  fine_print: z.string(),
  scheduled_close_time: z.date(),
  scheduled_resolve_time: z.date(),
  default_project_id: z.nullable(z.union([z.number(), z.string()])),
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

const multipleChoiceQuestionSchema = baseQuestionSchema;

type Props = {
  questionType: string;
  tournament_id?: number;
  allCategories: Category[];
  post?: PostWithForecasts | null;
  mode: "create" | "edit";
};

const QuestionForm: React.FC<Props> = ({
  questionType,
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

  if (isDone) {
    throw new Error("Cannot edit closed, resolved or rejected questions");
  }

  const submitQuestion = async (data: any) => {
    if (data["zero_point"]) {
      if (data["zero_point"] > 0 || data["zero_point"] < data["min"]) {
        alert(
          "Zero point should be > 0 and < min | You probably don't know what you are doing, please stop using log scales and ask :)"
        );
        return;
      }
    }
    data["type"] = questionType;
    data["options"] = optionsList;

    if (questionType == "date") {
      data["max"] = new Date(data["max"]).getTime() / 1000;
      data["min"] = new Date(data["min"]).getTime() / 1000;
    }
    let post_data: PostCreationData = {
      title: data["title"],
      default_project_id: data["default_project_id"],
      categories: categoriesList.map((x) => x.id),
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
  const [categoriesList, setCategoriesList] = useState<Category[]>(
    post?.projects.category ? post?.projects.category : ([] as Category[])
  );
  const [isLogarithmic, setIsLogarithmic] = useState<boolean>(
    post?.question ? post?.question?.zero_point != 0 : false
  );

  const can_see_logarithmic = () => {
    return post?.user_permission == ProjectPermissions.ADMIN || !post;
  };
  const [logScaleEnabled, setLogScaleEnabled] = useState<boolean>(
    can_see_logarithmic()
  );

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
    resolver: zodResolver(getFormSchema(questionType)),
  });

  if (questionType) {
    control.setValue("type", questionType);
  }

  return (
    <div className="flex flex-row justify-center">
      <form
        onSubmit={async (e) => {
          if (control.getValues("default_project_id") === "") {
            control.setValue("default_project_id", null);
          }

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
        onChange={async (e) => {
          const data = control.getValues();
          data["type"] = questionType;
        }}
        className="text-light-100 text-m mb-8 mt-8 flex w-[540px] flex-col space-y-4 rounded-s border border-blue-800 bg-blue-900 p-8"
      >
        {post && (
          <div>
            <a href={`/admin/posts/post/${post.id}/change`}>
              View in django admin
            </a>
          </div>
        )}
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
            <span>{t("Short Title")}</span>
            <Input
              {...control.register("url_title")}
              errors={control.formState.errors.url_title}
              defaultValue={post?.url_title}
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
              readOnly={isLive}
              type="datetime-local"
              {...control.register("scheduled_close_time", {
                setValueAs: (value: string) => {
                  if (value == "" || value == null || value == undefined) {
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
          </div>
          <div>
            <span>Resolving Date</span>
            <Input
              readOnly={isLive}
              type="datetime-local"
              {...control.register("scheduled_resolve_time", {
                setValueAs: (value: string) => {
                  if (value == "" || value == null || value == undefined) {
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
          </div>

          {questionType == "numeric" && (
            <>
              <div>
                <span>Max</span>
                <Input
                  readOnly={isLive}
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
                  readOnly={isLive}
                  type="number"
                  {...control.register("min", {
                    setValueAs: (value: string) => {
                      return Number(value);
                    },
                  })}
                  errors={control.formState.errors.min}
                  defaultValue={post?.question?.min}
                  onChange={(e) => {
                    if (Number(e.target.value) <= 0) {
                      if (isLogarithmic) {
                        control.setError("min", {
                          message:
                            "Min must be greater than 0 when logarithmic",
                        });
                        return;
                      }
                      setLogScaleEnabled(false);
                    } else {
                      setLogScaleEnabled(can_see_logarithmic());
                    }
                  }}
                />
              </div>
            </>
          )}
          {questionType == "date" && (
            <>
              <div>
                <span>Max</span>
                <Input
                  readOnly={isLive}
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
                  defaultValue={
                    post?.question?.max
                      ? format(
                          new Date(post?.question?.max * 1000),
                          "yyyy-MM-dd"
                        )
                      : undefined
                  }
                />
              </div>
              <div>
                <span>Min</span>
                <Input
                  readOnly={isLive}
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
                  defaultValue={
                    post?.question?.min
                      ? format(
                          new Date(post?.question?.min * 1000),
                          "yyyy-MM-dd"
                        )
                      : undefined
                  }
                />
              </div>
            </>
          )}
          {(questionType == "numeric" || questionType == "date") && (
            <>
              <div>
                <Checkbox
                  label={"Open Upper Bound"}
                  readOnly={isLive}
                  errors={control.formState.errors.open_upper_bound}
                  onChange={async (e) => {
                    control.setValue("open_upper_bound", e);
                  }}
                  // @ts-ignore
                  defaultChecked={
                    // @ts-ignore
                    post?.question ? post?.question?.open_upper_bound : false
                  }
                />
              </div>
              <div>
                <Checkbox
                  label={"Open Lower Bound"}
                  readOnly={isLive}
                  errors={control.formState.errors.open_lower_bound}
                  onChange={(e) => {
                    control.setValue("open_lower_bound", e);
                  }}
                  // @ts-ignore
                  defaultChecked={
                    // @ts-ignore
                    post?.question ? post?.question?.open_lower_bound : false
                  }
                />
              </div>

              {logScaleEnabled && (
                <div>
                  <span className="mr-2">Is Logarithmic ?</span>
                  <Input
                    disabled={isLive}
                    type="checkbox"
                    onChange={(e) => {
                      setIsLogarithmic(e.target.checked);
                    }}
                    checked={isLogarithmic}
                    errors={control.formState.errors.zero_point}
                  />
                  {isLogarithmic && (
                    <div className="ml-2">
                      <span className="mr-2">Zero Point</span>
                      <Input
                        readOnly={isLive}
                        type="number"
                        {...control.register("zero_point", {
                          setValueAs: (value: string) => Number(value),
                        })}
                        errors={control.formState.errors.zero_point}
                        defaultValue={post?.question?.zero_point}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <span>Categories (separate by ,)</span>
          <CategoryPicker
            allCategories={allCategories}
            categories={categoriesList}
            onChange={(categories) => {
              setCategoriesList(categories);
            }}
          ></CategoryPicker>
          {questionType == "multiple_choice" && (
            <>
              <span>Multiple Choice (separate by ,)</span>
              <Input
                readOnly={isLive}
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
                        readOnly={isLive}
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
              post?.question?.fine_print
                ? post?.question?.fine_print
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
