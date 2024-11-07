"use client";
import { faEllipsis, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { round } from "lodash";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import React, {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createForecasts } from "@/app/(main)/questions/actions";
import GroupQuestionResolution from "@/components/group_question_resolution";
import Button from "@/components/ui/button";
import { FormErrorMessage } from "@/components/ui/form_field";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { useAuth } from "@/contexts/auth_context";
import { useServerAction } from "@/hooks/use_server_action";
import { ErrorResponse } from "@/types/fetch";
import {
  Post,
  PostWithForecasts,
  ProjectPermissions,
  QuestionStatus,
  Resolution,
} from "@/types/post";
import {
  PredictionInputMessage,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { ThemeColor } from "@/types/theme";
import { extractPrevBinaryForecastValue } from "@/utils/forecasts";
import { extractQuestionGroupName } from "@/utils/questions";

import ForecastMakerGroupControls from "./forecast_maker_group_menu";
import { SLUG_POST_SUB_QUESTION_ID } from "../../../search_params";
import { useHideCP } from "../../cp_provider";
import {
  BINARY_FORECAST_PRECISION,
  BINARY_MAX_VALUE,
  BINARY_MIN_VALUE,
} from "../binary_slider";
import ForecastChoiceOption from "../forecast_choice_option";
import PredictButton from "../predict_button";
import ScoreDisplay from "../resolution/score_display";

type QuestionOption = {
  id: number;
  name: string;
  communityForecast: number | null;
  forecast: number | null;
  resolution: Resolution | null;
  isDirty: boolean;
  color: ThemeColor;
  menu: ReactNode;
  status?: QuestionStatus;
};

type Props = {
  post: PostWithForecasts;
  questions: QuestionWithNumericForecasts[];
  canPredict: boolean;
  canResolve: boolean;
  predictionMessage: PredictionInputMessage;
};

const ForecastMakerGroupBinary: FC<Props> = ({
  post,
  questions,
  canPredict,
  canResolve,
  predictionMessage,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hideCP } = useHideCP();
  const params = useSearchParams();
  const subQuestionId = Number(params.get(SLUG_POST_SUB_QUESTION_ID));

  const { id: postId, user_permission: permission } = post;

  const prevForecastValuesMap = useMemo(
    () =>
      questions.reduce<Record<number, number | null>>(
        (acc, question) => ({
          ...acc,
          [question.id]: extractPrevBinaryForecastValue(
            question.my_forecasts?.latest?.forecast_values[1]
          ),
        }),
        {}
      ),
    [questions]
  );
  const hasUserForecast = useMemo(
    () => Object.values(prevForecastValuesMap).some((v) => v !== null),
    [prevForecastValuesMap]
  );
  const [questionOptions, setQuestionOptions] = useState<QuestionOption[]>(
    generateChoiceOptions(questions, prevForecastValuesMap, undefined, post)
  );

  const sortedQuestionOptions = [...questionOptions].sort((a, b) => {
    if (!!subQuestionId) {
      if (a.id === subQuestionId) {
        return -1;
      } else if (b.id === subQuestionId) {
        return 1;
      }
    }
    return 0;
  });

  const [highlightedQuestionId, setHighlightedQuestionId] = useState<
    number | undefined
  >(subQuestionId || questionOptions.at(0)?.id);
  const highlightedQuestion = useMemo(
    () => questions.find((q) => q.id === highlightedQuestionId),
    [questions, highlightedQuestionId]
  );

  useEffect(() => {
    setQuestionOptions(
      generateChoiceOptions(questions, prevForecastValuesMap, permission, post)
    );
  }, [permission, prevForecastValuesMap, questions]);

  const [submitErrors, setSubmitErrors] = useState<ErrorResponse[]>([]);
  const questionsToSubmit = useMemo(
    () => questionOptions.filter((option) => option.forecast !== null),
    [questionOptions]
  );

  const isPickerDirty = useMemo(
    () => questionOptions.some((option) => option.isDirty),
    [questionOptions]
  );

  const resetForecasts = useCallback(() => {
    setQuestionOptions((prev) =>
      prev.map((prevQuestion) => ({
        ...prevQuestion,
        isDirty: false,
        forecast: prevForecastValuesMap[prevQuestion.id] ?? null,
      }))
    );
  }, [prevForecastValuesMap]);
  const handleForecastChange = useCallback((id: number, forecast: number) => {
    setQuestionOptions((prev) =>
      prev.map((prevQuestion) => {
        if (prevQuestion.id === id) {
          return { ...prevQuestion, isDirty: true, forecast };
        }

        return prevQuestion;
      })
    );
  }, []);
  const handlePredictSubmit = useCallback(async () => {
    setSubmitErrors([]);

    if (!questionsToSubmit.length) {
      return;
    }

    const response = await createForecasts(
      postId,
      questionsToSubmit.map((q) => {
        const forecastValue = round(
          q.forecast! / 100,
          BINARY_FORECAST_PRECISION
        );

        return {
          questionId: q.id,
          forecastData: {
            probabilityYes: forecastValue,
            probabilityYesPerCategory: null,
            continuousCdf: null,
          },
        };
      })
    );
    setQuestionOptions((prev) =>
      prev.map((prevQuestion) => ({ ...prevQuestion, isDirty: false }))
    );

    const errors: ErrorResponse[] = [];
    if (response && "errors" in response && !!response.errors) {
      for (const response_errors of response.errors) {
        errors.push(response_errors);
      }
    }
    if (errors.length) {
      setSubmitErrors(errors);
    }
  }, [postId, questionsToSubmit]);
  const [submit, isPending] = useServerAction(handlePredictSubmit);
  return (
    <>
      <table className="mt-3 border-separate rounded border border-gray-300 bg-gray-0 dark:border-gray-300-dark dark:bg-gray-0-dark">
        <thead>
          <tr>
            <th className="bg-blue-100 p-2 text-left text-xs font-bold dark:bg-blue-100-dark">
              {t("Candidates")}
            </th>
            <th className="bg-blue-100 p-2 pr-4 text-right text-xs dark:bg-blue-100-dark">
              <FontAwesomeIcon
                icon={faUserGroup}
                size="sm"
                className="align-middle text-olive-700 dark:text-olive-700-dark"
              />
            </th>
            <th
              className="hidden bg-blue-100 p-2 text-left text-xs font-bold text-orange-800 dark:bg-blue-100-dark dark:text-orange-800-dark sm:table-cell"
              colSpan={2}
            >
              My Prediction
            </th>
            <th className="bg-blue-100 p-2 text-center text-xs font-bold text-orange-800 dark:bg-blue-100-dark dark:text-orange-800-dark sm:hidden">
              Me
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedQuestionOptions.map((questionOption) => (
            <ForecastChoiceOption
              key={questionOption.id}
              id={questionOption.id}
              highlightedOptionId={highlightedQuestionId}
              onOptionClick={setHighlightedQuestionId}
              forecastValue={questionOption.forecast}
              defaultSliderValue={50}
              choiceName={questionOption.name}
              choiceColor={questionOption.color}
              communityForecast={
                !user || !hideCP ? questionOption.communityForecast : null
              }
              inputMin={BINARY_MIN_VALUE}
              inputMax={BINARY_MAX_VALUE}
              onChange={handleForecastChange}
              isDirty={questionOption.isDirty}
              isRowDirty={questionOption.isDirty}
              menu={questionOption.menu}
              disabled={
                !canPredict || questionOption.status != QuestionStatus.OPEN
              }
              optionResolution={{
                resolution: questionOption.resolution,
                type: "group_question",
              }}
            />
          ))}
        </tbody>
      </table>
      {predictionMessage && (
        <div className="mb-2 text-center text-sm italic text-gray-700 dark:text-gray-700-dark">
          {t(predictionMessage)}
        </div>
      )}
      {!!highlightedQuestion?.resolution && (
        <div className="flex flex-row items-center justify-center gap-1.5 truncate py-2 text-gray-900 dark:text-gray-900-dark">
          <GroupQuestionResolution
            question={highlightedQuestion}
            resolution={highlightedQuestion.resolution}
          />
        </div>
      )}
      {canPredict && (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 px-4">
            {!!user && (
              <Button
                variant="secondary"
                type="reset"
                onClick={resetForecasts}
                disabled={!isPickerDirty}
              >
                {t("discardChangesButton")}
              </Button>
            )}

            <PredictButton
              onSubmit={submit}
              isDirty={isPickerDirty}
              hasUserForecast={hasUserForecast}
              isPending={isPending}
              isDisabled={!questionsToSubmit.length}
            />
          </div>
          {submitErrors.map((errResponse, index) => (
            <FormErrorMessage
              className="mt-2 flex justify-center"
              key={`error-${index}`}
              errors={errResponse}
            />
          ))}
          <div className="h-[32px] w-full">
            {isPending && <LoadingIndicator />}
          </div>
        </>
      )}
      {highlightedQuestion && <ScoreDisplay question={highlightedQuestion} />}
    </>
  );
};

function generateChoiceOptions(
  questions: QuestionWithNumericForecasts[],
  prevForecastValuesMap: Record<number, number | null>,
  permission?: ProjectPermissions,
  post?: Post
): QuestionOption[] {
  return questions.map((question, index) => {
    return {
      id: question.id,
      name: extractQuestionGroupName(question.title),
      communityForecast:
        question.aggregations.recency_weighted.latest?.centers![0] ?? null,
      forecast: prevForecastValuesMap[question.id] ?? null,
      resolution: question.resolution,
      isDirty: false,
      color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
      status: question.status,
      menu: (
        <ForecastMakerGroupControls
          question={question}
          permission={permission}
          button={
            <Button className="h-8 w-8" variant="tertiary">
              <FontAwesomeIcon icon={faEllipsis}></FontAwesomeIcon>
            </Button>
          }
          post={post}
        />
      ),
    };
  });
}

export default ForecastMakerGroupBinary;
