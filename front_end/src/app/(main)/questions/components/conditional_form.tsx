"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import QuestionChartTile from "@/components/post_card/question_chart_tile";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/form_field";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";

import { createQuestionPost, getPost, updatePost } from "../actions";

type PostCreationData = {
  title: string;
  tournament_id?: number;
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
}> = ({
  post = null,
  conditionInit = null,
  conditionChildInit = null,
  tournament_id = null,
  mode = "create",
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

  const submitQuestion = async (data: any) => {
    if (condition?.id && conditionChild?.id) {
      let post_data: PostCreationData = {
        title: data["title"],
        tournament_id: tournament_id ? tournament_id : undefined,
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
        <span>Title</span>
        <Input
          {...control.register("title")}
          errors={control.formState.errors.title}
          defaultValue={post ? post.title : ""}
        />
        <span>Condition ID</span>
        <Input
          disabled={!isLive}
          defaultValue={condition?.id}
          readOnly={Boolean(post && post.curation_status !== PostStatus.DRAFT)}
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
          disabled={!isLive}
          defaultValue={conditionChild?.id}
          readOnly={Boolean(post && post.curation_status !== PostStatus.DRAFT)}
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
        <Button type="submit" disabled={!isLive}>
          {mode === "edit" ? "Edit Question" : "Create Question"}
        </Button>
      </form>
    </div>
  );
};

export default ConditionalForm;
