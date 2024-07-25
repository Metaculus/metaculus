"use client";
import { round } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import { createForecast } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { ErrorResponse } from "@/types/fetch";
import { ProjectPermissions } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { extractPrevBinaryForecastValue } from "@/utils/forecasts";

import BinarySlider, { BINARY_FORECAST_PRECISION } from "../binary_slider";
import ForecastMakerContainer from "../container";
import QuestionResolutionButton from "../resolution";

type Props = {
  question: QuestionWithNumericForecasts;
  prevForecast?: any;
  permission?: ProjectPermissions;
  canPredict: boolean;
  canResolve: boolean;
};

const ForecastMakerBinary: FC<Props> = ({
  question,
  prevForecast,
  permission,
  canPredict,
  canResolve,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  const communityForecast = question.forecasts.medians.at(-1);

  const prevForecastValue = extractPrevBinaryForecastValue(prevForecast);
  const [forecast, setForecast] = useState<number | null>(prevForecastValue);

  const [isForecastDirty, setIsForecastDirty] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ErrorResponse>();

  const handlePredictSubmit = async () => {
    setSubmitError(undefined);

    if (!user) {
      setCurrentModal({ type: "signup" });
      return;
    }

    if (forecast === null) return;

    const forecastValue = round(forecast / 100, BINARY_FORECAST_PRECISION);

    setIsSubmitting(true);
    const response = await createForecast(
      question.id,
      {
        continuousCdf: null,
        probabilityYes: forecastValue,
        probabilityYesPerCategory: null,
      },
      forecastValue
    );
    setIsForecastDirty(false);
    if ("errors" in response) {
      setSubmitError(response.errors);
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
      />
      <div className="flex flex-col items-center justify-center">
        {canPredict && (
          <Button
            variant="primary"
            disabled={!!user && (!isForecastDirty || isSubmitting)}
            onClick={handlePredictSubmit}
          >
            {user ? t("predictButton") : t("signUpButton")}
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
      <FormError errors={submitError} />
    </>
  );
};

export default ForecastMakerBinary;
