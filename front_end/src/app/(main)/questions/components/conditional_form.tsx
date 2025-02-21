"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SetStateAction, useState } from "react";
import { FieldValues, useForm, UseFormReturn } from "react-hook-form";
import * as z from "zod";

import ProjectPickerInput from "@/app/(main)/questions/components/project_picker_input";
import PostDjangoAdminLink from "@/app/(main)/questions/create/components/django_admin_link";
import QuestionChartTile from "@/components/post_card/question_chart_tile";
import Button from "@/components/ui/button";
import { FormErrorMessage } from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { Post, PostWithForecasts } from "@/types/post";
import {
  Tournament,
  TournamentPreview,
  TournamentType,
} from "@/types/projects";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { logErrorWithScope } from "@/utils/errors";
import { getPostLink } from "@/utils/navigation";
import { getQuestionStatus } from "@/utils/questions";

import BacktoCreate from "./back_to_create";
import ConditionalQuestionPicker from "./conditional_question_picker";
import { createQuestionPost, updatePost } from "../actions";

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
  post: PostWithForecasts | undefined;
  mode: "create" | "edit";
  conditionParentInit: QuestionWithForecasts | null;
  conditionChildInit: QuestionWithForecasts | null;
  tournament_id?: number;
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

  const submitQuestion = async (data: FieldValues) => {
    setIsLoading(true);
    setError(undefined);
    const parentId = conditionParent?.id;
    const childId = conditionChild?.id;

    const post_data: PostCreationData = {
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
      ? ([...tournaments, siteMain].filter(
          (x) => x.id === tournament_id
        )[0] as Tournament)
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
        <PostDjangoAdminLink post={post} />

        {!community_id && defaultProject.type !== TournamentType.Community && (
          <ProjectPickerInput
            tournaments={tournaments}
            siteMain={siteMain}
            currentProject={defaultProject}
            onChange={(project) => {
              control.setValue("default_project", project.id);
            }}
          />
        )}
        <InputContainer labelText={t("parentQuestion")}>
          <ConditionalQuestionPicker
            onQuestionChange={(question: QuestionWithForecasts) => {
              setConditionQuestion(
                question,
                control,
                setConditionParent,
                "condition_id"
              );
            }}
            title={"Select Parent Question"}
            isParentQuestion={true}
            disabled={isLive && mode !== "create"}
          />
          <FormErrorMessage
            errors={control.formState.errors.condition_id?.message}
          />
          {conditionParent && (
            <>
              <h1 className="m-0 text-lg font-bold">{conditionParent.title}</h1>
              <QuestionChartTile
                question={conditionParent}
                authorUsername={conditionParent.author_username}
                // we expect status to be populated on BE for conditional questions
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                curationStatus={conditionParent.status!}
              />
            </>
          )}
        </InputContainer>
        <InputContainer labelText={t("childQuestion")}>
          <ConditionalQuestionPicker
            onQuestionChange={(question: QuestionWithForecasts) => {
              setConditionQuestion(
                question,
                control,
                setConditionChild,
                "condition_child_id"
              );
            }}
            title={"Select Child Question"}
            isParentQuestion={false}
            disabled={isLive && mode !== "create"}
          />
          <FormErrorMessage
            errors={control.formState.errors.condition_child_id?.message}
          />
          {conditionChild && (
            <>
              <h1 className="m-0 text-lg font-bold">{conditionChild.title}</h1>
              <QuestionChartTile
                question={conditionChild}
                authorUsername={conditionChild.author_username}
                // we expect status to be populated on BE for conditional questions
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                curationStatus={conditionChild.status!}
              />
            </>
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
  question: QuestionWithForecasts | null,
  control: UseFormReturn<{
    condition_id: string | undefined;
    condition_child_id: string | undefined;
    default_project: number | null;
  }>,
  setQuestionState: (
    value: SetStateAction<QuestionWithForecasts | null>
  ) => void,
  fieldName: "condition_id" | "condition_child_id"
) {
  control.clearErrors(fieldName);

  if (
    question &&
    (question.type === QuestionType.Binary ||
      (fieldName === "condition_child_id" &&
        (question.type === QuestionType.Numeric ||
          question.type === QuestionType.Date)))
  ) {
    setQuestionState(question);
    control.setValue(fieldName, question.id.toString());
    return question.id;
  } else {
    control.setError(fieldName, {
      type: "manual",
      message: "Invalid question type",
    });
    setQuestionState(null);
    control.setValue(fieldName, "");
  }
}

export default ConditionalForm;
