"use client";
import { round } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import { createForecast } from "@/app/(main)/questions/actions";
import ForecastInput from "@/components/forecast_maker/forecast_input";
import Slider from "@/components/sliders/slider";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import { ErrorResponse } from "@/types/fetch";
import { QuestionWithNumericForecasts } from "@/types/question";

const DEFAULT_SLIDER_VALUE = 50;
const BINARY_PREDICTION_PRECISION = 3;
const MIN_VALUE = 10 ** -BINARY_PREDICTION_PRECISION * 100;
const MAX_VALUE = 100 - MIN_VALUE;

type Props = {
  question: QuestionWithNumericForecasts;
};

const ForecastMakerBinary: FC<Props> = ({ question }) => {
  const t = useTranslations();

  const [forecast, setForecast] = useState<number | null>(null);
  const [isForecastDirty, setIsForecastDirty] = useState(false);

  const [inputValue, setInputValue] = useState("—");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ErrorResponse>();

  const handleSliderForecastChange = (value: number) => {
    setForecast(value);
    setInputValue(value.toString() + "%");
    setIsForecastDirty(true);
  };
  const handleInputChange = (value: string) => {
    setInputValue(value);
    setIsForecastDirty(true);
  };
  const handleInputForecastChange = (value: number) => {
    setForecast(value);
    setIsForecastDirty(true);
  };

  const handlePredictSubmit = async () => {
    setSubmitError(undefined);

    if (forecast === null) return;

    const forecastValue = round(forecast / 100, BINARY_PREDICTION_PRECISION);

    setIsSubmitting(true);
    const response = await createForecast(question.id, {
      continuousCdf: null,
      probabilityYes: forecastValue,
      probabilityYesPerCategory: null,
    });
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
      <div className="mx-6 mt-8 h-16">
        <Slider
          min={MIN_VALUE}
          max={MAX_VALUE}
          defaultValue={forecast ?? DEFAULT_SLIDER_VALUE}
          onChange={handleSliderForecastChange}
          step={1}
          arrowStep={0.1}
          shouldSyncWithDefault
        />
      </div>
      <div className="mb-3 block text-center">
        <ForecastInput
          value={inputValue}
          minValue={MIN_VALUE}
          maxValue={MAX_VALUE}
          onChange={handleInputChange}
          onForecastChange={handleInputForecastChange}
          isDirty={isForecastDirty}
        />
      </div>
      <div className="flex items-center justify-center">
        <Button
          variant="primary"
          disabled={!isForecastDirty || isSubmitting}
          onClick={handlePredictSubmit}
        >
          {t("predictButton")}
        </Button>
        <FormError errors={submitError} />
      </div>
    </section>
  );
};

export default ForecastMakerBinary;
