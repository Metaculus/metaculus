"use client";
import { useTranslations } from "next-intl";
import React, { FC, useMemo, useState } from "react";

import { createForecast } from "@/app/(main)/questions/actions";
import { MultiSliderValue } from "@/components/sliders/multi_slider";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { ProjectPermissions } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import {
  extractPrevNumericForecastValue,
  getNumericForecastDataset,
  normalizeWeights,
} from "@/utils/forecasts";
import { computeQuartilesFromCDF } from "@/utils/math";

import ContinuousSlider from "../continuous_slider";
import NumericForecastTable from "../numeric_table";
import QuestionResolutionButton from "../resolution";

type Props = {
  question: QuestionWithNumericForecasts;
  prevForecast?: any;
  permission?: ProjectPermissions;
  canPredict: boolean;
  canResolve: boolean;
};

const ForecastMakerContinuous: FC<Props> = ({
  question,
  permission,
  prevForecast,
  canPredict,
  canResolve,
}) => {
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const submitIsAllowed = !isSubmitting && isDirty;

  const prevForecastValue = extractPrevNumericForecastValue(prevForecast);
  const t = useTranslations();
  const [forecast, setForecast] = useState<MultiSliderValue[]>(
    prevForecastValue?.forecast ?? [
      {
        left: 0.4,
        center: 0.5,
        right: 0.6,
      },
    ]
  );
  const [weights, setWeights] = useState<number[]>(
    prevForecastValue?.weights ?? [1]
  );

  const dataset = useMemo(
    () =>
      getNumericForecastDataset(
        forecast,
        weights,
        question.open_lower_bound!,
        question.open_upper_bound!
      ),
    [forecast, question.open_lower_bound, question.open_upper_bound, weights]
  );

  const userCdf: number[] = dataset.cdf;
  const communityCdf: number[] = question.forecasts.latest_cdf;

  const handleAddComponent = () => {
    setForecast([
      ...forecast,
      {
        left: 0.4,
        right: 0.6,
        center: 0.5,
      },
    ]);
    setWeights(normalizeWeights([...weights, 1]));
  };

  const handlePredictSubmit = async () => {
    setIsSubmitting(true);
    await createForecast(
      question.id,
      {
        continuousCdf: userCdf,
        probabilityYes: null,
        probabilityYesPerCategory: null,
      },
      {
        forecast: forecast,
        weights: weights,
      }
    );
    setIsDirty(false);
    setIsSubmitting(false);
  };

  return (
    <>
      <ContinuousSlider
        forecast={forecast}
        weights={weights}
        dataset={dataset}
        onChange={(forecast, weight) => {
          setForecast(forecast);
          setWeights(weight);
          setIsDirty(true);
        }}
        question={question}
        disabled={!canPredict}
      />

      {canPredict && (
        <div className="my-5 flex flex-wrap items-center justify-center gap-3 px-4">
          (
          {user ? (
            <>
              <Button
                variant="secondary"
                type="reset"
                onClick={handleAddComponent}
              >
                {t("addComponentButton")}
              </Button>
              <Button
                variant="primary"
                type="submit"
                onClick={handlePredictSubmit}
                disabled={!submitIsAllowed}
              >
                {t("saveButton")}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              type="button"
              onClick={() => setCurrentModal({ type: "signup" })}
            >
              {t("signUpButton")}
            </Button>
          )}
          )
        </div>
      )}

      <NumericForecastTable
        question={question}
        userBounds={{
          belowLower: userCdf[0],
          aboveUpper: 1 - userCdf[userCdf.length - 1],
        }}
        userQuartiles={computeQuartilesFromCDF(userCdf)}
        communityBounds={{
          belowLower: communityCdf[0],
          aboveUpper: 1 - communityCdf[communityCdf.length - 1],
        }}
        communityQuartiles={computeQuartilesFromCDF(communityCdf)}
      />
      {canResolve && (
        <div className="flex flex-col items-center justify-center">
          <QuestionResolutionButton
            question={question}
            permission={permission}
          />
        </div>
      )}
    </>
  );
};

export default ForecastMakerContinuous;
