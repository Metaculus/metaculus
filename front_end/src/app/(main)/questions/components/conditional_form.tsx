"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SetStateAction, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import * as z from "zod";

import ProjectPickerInput from "@/app/(main)/questions/components/project_picker_input";
import QuestionChartTile from "@/components/post_card/question_chart_tile";
import Button from "@/components/ui/button";
import { InputContainer } from "@/components/ui/input_container";
import { useAuth } from "@/contexts/auth_context";
import { PostWithForecasts } from "@/types/post";
import { Tournament, TournamentPreview } from "@/types/projects";
import { QuestionType } from "@/types/question";
import { getQuestionStatus, parseQuestionId } from "@/utils/questions";

import BacktoCreate from "./back_to_create";
import ConditionalQuestionInput from "./conditional_question_inpu";
import { createQuestionPost, getPost, updatePost } from "../actions";

type PostCreationData = {
  default_project: number[];
  conditional: {
    condition_id: number;
    condition_child_id: number;
  };
};
const conditionalQuestionSchema = z.object({
  condition_id: z.string().min(1, { message: "Required" }),
  condition_child_id: z.string().min(1, { message: "Required" }),
  default_project: z
    .array(z.number())
    .nonempty({ message: "At least one project is required" }),
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
    defaultValues: {
      condition_id: conditionParentInit?.id.toString(),
      condition_child_id: conditionChild?.id.toString(),
      default_project: [tournament_id],
    },
  });

  const submitQuestion = async (data: any) => {
    let parentId = conditionParent?.id;
    let childId = conditionChild?.id;
    if (!parentId) {
      parentId = await setConditionQuestion(
        control,
        setConditionParent,
        "condition_id"
      );
    }
    if (!childId) {
      childId = await setConditionQuestion(
        control,
        setConditionChild,
        "condition_child_id"
      );
    }

    if (parentId && childId) {
      let post_data: PostCreationData = {
        default_project: data["default_project"],
        conditional: {
          condition_id: parentId as number,
          condition_child_id: childId as number,
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
            control.setValue("default_project", [siteMain.id]);
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
        <ProjectPickerInput
          tournaments={tournaments}
          siteMain={siteMain}
          currentProject={defaultProject}
          onChange={(project) => {
            control.setValue("default_project", project);
          }}
        />
        <InputContainer labelText={t("parentId")}>
          <ConditionalQuestionInput
            isLive={isLive}
            mode={mode}
            control={control}
            fieldName="condition_id"
            setConditionQuestion={() =>
              setConditionQuestion(control, setConditionParent, "condition_id")
            }
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
          <ConditionalQuestionInput
            isLive={isLive}
            mode={mode}
            control={control}
            fieldName="condition_child_id"
            setConditionQuestion={() =>
              setConditionQuestion(
                control,
                setConditionChild,
                "condition_child_id"
              )
            }
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

async function setConditionQuestion(
  control: UseFormReturn<
    {
      condition_id: string | undefined;
      condition_child_id: string | undefined;
      default_project: (number | null)[];
    },
    any,
    undefined
  >,
  setQuestionState: (value: SetStateAction<PostWithForecasts | null>) => void,
  fieldName: "condition_id" | "condition_child_id"
) {
  control.clearErrors(fieldName);
  const conditionalQuestionParentId = parseQuestionId(
    control.getValues(fieldName) ?? ""
  );
  try {
    const res = await getPost(Number(conditionalQuestionParentId));
    if (res && res.question?.type === QuestionType.Binary) {
      setQuestionState(res);
      return res.id;
    } else {
      control.setError(fieldName, {
        type: "manual",
        message: "Invalid question type",
      });
      setQuestionState(null);
    }
  } catch (e) {
    control.setError(fieldName, {
      type: "manual",
      message: "Invalid question ID/URL",
    });
    setQuestionState(null);
  }
}

export default ConditionalForm;
