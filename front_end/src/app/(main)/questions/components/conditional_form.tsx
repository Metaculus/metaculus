"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import QuestionChartTile from "@/components/post_card/question_chart_tile";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/form_field";
import { Category, PostStatus, PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";

import CategoryPicker from "./category_picker";
import { createQuestionPost, getPost, updatePost } from "../actions";

type PostCreationData = {
  title: string;
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
}> = ({
  post = null,
  conditionInit = null,
  conditionChildInit = null,
  tournament_id = null,
  mode = "create",
  allCategories,
}) => {
  const router = useRouter();
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

  return (
    <div className="flex flex-row justify-center">
      <form
        className="text-light-100 text-m mb-8 mt-8 flex w-[540px] flex-col space-y-4 rounded-s border border-blue-800 bg-blue-900 p-8"
        onSubmit={async (e) => {
          if (control.getValues("default_project_id") === "") {
            control.setValue("default_project_id", null);
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
                href={`/tournaments/${control.getValues("default_project_id")}`}
                className="no-underline"
              >
                {control.getValues("default_project_id")
                  ? control.getValues("default_project_id")
                  : "Global"}
              </Link>
            </span>
          </span>
        </div>
        <span>Title</span>
        <Input
          {...control.register("title")}
          errors={control.formState.errors.title}
          defaultValue={post ? post.title : ""}
        />
        <span>Condition ID</span>
        <Input
          readOnly={isLive}
          defaultValue={condition?.id}
          type="number"
          {...control.register("condition_id", {
            setValueAs: (value: string) => {
              const valueAsNr = Number(value);
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
          <span className="text-l w-full text-center text-red-300">
            Please enter the id of a binary question.
          </span>
        )}

        <span>Condition Child ID</span>
        <Input
          readOnly={isLive}
          defaultValue={conditionChild?.id}
          type="number"
          {...control.register("condition_child_id", {
            setValueAs: (value: string) => {
              const valueAsNr = Number(value);
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
          <span className="text-l w-full text-center text-red-300">
            Please enter the id of a question.
          </span>
        )}
        <CategoryPicker
          allCategories={allCategories}
          categories={categoriesList}
          onChange={(categories) => {
            setCategoriesList(categories);
          }}
        ></CategoryPicker>
        <Button type="submit">
          {mode === "edit" ? "Edit Question" : "Create Question"}
        </Button>
      </form>
    </div>
  );
};

export default ConditionalForm;
