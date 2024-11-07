"use client";
import { round } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, useEffect, useState } from "react";

import { createForecasts } from "@/app/(main)/questions/actions";
import { FormErrorMessage } from "@/components/ui/form_field";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useAuth } from "@/contexts/auth_context";
import { useServerAction } from "@/hooks/use_server_action";
import { ErrorResponse } from "@/types/fetch";
import { PostWithForecasts, ProjectPermissions } from "@/types/post";
import {
  PredictionInputMessage,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { extractPrevBinaryForecastValue } from "@/utils/forecasts";

import { sendGAPredictEvent } from "./ga_events";
import { useHideCP } from "../../cp_provider";
import BinarySlider, { BINARY_FORECAST_PRECISION } from "../binary_slider";
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
  predictionMessage?: PredictionInputMessage;
};

const ForecastMakerBinary: FC<Props> = ({
  post,
  question,
  prevForecast,
  permission,
  canPredict,
  canResolve,
  predictionMessage,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hideCP } = useHideCP();
  const communityForecast =
    question.aggregations.recency_weighted.latest?.centers![0];

  const prevForecastValue = extractPrevBinaryForecastValue(prevForecast);
  const hasUserForecast = !!prevForecastValue;
  const [forecast, setForecast] = useState<number | null>(prevForecastValue);

  const [isForecastDirty, setIsForecastDirty] = useState(false);

  const [submitError, setSubmitError] = useState<ErrorResponse>();

  useEffect(() => {
    setForecast(prevForecastValue);
  }, [prevForecastValue]);

  const handlePredictSubmit = async () => {
    setSubmitError(undefined);

    if (forecast === null) return;

    sendGAPredictEvent(post, question, hideCP);

    const forecastValue = round(forecast / 100, BINARY_FORECAST_PRECISION);
    const response = await createForecasts(post.id, [
      {
        questionId: question.id,
        forecastData: {
          continuousCdf: null,
          probabilityYes: forecastValue,
          probabilityYesPerCategory: null,
        },
      },
    ]);
    setIsForecastDirty(false);

    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors[0]);
    }
  };
  const [submit, isPending] = useServerAction(handlePredictSubmit);
  return (
    <>
      <BinarySlider
        forecast={forecast}
        onChange={setForecast}
        isDirty={isForecastDirty}
        communityForecast={!!user && hideCP ? null : communityForecast}
        onBecomeDirty={() => {
          setIsForecastDirty(true);
        }}
        disabled={!canPredict}
      />
      {predictionMessage && (
        <div className="mb-2 text-center text-sm italic text-gray-700 dark:text-gray-700-dark">
          {t(predictionMessage)}
        </div>
      )}
      <div className="flex flex-col items-center justify-center">
        {canPredict && (
          <>
            <PredictButton
              hasUserForecast={hasUserForecast}
              isDirty={isForecastDirty}
              isPending={isPending}
              onSubmit={submit}
              predictLabel={t("predict")}
            />
            <FormErrorMessage
              className="mt-2 flex justify-center"
              errors={submitError}
            />
            <div className="h-[32px] w-full">
              {isPending && <LoadingIndicator />}
            </div>
          </>
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
