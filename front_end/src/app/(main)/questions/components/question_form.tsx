"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import Button from "@/components/ui/button";
import { FormError, Input, Textarea } from "@/components/ui/form_field";
import { Category, PostWithForecasts, ProjectPermissions } from "@/types/post";
import { Tournament } from "@/types/projects";
import { QuestionType } from "@/types/question";
import { getQuestionStatus } from "@/utils/questions";

import BacktoCreate from "./back_to_create";
import CategoryPicker from "./category_picker";
import NumericQuestionInput from "./numeric_question_input";
import ProjectPicker from "./project_picker";
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
  tournaments: Tournament[];
  siteMain: Tournament;
};

const QuestionForm: React.FC<Props> = ({
  questionType,
  mode,
  allCategories,
  tournaments,
  siteMain,
  tournament_id = null,
  post = null,
}) => {
  const router = useRouter();
  const t = useTranslations();
  const { isLive, isDone } = getQuestionStatus(post);

  const defaultProject = post
    ? post.projects.default_project
    : tournament_id
      ? [...tournaments, siteMain].filter((x) => x.id === tournament_id)[0]
      : siteMain;

  if (isDone) {
    throw new Error("Cannot edit closed, resolved or rejected questions");
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

  const submitQuestion = async (data: any) => {
    if (
      questionType === QuestionType.Date ||
      questionType === QuestionType.Numeric
    ) {
      data["options"] = optionsList;
    }
    data["type"] = questionType;
    data["options"] = optionsList;

    let post_data: PostCreationData = {
      title: data["title"],
      default_project_id: data["default_project_id"],
      categories: categoriesList.map((x) => x.id),
      question: data,
    };
    if (mode === "edit" && post) {
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

  const inputContainerStyles = "flex flex-col gap-1.5";
  const baseInputStyles =
    "px-3 py-2 text-base border border-gray-500 dark:border-gray-500-dark rounded dark:bg-blue-50-dark";
  const baseTextareaStyles =
    "border border-gray-500 dark:border-gray-500-dark rounded dark:bg-blue-50-dark";
  const inputLabelStyles =
    "text-sm capitalize font-bold text-gray-600 dark:text-gray-600-dark";
  const inputDescriptionStyles =
    "text-xs text-gray-700 dark:text-gray-700-dark";
  const markdownStyles =
    "text-xs font-mono pb-0.5 pt-0 px-1 rounded-sm bg-blue-400 text-gray-1000 dark:text-gray-1000-dark dark:bg-blue-400-dark";

  return (
    <div className="mb-4 mt-2 flex max-w-4xl flex-col justify-center self-center rounded-none bg-gray-0 px-4 pb-5 pt-4 dark:bg-gray-0-dark md:m-8 md:mx-auto md:rounded-md md:px-8 md:pb-8 lg:m-12 lg:mx-auto">
      <BacktoCreate
        backText={t("create")}
        backHref="/questions/create"
        currentPage={formattedQuestionType}
      />
      <p className="mt-0 text-sm text-gray-700 dark:text-gray-700-dark md:mt-1 md:text-base">
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
        onChange={async () => {
          const data = control.getValues();
          data["type"] = questionType;
        }}
        className="mt-4 flex w-[540px] w-full flex-col space-y-4 rounded"
      >
        {post && (
          <a href={`/admin/posts/post/${post.id}/change`}>
            {t("viewInDjangoAdmin")}
          </a>
        )}
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

        <FormError
          errors={control.formState.errors}
          className="text-red-500 dark:text-red-500-dark"
          {...control.register("type")}
        />
        <div className="flex flex-col gap-6">
          <div className={inputContainerStyles}>
            <span className={inputLabelStyles}>{t("longTitle")}</span>
            <Textarea
              {...control.register("title")}
              errors={control.formState.errors.title}
              defaultValue={post?.title}
              className={`${baseTextareaStyles} min-h-32 p-5 text-xl font-normal`}
            />
            <span className={inputDescriptionStyles}>
              {t("longTitleExplanation")}
            </span>
          </div>
          <div className={inputContainerStyles}>
            <span className={inputLabelStyles}>{t("shortTitle")}</span>
            <Input
              {...control.register("url_title")}
              errors={control.formState.errors.url_title}
              defaultValue={post?.url_title}
              className={baseInputStyles}
            />
            <span className={inputDescriptionStyles}>
              {t("shortTitleExplanation")}
            </span>
          </div>
          <div className={inputContainerStyles}>
            <span className={inputLabelStyles}>
              {t("backgroundInformation")}
            </span>
            <Textarea
              {...control.register("description")}
              errors={control.formState.errors.description}
              className={`${baseTextareaStyles} h-32 w-full p-3 text-sm`}
              defaultValue={post?.question?.description}
            />
            <span className={inputDescriptionStyles}>
              {t.rich("backgroundInfoExplanation", {
                link: (chunks) => <Link href="/help/markdown">{chunks}</Link>,
                markdown: (chunks) => (
                  <span className={markdownStyles}>{chunks}</span>
                ),
              })}
            </span>
          </div>
          <div className="flex w-full flex-col gap-4 md:flex-row">
            <div className="flex w-full flex-col gap-2">
              <span className={inputLabelStyles}>{t("closingDate")}</span>
              <Input
                readOnly={isLive}
                type="datetime-local"
                className={baseInputStyles}
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
            <div className="flex w-full flex-col gap-2">
              <span className={inputLabelStyles}>{t("resolvingDate")}</span>
              <Input
                readOnly={isLive}
                type="datetime-local"
                className={baseInputStyles}
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
          </div>
          {(questionType === QuestionType.Date ||
            questionType === QuestionType.Numeric) && (
            <NumericQuestionInput
              questionType={questionType}
              defaultMin={post?.question?.range_min!}
              defaultMax={post?.question?.range_max!}
              // @ts-ignore
              defaultOpenLowerBound={post?.question?.open_lower_bound}
              // @ts-ignore
              defaultOpenUpperBound={post?.question?.open_upper_bound}
              defaultZeroPoint={post?.question?.zero_point}
              isLive={isLive}
              canSeeLogarithmic={
                post?.user_permission == ProjectPermissions.ADMIN || !post
              }
              onChange={(
                rangeMin,
                rangeMax,
                openLowerBound,
                openUpperBound,
                zeroPoint
              ) => {
                control.setValue("rangeMin", rangeMin);
                control.setValue("rangeMax", rangeMax);
                control.setValue("open_lower_bound", openLowerBound);
                control.setValue("open_upper_bound", openUpperBound);
                control.setValue("zero_point", zeroPoint);
              }}
            />
          )}

          <div className={inputContainerStyles}>
            <span className={inputLabelStyles}>{t("categories")}</span>
            <CategoryPicker
              allCategories={allCategories}
              categories={categoriesList}
              onChange={(categories) => {
                setCategoriesList(categories);
              }}
            ></CategoryPicker>
          </div>
          {questionType == "multiple_choice" && (
            <div className={inputContainerStyles}>
              <span className={inputLabelStyles}>
                Multiple Choice (separate by ,)
              </span>
              <Input
                readOnly={isLive}
                type="text"
                className={baseInputStyles}
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
            </div>
          )}
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
              {t("finePrintDescription")}
            </span>
          </div>
          <Button type="submit" className="w-max capitalize">
            {mode === "create" ? t("createQuestion") : t("editQuestion")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;
