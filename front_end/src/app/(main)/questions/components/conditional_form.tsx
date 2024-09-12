"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import QuestionChartTile from "@/components/post_card/question_chart_tile";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import { useAuth } from "@/contexts/auth_context";
import { PostWithForecasts } from "@/types/post";
import { Tournament, TournamentPreview } from "@/types/projects";
import { QuestionType } from "@/types/question";
import { getQuestionStatus } from "@/utils/questions";

import BacktoCreate from "./back_to_create";
import ProjectPicker from "./project_picker";
import { createQuestionPost, getPost, updatePost } from "../actions";

type PostCreationData = {
  default_project: number;
  conditional: {
    condition_id: number;
    condition_child_id: number;
  };
};
const conditionalQuestionSchema = z.object({
  condition_id: z.number(),
  condition_child_id: z.number(),
  default_project: z.number(),
});

const ConditionalForm: React.FC<{
  post: PostWithForecasts | null;
  mode: "create" | "edit";
  conditionParentInit: PostWithForecasts | null;
  conditionChildInit: PostWithForecasts | null;
  tournament_id: number | null;
  tournaments: TournamentPreview[];
  siteMain: Tournament;
}> = ({
  post = null,
  mode = "create",
  conditionParentInit = null,
  conditionChildInit = null,
  tournament_id = null,
  tournaments,
  siteMain,
}) => {
  const router = useRouter();
  const t = useTranslations();
  const { isLive, isDone } = getQuestionStatus(post);
  const { user } = useAuth();
  if (isDone) {
    throw new Error(t("isDoneError"));
  }
  const [conditionParent, setConditionParent] =
    useState<PostWithForecasts | null>(conditionParentInit);
  const [conditionChild, setConditionChild] =
    useState<PostWithForecasts | null>(conditionChildInit);

  const control = useForm({
    resolver: zodResolver(conditionalQuestionSchema),
  });

  const submitQuestion = async (data: any) => {
    if (conditionParent?.id && conditionChild?.id) {
      let post_data: PostCreationData = {
        default_project: data["default_project"],
        conditional: {
          condition_id: conditionParent?.question?.id as number,
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

  const defaultProject = post
    ? post.projects.default_project
    : tournament_id
      ? [...tournaments, siteMain].filter((x) => x.id === tournament_id)[0]
      : siteMain;

  return (
    <main className="mb-4 mt-2 flex max-w-4xl flex-col justify-center self-center rounded-none bg-gray-0 px-4 py-4 pb-5 dark:bg-gray-0-dark md:m-8 md:mx-auto md:rounded-md md:px-8 md:pb-8 lg:m-12 lg:mx-auto">
      <BacktoCreate
        backText={t("create")}
        backHref="/questions/create"
        currentPage={t("conditionalPair")}
      />
      <div className="mt-0 text-sm text-gray-600 dark:text-gray-300 md:mt-1 md:text-base">
        {t("conditionalPairDescription")}
      </div>
      <form
        className="mt-4 flex w-full flex-col gap-6"
        onSubmit={async (e) => {
          if (!control.getValues("default_project")) {
            control.setValue("default_project", siteMain.id);
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
        {post && user?.is_superuser && (
          <a href={`/admin/posts/post/${post.id}/change`}>
            {t("viewInDjangoAdmin")}
          </a>
        )}
        <InputContainer>
          <ProjectPicker
            tournaments={tournaments}
            siteMain={siteMain}
            currentProject={defaultProject}
            onChange={(project) => {
              control.setValue("default_project", project.id);
            }}
          />
        </InputContainer>
        <InputContainer labelText={t("parentId")}>
          <Input
            readOnly={isLive && mode !== "create"}
            value={conditionParent?.id}
            className="rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
            type="number"
            {...control.register("condition_id", {
              setValueAs: (value: string) => {
                const valueAsNr = Number(value);
                if (valueAsNr == 0) {
                  return;
                }
                getPost(valueAsNr).then((res) => {
                  if (res && res.question?.type === QuestionType.Binary) {
                    setConditionParent(res);
                  } else {
                    setConditionParent(null);
                  }
                });
                return valueAsNr;
              },
            })}
            errors={control.formState.errors.condition_id}
          />
          {conditionParent?.question ? (
            <QuestionChartTile
              question={conditionParent?.question}
              authorUsername={conditionParent.author_username}
              curationStatus={conditionParent.curation_status}
            />
          ) : (
            <span className="text-xs normal-case text-gray-700 dark:text-gray-700-dark">
              {t("parentInputDescription")}
            </span>
          )}
        </InputContainer>
        <InputContainer labelText={t("childId")}>
          <Input
            readOnly={isLive && mode !== "create"}
            value={conditionChild?.id}
            className="rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
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
            <span className="text-xs normal-case text-gray-700 dark:text-gray-700-dark">
              {t("childInputDescription")}
            </span>
          )}
        </InputContainer>
        <Button type="submit" className="w-max capitalize">
          {mode === "create" ? t("createQuestion") : t("editQuestion")}
        </Button>
      </form>
    </main>
  );
};

export default ConditionalForm;
