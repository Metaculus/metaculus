"use client";
import { round } from "lodash";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useEffect, useState } from "react";

import {
  createForecasts,
  withdrawForecasts,
} from "@/app/(main)/questions/actions";
import ForecastPredictionMessage from "@/components/forecast_maker/prediction_message";
import { FormError } from "@/components/ui/form_field";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useAuth } from "@/contexts/auth_context";
import { useHideCP } from "@/contexts/cp_context";
import { useServerAction } from "@/hooks/use_server_action";
import { ErrorResponse } from "@/types/fetch";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { sendPredictEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import { isForecastActive } from "@/utils/forecasts/helpers";
import { extractPrevBinaryForecastValue } from "@/utils/forecasts/initial_values";

import PredictionSuccessBox from "./prediction_success_box";
import BinarySlider, { BINARY_FORECAST_PRECISION } from "../binary_slider";
import {
  ForecastExpirationModal,
  forecastExpirationToDate,
  ForecastExpirationValue,
  useExpirationModalState,
} from "../forecast_expiration";
import PredictButton from "../predict_button";
import WithdrawButton from "../withdraw/withdraw_button";

type Props = {
  post: PostWithForecasts;
  question: QuestionWithNumericForecasts;
  prevForecast?: number | null;
  canPredict: boolean;
  predictionMessage?: ReactNode;
  onPredictionSubmit?: () => void;
};

const ForecastMakerBinary: FC<Props> = ({
  post,
  question,
  canPredict,
  predictionMessage,
  onPredictionSubmit,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hideCP } = useHideCP();
  const latest =
    question.aggregations[question.default_aggregation_method].latest;
  const communityForecast =
    latest && isForecastActive(latest) ? latest?.centers?.[0] : undefined;

  const activeUserForecast =
    question.my_forecasts?.latest &&
    isForecastActive(question.my_forecasts.latest)
      ? question.my_forecasts.latest
      : undefined;

  const previousUserForecast = question.my_forecasts?.latest;

  const prevForecastValue = extractPrevBinaryForecastValue(
    previousUserForecast?.forecast_values[1]
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
    previousForecastExpiration,
  } = useExpirationModalState(questionDuration, question.my_forecasts?.latest);

  const [submitError, setSubmitError] = useState<ErrorResponse>();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
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

    if (!activeUserForecast) return;

    const response = await withdrawForecasts(post.id, [
      {
        question: question.id,
      },
    ]);
    setIsForecastDirty(false);

    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
    }
    setIsWithdrawModalOpen(false);
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
        onSubmit={submit}
        hasUserForecast={hasUserForecast}
        isUserForecastActive={!!activeUserForecast}
        isDirty={isForecastDirty}
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

      <ForecastPredictionMessage predictionMessage={predictionMessage} />
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-3">
            {canPredict && (
              <>
                {!!activeUserForecast && (
                  <WithdrawButton
                    isPromptOpen={isWithdrawModalOpen}
                    isPending={withdrawalIsPending}
                    onSubmit={withdraw}
                    onPromptVisibilityChange={setIsWithdrawModalOpen}
                  >
                    {t("withdraw")}
                  </WithdrawButton>
                )}
                <PredictButton
                  hasUserForecast={hasUserForecast}
                  isUserForecastActive={!!activeUserForecast}
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

          {previousForecastExpiration && (
            <span
              className={cn(
                "text-center text-xs text-gray-800 dark:text-gray-800-dark",
                previousForecastExpiration.expiresSoon &&
                  "text-salmon-800 dark:text-salmon-800-dark"
              )}
            >
              {previousForecastExpiration.isExpired
                ? t("predictionWithdrawnText", {
                    time: previousForecastExpiration.string,
                  })
                : t("predictionWillBeWithdrawInText", {
                    time: previousForecastExpiration.string,
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
      </div>
    </>
  );
};

export default ForecastMakerBinary;
