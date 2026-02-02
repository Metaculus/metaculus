"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isNil } from "lodash";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { FieldValues, useForm, UseFormReturn } from "react-hook-form";
import * as z from "zod";

import ProjectPickerInput from "@/app/(main)/questions/components/project_picker_input";
import QuestionTile from "@/components/post_card/question_tile";
import Button from "@/components/ui/button";
import { FormErrorMessage } from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useDebouncedCallback } from "@/hooks/use_debounce";
import { Post, PostWithForecasts, QuestionStatus } from "@/types/post";
import {
  Tournament,
  TournamentPreview,
  TournamentType,
} from "@/types/projects";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { logError } from "@/utils/core/errors";
import {
  deleteQuestionDraft,
  getQuestionDraft,
  saveQuestionDraft,
  QUESTION_DRAFT_DEBOUNCE_TIME,
} from "@/utils/drafts/questionForm";
import { getPostLink } from "@/utils/navigation";
import { getQuestionStatus } from "@/utils/questions/helpers";

import BacktoCreate from "./back_to_create";
import QuestionPicker, { SearchedQuestionType } from "./question_picker";
import { createQuestionPost, updatePost } from "../actions";

type PostCreationData = {
  default_project: number;
  conditional: {
    condition_id: number;
    condition_child_id: number;
  };
};

type ConditionalFormValues = {
  condition_id: string;
  condition_child_id: string;
  default_project?: number;
};

const createConditionalQuestionSchema = (
  t: ReturnType<typeof useTranslations>
) => {
  return z.object({
    condition_id: z.string().min(1, { message: t("errorRequired") }),
    condition_child_id: z.string().min(1, { message: t("errorRequired") }),
    default_project: z.number().optional(),
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
  shouldUseDraftValue: boolean;
}> = ({
  post = null,
  mode = "create",
  conditionParentInit = null,
  conditionChildInit = null,
  tournament_id = null,
  community_id = null,
  tournaments,
  siteMain,
  shouldUseDraftValue,
}) => {
  const router = useRouter();
  const t = useTranslations();
  const draftKey = `conditional`;
  const { isLive, isDone } = getQuestionStatus(post);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<
    (Error & { digest?: string }) | undefined
  >();

  if (isDone) {
    throw new Error(t("isDoneError"));
  }

  const isDraftMounted = useRef(false);
  const defaultProject = post
    ? post.projects.default_project
    : tournament_id
      ? ([...tournaments, siteMain].filter(
          (x) => x.id === tournament_id
        )[0] as Tournament)
      : siteMain;
  const [currentProject, setCurrentProject] =
    useState<Tournament>(defaultProject);

  const [conditionParent, setConditionParent] =
    useState<QuestionWithForecasts | null>(conditionParentInit);
  const [conditionChild, setConditionChild] =
    useState<QuestionWithForecasts | null>(conditionChildInit);

  const conditionalQuestionSchema = createConditionalQuestionSchema(t);
  const control = useForm<ConditionalFormValues>({
    mode: "all",
    resolver: zodResolver(conditionalQuestionSchema),
    defaultValues: {
      condition_id: conditionParentInit?.id
        ? conditionParentInit.id.toString()
        : "",
      condition_child_id: conditionChildInit?.id
        ? conditionChildInit.id.toString()
        : "",
      default_project: tournament_id ?? undefined,
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
          if (shouldUseDraftValue) {
            deleteQuestionDraft(draftKey);
          }
        }
        router.push(getPostLink(resp.post));
      }
    } catch (e) {
      const error = e as Error & { digest?: string };
      logError(error, { payload: post_data });
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (shouldUseDraftValue) {
      const draft = getQuestionDraft(draftKey);
      if (draft) {
        setCurrentProject(
          !isNil(draft.default_project) &&
            isNil(tournament_id) &&
            isNil(community_id)
            ? ([...tournaments, siteMain].filter(
                (x) => x.id === draft.default_project
              )[0] as Tournament)
            : defaultProject
        );
        setConditionParent(draft.condition ?? null);
        setConditionChild(draft.condition_child ?? null);
        control.reset(draft);
      }
      setTimeout(() => {
        isDraftMounted.current = true;
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormChange = useCallback(() => {
    if (shouldUseDraftValue) {
      const formData = control.getValues();
      saveQuestionDraft(draftKey, {
        default_project: formData.default_project as number,
        condition: conditionParent,
        condition_child: conditionChild,
        condition_id: conditionParent?.id.toString(),
        condition_child_id: conditionChild?.id.toString(),
      });
    }
  }, [control, shouldUseDraftValue, draftKey, conditionParent, conditionChild]);

  const debouncedHandleFormChange = useDebouncedCallback(
    handleFormChange,
    QUESTION_DRAFT_DEBOUNCE_TIME
  );
  // update draft when form values changes
  useEffect(() => {
    const subscription = control.watch(() => {
      if (shouldUseDraftValue && isDraftMounted.current) {
        debouncedHandleFormChange();
      }
    });
    return () => subscription.unsubscribe();
  }, [control, shouldUseDraftValue, debouncedHandleFormChange]);

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
        {!community_id && defaultProject.type !== TournamentType.Community && (
          <ProjectPickerInput
            tournaments={tournaments}
            siteMain={siteMain}
            currentProject={currentProject}
            onChange={(project) => {
              if (!project) return;
              control.setValue("default_project", project.id);
            }}
          />
        )}
        <InputContainer labelText={t("parentQuestion")}>
          <QuestionPicker
            onQuestionChange={(question: QuestionWithForecasts) => {
              setConditionQuestion({
                question,
                control,
                setQuestionState: setConditionParent,
                fieldName: "condition_id",
                t,
              });
            }}
            title={t("selectParentQuestion")}
            searchedQuestionType={SearchedQuestionType.Parent}
            disabled={isLive && mode !== "create"}
          />
          <FormErrorMessage
            errors={control.formState.errors.condition_id?.message}
          />
          {conditionParent && (
            <>
              <h1 className="m-0 text-lg font-bold">{conditionParent.title}</h1>
              <QuestionTile
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
          <QuestionPicker
            onQuestionChange={(question: QuestionWithForecasts) => {
              setConditionQuestion({
                question,
                control,
                setQuestionState: setConditionChild,
                fieldName: "condition_child_id",
                t,
              });
            }}
            title={t("selectChildQuestion")}
            searchedQuestionType={SearchedQuestionType.Child}
            disabled={isLive && mode !== "create"}
          />
          <FormErrorMessage
            errors={control.formState.errors.condition_child_id?.message}
          />
          {conditionChild && (
            <>
              <h1 className="m-0 text-lg font-bold">{conditionChild.title}</h1>
              <QuestionTile
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

function setConditionQuestion({
  question,
  control,
  setQuestionState,
  fieldName,
  t,
}: {
  question: QuestionWithForecasts | null;
  control: UseFormReturn<ConditionalFormValues>;
  setQuestionState: (
    value: SetStateAction<QuestionWithForecasts | null>
  ) => void;
  fieldName: "condition_id" | "condition_child_id";
  t: ReturnType<typeof useTranslations>;
}) {
  control.clearErrors(fieldName);
  if (
    question &&
    (question.type === QuestionType.Binary ||
      (fieldName === "condition_child_id" &&
        (question.type === QuestionType.Numeric ||
          question.type === QuestionType.Discrete ||
          question.type === QuestionType.Date)))
  ) {
    if (
      ![QuestionStatus.OPEN, QuestionStatus.UPCOMING].includes(
        question?.status ?? QuestionStatus.CLOSED
      )
    ) {
      control.setError(fieldName, {
        type: "manual",
        message: t("invalidQuestionStatus"),
      });
      setQuestionState(null);
      control.setValue(fieldName, "");
      return null;
    }
    setQuestionState(question);
    control.setValue(fieldName, question.id.toString());
    return question.id;
  } else {
    control.setError(fieldName, {
      type: "manual",
      message: t("invalidQuestionType"),
    });
    setQuestionState(null);
    control.setValue(fieldName, "");
    return null;
  }
}

export default ConditionalForm;
