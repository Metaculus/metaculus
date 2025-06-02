"use client";
import { round } from "lodash";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useEffect, useState } from "react";

import {
  createForecasts,
  withdrawForecasts,
} from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useAuth } from "@/contexts/auth_context";
import { useHideCP } from "@/contexts/cp_context";
import { useServerAction } from "@/hooks/use_server_action";
import { ErrorResponse } from "@/types/fetch";
import { PostWithForecasts, ProjectPermissions } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { sendPredictEvent } from "@/utils/analytics";
import { extractPrevBinaryForecastValue } from "@/utils/forecasts/initial_values";

import PredictionSuccessBox from "./prediction_success_box";
import BinarySlider, { BINARY_FORECAST_PRECISION } from "../binary_slider";
import {
  ForecastExpirationModal,
  ForecastExpirationValue,
  forecastExpirationToDate,
  useExpirationModalState,
} from "../forecast_expiration_modal";
import PredictButton from "../predict_button";
import QuestionResolutionButton from "../resolution";
import QuestionUnresolveButton from "../resolution/unresolve_button";

type Props = {
  post: PostWithForecasts;
  question: QuestionWithNumericForecasts;
  prevForecast?: any;
  permission?: ProjectPermissions;
  canPredict: boolean;
  canResolve: boolean;
  predictionMessage?: ReactNode;
  onPredictionSubmit?: () => void;
};

const ForecastMakerBinary: FC<Props> = ({
  post,
  question,
  permission,
  canPredict,
  canResolve,
  predictionMessage,
  onPredictionSubmit,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hideCP } = useHideCP();
  const latest = question.aggregations.recency_weighted.latest;
  const communityForecast =
    latest && !latest.end_time ? latest?.centers?.[0] : undefined;

  const activeUserForecast =
    (question.my_forecasts?.latest?.end_time ||
      new Date().getTime() / 1000 + 1000) <=
    new Date().getTime() / 1000
      ? undefined
      : question.my_forecasts?.latest;

  const prevForecastValue = extractPrevBinaryForecastValue(
    activeUserForecast?.forecast_values[1]
  );
  const hasUserForecast = !!prevForecastValue;
  const [forecast, setForecast] = useState<number | null>(prevForecastValue);

  const [isForecastDirty, setIsForecastDirty] = useState(false);
  const [showSuccessBox, setShowSuccessBox] = useState(false);

  const pathname = usePathname();

  const router = useRouter();

  useEffect(() => {
    setForecast(prevForecastValue);
  }, [prevForecastValue]);

  const questionDuration =
    new Date(question.scheduled_close_time).getTime() -
    new Date(question.open_time ?? question.created_at).getTime();

  const {
    modalSavedState,
    setModalSavedState,
    expirationShortChip,
    isForecastExpirationModalOpen,
    setIsForecastExpirationModalOpen,
    previousForecastExpirationString,
  } = useExpirationModalState(questionDuration, question.my_forecasts?.latest);

  const [submitError, setSubmitError] = useState<ErrorResponse>();
  const handlePredictSubmit = async (
    forecastExpiration: ForecastExpirationValue
  ) => {
    setSubmitError(undefined);

    if (forecast === null) return;

    sendPredictEvent(post, question, hideCP);

    const forecastValue = round(forecast / 100, BINARY_FORECAST_PRECISION);
    const response = await createForecasts(post.id, [
      {
        questionId: question.id,
        forecastData: {
          continuousCdf: null,
          probabilityYes: forecastValue,
          probabilityYesPerCategory: null,
        },
        forecastEndTime: forecastExpirationToDate(forecastExpiration),
      },
    ]);
    setIsForecastDirty(false);

    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
    } else {
      setShowSuccessBox(true);
    }
    onPredictionSubmit?.();
  };
  const [submit, isPending] = useServerAction(handlePredictSubmit);

  const handlePredictWithdraw = async () => {
    setSubmitError(undefined);

    if (!prevForecastValue) return;

    const response = await withdrawForecasts(post.id, [
      {
        question: question.id,
      },
    ]);
    setIsForecastDirty(false);

    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
    }
    onPredictionSubmit?.();
  };
  const [withdraw, withdrawalIsPending] = useServerAction(
    handlePredictWithdraw
  );

  return (
    <>
      <ForecastExpirationModal
        savedState={modalSavedState}
        setSavedState={setModalSavedState}
        isOpen={isForecastExpirationModalOpen}
        onClose={() => {
          setIsForecastExpirationModalOpen(false);
        }}
        onReaffirm={hasUserForecast && !isForecastDirty ? submit : undefined}
        questionDuration={questionDuration}
      />

      <BinarySlider
        forecast={forecast}
        onChange={setForecast}
        isDirty={isForecastDirty}
        communityForecast={!!user && hideCP ? null : communityForecast}
        onBecomeDirty={() => {
          setIsForecastDirty(true);
          setShowSuccessBox(false);
        }}
        disabled={!canPredict}
      />

      {predictionMessage && (
        <div className="mb-2 text-center text-sm italic text-gray-700 dark:text-gray-700-dark">
          {predictionMessage}
        </div>
      )}
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-3">
            {canPredict && (
              <>
                {!!prevForecastValue && (
                  <Button
                    variant="secondary"
                    type="submit"
                    disabled={withdrawalIsPending}
                    onClick={withdraw}
                  >
                    {t("withdraw")}
                  </Button>
                )}
                <PredictButton
                  hasUserForecast={hasUserForecast}
                  isDirty={isForecastDirty}
                  isPending={isPending}
                  onSubmit={() => submit(modalSavedState.forecastExpiration)}
                  predictLabel={t("predict")}
                  predictionExpirationChip={expirationShortChip}
                  onPredictionExpirationClick={() =>
                    setIsForecastExpirationModalOpen(true)
                  }
                />
              </>
            )}
          </div>

          {previousForecastExpirationString && (
            <span className="text-xs text-salmon-800 dark:text-salmon-800-dark">
              {t("predictionExpirationText", {
                time: previousForecastExpirationString,
              })}
            </span>
          )}
        </div>

        <FormError
          errors={submitError}
          className="mt-2 flex items-center justify-center"
          detached
        />
        {(isPending || withdrawalIsPending) && (
          <div className="h-[32px] w-full">
            <LoadingIndicator />
          </div>
        )}

        {showSuccessBox && !isPending && (
          <PredictionSuccessBox
            post={post}
            forecastValue={forecast ? `${forecast}%` : "-"}
            onCommentClick={() => {
              router.push(`${pathname}?action=comment-with-forecast`);
            }}
            className="mb-4 w-full justify-center"
          />
        )}

        <QuestionUnresolveButton question={question} permission={permission} />

        {canResolve && (
          <QuestionResolutionButton
            question={question}
            permission={permission}
          />
        )}
      </div>
    </>
  );
};

export default ForecastMakerBinary;
