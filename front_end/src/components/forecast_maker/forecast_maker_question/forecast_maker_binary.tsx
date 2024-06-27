"use client";
import { round } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import { createForecast } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import QuestionResolutionModal from "@/components/forecast_maker/resolution/resolution_modal_binary";
import Button from "@/components/ui/button";
import { FormError, Input } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { ErrorResponse } from "@/types/fetch";
import { ProjectPermissions } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { extractPrevBinaryForecastValue } from "@/utils/forecasts";

import BinarySlider, { BINARY_FORECAST_PRECISION } from "../binary_slider";

type Props = {
  question: QuestionWithNumericForecasts;
  prevForecast?: any;
  permission?: ProjectPermissions;
};

const ForecastMakerBinary: FC<Props> = ({
  question,
  prevForecast,
  permission,
}) => {
  const t = useTranslations();
  const { user } = useAuth();

  const communityForecast = question.forecasts.values_mean.at(-1);

  const prevForecastValue = extractPrevBinaryForecastValue(prevForecast);
  const [forecast, setForecast] = useState<number | null>(prevForecastValue);

  const [isForecastDirty, setIsForecastDirty] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ErrorResponse>();

  const handlePredictSubmit = async () => {
    setSubmitError(undefined);

    if (!user) {
      //setCurrentModal({ type: "signup" });
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
    <section className="bg-blue-200 p-3 dark:bg-blue-200-dark">
      <h3 className="m-0 text-base font-normal leading-5">
        {t("MakePrediction")}
      </h3>
      <BinarySlider
        forecast={forecast}
        onChange={setForecast}
        isDirty={isForecastDirty}
        communityForecast={communityForecast}
        onBecomeDirty={() => {
          setIsForecastDirty(true);
        }}
      />
      <div className="flex items-center justify-center">
        <Button
          variant="primary"
          disabled={!!user && (!isForecastDirty || isSubmitting)}
          onClick={handlePredictSubmit}
        >
          {user ? t("predictButton") : t("signUpButton")}
        </Button>
      </div>
      {permission &&
        [
          ProjectPermissions.CREATOR,
          ProjectPermissions.ADMIN,
          ProjectPermissions.FORECASTER,
        ].includes(permission) && (
          <div className="flex items-center justify-center py-5">
            <Button variant="secondary" className="uppercase">
              {t("resolveButton")}
            </Button>
          </div>
        )}
      <FormError errors={submitError} />

      <QuestionResolutionModal question={question} />
    </section>
  );
};

export default ForecastMakerBinary;
