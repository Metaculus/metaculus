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
import { FormErrorMessage } from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useAuth } from "@/contexts/auth_context";
import { Post, PostWithForecasts } from "@/types/post";
import { Tournament, TournamentPreview, TournamentType } from "@/types/projects";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { logErrorWithScope } from "@/utils/errors";
import { getPostLink } from "@/utils/navigation";
import { getQuestionStatus, parseQuestionId } from "@/utils/questions";

import BacktoCreate from "./back_to_create";
import ConditionalQuestionInput from "./conditional_question_inpu";
import {
  createQuestionPost,
  getPost,
  getQuestion,
  updatePost,
} from "../actions";

type PostCreationData = {
  default_project: number;
  conditional: {
    condition_id: number;
    condition_child_id: number;
  };
};

const createConditionalQuestionSchema = (
  t: ReturnType<typeof useTranslations>
) => {
  return z.object({
    condition_id: z.string().min(1, { message: t("errorRequired") }),
    condition_child_id: z.string().min(1, { message: t("errorRequired") }),
    default_project: z.number(),
  });
};

const ConditionalForm: React.FC<{
  post: PostWithForecasts | null;
  mode: "create" | "edit";
  conditionParentInit: QuestionWithForecasts | null;
  conditionChildInit: QuestionWithForecasts | null;
  tournament_id: number | null;
  community_id?: number;
  tournaments: TournamentPreview[];
  siteMain: Tournament;
}> = ({
  post = null,
  mode = "create",
  conditionParentInit = null,
  conditionChildInit = null,
  tournament_id = null,
  community_id = null,
  tournaments,
  siteMain,
}) => {
  const router = useRouter();
  const t = useTranslations();
  const { isLive, isDone } = getQuestionStatus(post);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>();
  const [error, setError] = useState<
    (Error & { digest?: string }) | undefined
  >();

  if (isDone) {
    throw new Error(t("isDoneError"));
  }
  const [conditionParent, setConditionParent] =
    useState<QuestionWithForecasts | null>(conditionParentInit);
  const [conditionChild, setConditionChild] =
    useState<QuestionWithForecasts | null>(conditionChildInit);

  const conditionalQuestionSchema = createConditionalQuestionSchema(t);
  const control = useForm({
    mode: "all",
    resolver: zodResolver(conditionalQuestionSchema),
    defaultValues: {
      condition_id: conditionParentInit?.id.toString(),
      condition_child_id: conditionChild?.id.toString(),
      default_project: tournament_id,
    },
  });

  const submitQuestion = async (data: any) => {
    setIsLoading(true);
    setError(undefined);
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

    let post_data: PostCreationData = {
      default_project: data["default_project"],
      conditional: {
        condition_id: parentId as number,
        condition_child_id: childId as number,
      },
    };
    try {
      if (parentId && childId) {
        let resp: { post: Post };

        if (mode == "edit") {
          resp = await updatePost(post?.id as number, post_data);
        } else {
          resp = await createQuestionPost(post_data);
        }

        router.push(getPostLink(resp.post));
      }
    } catch (e) {
      const error = e as Error & { digest?: string };
      logErrorWithScope(error, post_data);
      setError(error);
    } finally {
      setIsLoading(false);
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
            control.setValue(
              "default_project",
              community_id ? community_id : defaultProject.id
            );
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
        {(!community_id ||
          defaultProject.type !== TournamentType.Community) && (
          <ProjectPickerInput
            tournaments={tournaments}
            siteMain={siteMain}
            currentProject={defaultProject}
            onChange={(project) => {
              control.setValue("default_project", project.id);
            }}
          />
        )}
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
          {conditionParent ? (
            <QuestionChartTile
              question={conditionParent}
              authorUsername={conditionParent.author_username}
              curationStatus={conditionParent.status!}
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
          {conditionChild ? (
            <QuestionChartTile
              question={conditionChild}
              authorUsername={conditionChild.author_username}
              curationStatus={conditionChild.status!}
            />
          ) : (
            <span className="text-xs normal-case text-gray-700 dark:text-gray-700-dark">
              {t("childInputDescription")}
            </span>
          )}
        </InputContainer>

        <div className="flex-col">
          <div className="-mt-2 min-h-[32px] flex-col">
            {isLoading && <LoadingIndicator />}
            {!isLoading && <FormErrorMessage errors={error?.digest} />}
          </div>
          <Button
            type="submit"
            className="w-max capitalize"
            disabled={isLoading}
          >
            {mode === "create" ? t("createQuestion") : t("editQuestion")}
          </Button>
        </div>
      </form>
    </main>
  );
};

async function setConditionQuestion(
  control: UseFormReturn<
    {
      condition_id: string | undefined;
      condition_child_id: string | undefined;
      default_project: number | null;
    },
    any,
    undefined
  >,
  setQuestionState: (
    value: SetStateAction<QuestionWithForecasts | null>
  ) => void,
  fieldName: "condition_id" | "condition_child_id"
) {
  control.clearErrors(fieldName);
  const parsedInput = parseQuestionId(control.getValues(fieldName) ?? "");
  try {
    let question: QuestionWithForecasts | null = null;
    if (parsedInput.questionId) {
      question = await getQuestion(parsedInput.questionId!);
    } else {
      const post = await getPost(parsedInput.postId!);
      question = post.question!;
    }
    if (
      question &&
      (question.type === QuestionType.Binary ||
        (fieldName === "condition_child_id" &&
          (question.type === QuestionType.Numeric ||
            question.type === QuestionType.Date)))
    ) {
      setQuestionState(question);
      return question.id;
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
