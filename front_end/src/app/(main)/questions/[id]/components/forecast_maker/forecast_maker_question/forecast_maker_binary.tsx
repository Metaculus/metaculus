"use client";
import { round } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, useEffect, useState } from "react";

import { createForecasts } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { FormErrorMessage } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { ErrorResponse } from "@/types/fetch";
import { ProjectPermissions } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { extractPrevBinaryForecastValue } from "@/utils/forecasts";

import BinarySlider, { BINARY_FORECAST_PRECISION } from "../binary_slider";
import QuestionResolutionButton from "../resolution";

type Props = {
  postId: number;
  question: QuestionWithNumericForecasts;
  prevForecast?: any;
  permission?: ProjectPermissions;
  canPredict: boolean;
  canResolve: boolean;
};

const ForecastMakerBinary: FC<Props> = ({
  postId,
  question,
  prevForecast,
  permission,
  canPredict,
  canResolve,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  const communityForecast =
    question.aggregations.recency_weighted.latest?.centers![0];

  const prevForecastValue = extractPrevBinaryForecastValue(prevForecast);
  const [forecast, setForecast] = useState<number | null>(prevForecastValue);

  const [isForecastDirty, setIsForecastDirty] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ErrorResponse>();

  useEffect(() => {
    setForecast(prevForecastValue);
  }, [prevForecast]);

  const handlePredictSubmit = async () => {
    setSubmitError(undefined);

    if (!user) {
      setCurrentModal({ type: "signup" });
      return;
    }

    if (forecast === null) return;

    const forecastValue = round(forecast / 100, BINARY_FORECAST_PRECISION);

    setIsSubmitting(true);
    const response = await createForecasts(postId, [
      {
        questionId: question.id,
        forecastData: {
          continuousCdf: null,
          probabilityYes: forecastValue,
          probabilityYesPerCategory: null,
        },
        sliderValues: forecastValue,
      },
    ]);
    setIsForecastDirty(false);

    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors[0]);
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <BinarySlider
        forecast={forecast}
        onChange={setForecast}
        isDirty={isForecastDirty}
        communityForecast={communityForecast}
        onBecomeDirty={() => {
          setIsForecastDirty(true);
        }}
        disabled={!canPredict}
      />
      <div className="flex flex-col items-center justify-center">
        {canPredict && (
          <Button
            variant="primary"
            disabled={!!user && (!isForecastDirty || isSubmitting)}
            onClick={handlePredictSubmit}
          >
            {user ? t("predict") : t("signUpToPredict")}
          </Button>
        )}
        {canResolve && (
          <QuestionResolutionButton
            question={question}
            permission={permission}
            className="mt-4"
          />
        )}
      </div>
      <FormErrorMessage errors={submitError} />
    </>
  );
};

export default ForecastMakerBinary;
