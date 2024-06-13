"use client";
import { round } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState } from "react";

import { createForecast } from "@/app/(main)/questions/actions";
import ForecastInput from "@/components/forecast_maker/forecast_input";
import Slider from "@/components/sliders/slider";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { ErrorResponse } from "@/types/fetch";
import { QuestionWithNumericForecasts } from "@/types/question";

const DEFAULT_SLIDER_VALUE = 50;
const PREDICTION_PRECISION = 3;
const MIN_VALUE = 10 ** -PREDICTION_PRECISION * 100;
const MAX_VALUE = 100 - MIN_VALUE;

type Props = {
  question: QuestionWithNumericForecasts;
  prevForecast?: any;
};

const ForecastMakerBinary: FC<Props> = ({ question, prevForecast }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  const prevForecastValue =
    typeof prevForecast === "number" ? prevForecast * 100 : null;

  const [sliderForecast, setSliderForecast] = useState<number | null>(
    prevForecastValue
  );
  const [isForecastDirty, setIsForecastDirty] = useState(
    prevForecastValue !== null
  );
  const [inputValue, setInputValue] = useState(
    prevForecastValue ? `${prevForecastValue}%` : "—"
  );

  const handleSliderForecastChange = useCallback((value: number) => {
    setSliderForecast(value);
    setInputValue(value.toString() + "%");
    setIsForecastDirty(true);
  }, []);
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    setIsForecastDirty(true);
  }, []);
  const handleInputForecastChange = useCallback((value: number) => {
    setSliderForecast(value);
    setIsForecastDirty(true);
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ErrorResponse>();

  const handlePredictSubmit = async () => {
    setSubmitError(undefined);

    if (!user) {
      setCurrentModal({ type: "signup" });
      return;
    }

    if (sliderForecast === null) return;

    const forecastValue = round(sliderForecast / 100, PREDICTION_PRECISION);

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
          defaultValue={sliderForecast ?? DEFAULT_SLIDER_VALUE}
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
          disabled={!!user && (!isForecastDirty || isSubmitting)}
          onClick={handlePredictSubmit}
        >
          {user ? t("predictButton") : t("signUpButton")}
        </Button>
        <FormError errors={submitError} />
      </div>
    </section>
  );
};

export default ForecastMakerBinary;
