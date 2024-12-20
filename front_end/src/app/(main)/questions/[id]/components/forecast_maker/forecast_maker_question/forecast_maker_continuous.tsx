"use client";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useMemo, useState } from "react";

import {
  createForecasts,
  withdrawForecasts,
} from "@/app/(main)/questions/actions";
import { MultiSliderValue } from "@/components/sliders/multi_slider";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useAuth } from "@/contexts/auth_context";
import { useServerAction } from "@/hooks/use_server_action";
import { ErrorResponse } from "@/types/fetch";
import { PostWithForecasts, ProjectPermissions } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { getCdfBounds } from "@/utils/charts";
import {
  extractPrevNumericForecastValue,
  getNumericForecastDataset,
} from "@/utils/forecasts";
import { computeQuartilesFromCDF } from "@/utils/math";

import { sendGAPredictEvent } from "./ga_events";
import { useHideCP } from "../../cp_provider";
import ContinuousSlider from "../continuous_slider";
import NumericForecastTable from "../numeric_table";
import PredictButton from "../predict_button";
import QuestionResolutionButton from "../resolution";
import QuestionUnresolveButton from "../resolution/unresolve_button";

type Props = {
  post: PostWithForecasts;
  question: QuestionWithNumericForecasts;
  permission?: ProjectPermissions;
  canPredict: boolean;
  canResolve: boolean;
  predictionMessage?: ReactNode;
};

const ForecastMakerContinuous: FC<Props> = ({
  post,
  question,
  permission,
  canPredict,
  canResolve,
  predictionMessage,
}) => {
  const { user } = useAuth();
  const { hideCP } = useHideCP();
  const [isDirty, setIsDirty] = useState(false);
  const [submitError, setSubmitError] = useState<ErrorResponse>();
  const previousForecast = question.my_forecasts?.latest;
  const activeForecast =
    !!previousForecast && isNil(previousForecast.end_time)
      ? previousForecast
      : undefined;
  const activeForecastSliderValues = activeForecast
    ? extractPrevNumericForecastValue(activeForecast.slider_values)
    : {};
  const withCommunityQuartiles = !user || !hideCP;
  const hasUserForecast = !!activeForecastSliderValues.forecast;
  const t = useTranslations();
  const [forecast, setForecast] = useState<MultiSliderValue[]>(
    activeForecastSliderValues?.forecast ?? [
      {
        left: 0.4,
        center: 0.5,
        right: 0.6,
      },
    ]
  );
  const [weights, setWeights] = useState<number[]>(
    activeForecastSliderValues?.weights ?? [1]
  );
  const [overlayPreviousForecast, setOverlayPreviousForecast] =
    useState<boolean>(
      !!previousForecast?.forecast_values && !previousForecast.slider_values
    );

  const dataset = useMemo(
    () =>
      getNumericForecastDataset(
        forecast,
        weights,
        question.open_lower_bound,
        question.open_upper_bound
      ),
    [forecast, question.open_lower_bound, question.open_upper_bound, weights]
  );

  const userCdf: number[] = dataset.cdf;
  const userPreviousCdf: number[] | undefined =
    overlayPreviousForecast && previousForecast
      ? previousForecast.forecast_values
      : undefined;
  const latest = question.aggregations.recency_weighted.latest;
  const communityCdf: number[] | undefined =
    latest && !latest.end_time ? latest?.forecast_values : undefined;

  const handleAddComponent = () => {
    setForecast([
      ...forecast,
      {
        left: 0.4,
        right: 0.6,
        center: 0.5,
      },
    ]);
    setWeights([...weights, 1]);
  };

  const handlePredictSubmit = async () => {
    setSubmitError(undefined);
    sendGAPredictEvent(post, question, hideCP);

    const response = await createForecasts(post.id, [
      {
        questionId: question.id,
        forecastData: {
          continuousCdf: userCdf,
          probabilityYes: null,
          probabilityYesPerCategory: null,
        },
        sliderValues: {
          forecast: forecast,
          weights: weights,
        },
      },
    ]);
    setIsDirty(false);
    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
    }
  };
  const [submit, isPending] = useServerAction(handlePredictSubmit);

  const handlePredictWithdraw = async () => {
    setSubmitError(undefined);

    if (!previousForecast) return;

    const response = await withdrawForecasts(post.id, [
      {
        question: question.id,
      },
    ]);
    setIsDirty(false);

    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
    }
  };
  const [withdraw, withdrawalIsPending] = useServerAction(
    handlePredictWithdraw
  );
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
        overlayPreviousForecast={overlayPreviousForecast}
        setOverlayPreviousForecast={setOverlayPreviousForecast}
        question={question}
        disabled={!canPredict}
      />

      {canPredict && (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 px-4">
            {!!user && (
              <Button
                variant="secondary"
                type="reset"
                onClick={handleAddComponent}
              >
                {t("addComponentButton")}
              </Button>
            )}

            {!!activeForecast &&
              question.withdraw_permitted && ( // Feature Flag: prediction-withdrawal
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
              onSubmit={submit}
              isDirty={isDirty}
              hasUserForecast={hasUserForecast}
              isPending={isPending}
            />
          </div>
          <FormError
            errors={submitError}
            className="mt-2 flex items-center justify-center"
            detached
          />
          <div className="h-[32px]">
            {(isPending || withdrawalIsPending) && <LoadingIndicator />}
          </div>
        </>
      )}
      {predictionMessage && (
        <div className="mb-2 text-center text-sm italic text-gray-700 dark:text-gray-700-dark">
          {predictionMessage}
        </div>
      )}
      <NumericForecastTable
        question={question}
        userBounds={getCdfBounds(userCdf)}
        userQuartiles={userCdf ? computeQuartilesFromCDF(userCdf) : undefined}
        userPreviousBounds={getCdfBounds(userPreviousCdf)}
        userPreviousQuartiles={
          userPreviousCdf ? computeQuartilesFromCDF(userPreviousCdf) : undefined
        }
        communityBounds={getCdfBounds(communityCdf)}
        communityQuartiles={
          communityCdf ? computeQuartilesFromCDF(communityCdf) : undefined
        }
        withCommunityQuartiles={withCommunityQuartiles}
        isDirty={isDirty}
        hasUserForecast={hasUserForecast}
      />

      <div className="flex flex-col items-center justify-center">
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

export default ForecastMakerContinuous;
