"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import QuestionChartTile from "@/components/post_card/question_chart_tile";
import Button from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form_field";
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
import ProjectPicker from "./project_picker";
import { createQuestionPost, getPost, updatePost } from "../actions";

type PostCreationData = {
  title: string;
  url_title: string;
  tournament_id?: number;
  categories: number[];
  default_project_id: number;
  conditional: {
    condition_id: number;
    condition_child_id: number;
  };
};
const conditionalQuestionSchema = z.object({
  title: z.string().min(4).max(200),
  url_title: z.string().min(4).max(60),
  tournament_id: z.number().optional(),
  condition_id: z.number(),
  condition_child_id: z.number(),
});

const ConditionalForm: React.FC<{
  post: PostWithForecasts | null;
  conditionInit: PostWithForecasts | null;
  conditionChildInit: PostWithForecasts | null;
  tournament_id: number | null;
  mode: "create" | "edit";
  allCategories: Category[];
  tournaments: Tournament[];
  siteMain: Tournament;
}> = ({
  post = null,
  conditionInit = null,
  conditionChildInit = null,
  tournament_id = null,
  mode = "create",
  allCategories,
  tournaments,
  siteMain,
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
  const [condition, setCondition] = useState<PostWithForecasts | null>(
    conditionInit
  );
  const [conditionChild, setConditionChild] =
    useState<PostWithForecasts | null>(conditionChildInit);

  const control = useForm({
    resolver: zodResolver(conditionalQuestionSchema),
  });

  const [categoriesList, setCategoriesList] = useState<Category[]>(
    post?.projects.category ? post?.projects.category : ([] as Category[])
  );

  const submitQuestion = async (data: any) => {
    if (condition?.id && conditionChild?.id) {
      let post_data: PostCreationData = {
        title: data["title"],
        url_title: data["url_title"],
        default_project_id: data["default_project_id"],
        tournament_id: tournament_id ? tournament_id : undefined,
        categories: categoriesList.map((x) => x.id),
        conditional: {
          condition_id: condition?.question?.id as number,
          condition_child_id: conditionChild?.question?.id as number,
        },
      };

      if (mode == "edit") {
        const resp = await updatePost(post?.id as number, post_data);
        router.push(`/questions/${resp.post?.id}`);
      } else {
        const resp = await createQuestionPost(post_data);
        router.push(`/questions/${resp.post?.id}`);
      }
    }
  };

  const defaultProject = control.getValues("default_project_id")
    ? [...tournaments, siteMain].filter((x) =>
        x.id === control.getValues("default_project_id")
          ? control.getValues("default_project_id")
          : tournament_id
      )[0]
    : siteMain;

  const inputContainerStyles = "flex flex-col gap-1.5";
  const baseInputStyles =
    "px-3 py-2 text-base border border-gray-500 rounded dark:bg-blue-950";
  const baseTextareaStyles = "border border-gray-500 rounded dark:bg-blue-950";
  const inputLabelStyles = "text-sm font-bold text-gray-600 dark:text-gray-400";
  const inputDescriptionStyles = "text-xs text-gray-700 dark:text-gray-300";

  return (
    <div className="mb-4 mt-2 flex max-w-[840px] flex-col justify-center self-center rounded-none bg-white px-4 py-4 pb-5 dark:bg-blue-900 md:m-8 md:mx-auto md:rounded-md md:px-8 md:pb-8 lg:m-12 lg:mx-auto">
      <BacktoCreate
        backText="Create"
        backHref="/questions/create"
        currentPage="Conditional Pair"
      />
      <p className="mt-0 text-sm text-gray-600 dark:text-gray-300 md:mt-1 md:text-base">
        A Conditional Pair is a special type of Question Group that elicits
        conditional probabilities. Each Conditional Pair sits between a Parent
        Question and a Child Question. Both Parent and Child must be existing
        Metaculus Binary Questions.
      </p>
      <form
        className="mt-4 flex flex w-[540px] w-full flex-col space-y-4 rounded"
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
      >
        {post && (
          <div>
            <a href={`/admin/posts/post/${post.id}/change`}>
              View in django admin
            </a>
          </div>
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
          <span className={inputLabelStyles}>Condition ID</span>
          <Input
            readOnly={isLive}
            value={condition?.id}
            className={baseInputStyles}
            type="number"
            {...control.register("condition_id", {
              setValueAs: (value: string) => {
                const valueAsNr = Number(value);
                if (valueAsNr == 0) {
                  return;
                }
                getPost(valueAsNr).then((res) => {
                  if (res && res.question?.type === QuestionType.Binary) {
                    setCondition(res);
                  } else {
                    setCondition(null);
                  }
                });
                return valueAsNr;
              },
            })}
            errors={control.formState.errors.condition_id}
          />
          {condition?.question ? (
            <QuestionChartTile
              question={condition?.question}
              authorUsername={condition.author_username}
              curationStatus={condition.curation_status}
            />
          ) : (
            <span className={inputDescriptionStyles}>
              Please enter the id of a binary question.
            </span>
          )}
        </div>
        <div className={inputContainerStyles}>
          <span className={inputLabelStyles}>Condition Child ID</span>
          <Input
            readOnly={isLive}
            value={conditionChild?.id}
            className={baseInputStyles}
            type="number"
            {...control.register("condition_child_id", {
              setValueAs: (value: string) => {
                const valueAsNr = Number(value);
                if (valueAsNr == 0) {
                  return;
                }
                getPost(valueAsNr).then((res) => {
                  if (res && res.question) {
                    setConditionChild(res);
                  } else {
                    setConditionChild(null);
                  }
                });
                return valueAsNr;
              },
            })}
            errors={control.formState.errors.condition_child_id}
          />
          {conditionChild?.question ? (
            <QuestionChartTile
              question={conditionChild?.question}
              authorUsername={conditionChild.author_username}
              curationStatus={conditionChild.curation_status}
            />
          ) : (
            <span className={inputDescriptionStyles}>
              Please enter the id of a question.
            </span>
          )}
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
        <Button type="submit">
          {mode === "edit" ? "Edit Question" : "Create Question"}
        </Button>
      </form>
    </div>
  );
};

export default ConditionalForm;
