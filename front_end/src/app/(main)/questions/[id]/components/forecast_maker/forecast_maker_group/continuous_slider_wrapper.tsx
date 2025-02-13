import { isNil } from "lodash";
import { useLocale, useTranslations } from "next-intl";
import { FC, PropsWithChildren, useState, useMemo, useCallback } from "react";

import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { ForecastInputType } from "@/types/charts";
import { ErrorResponse } from "@/types/fetch";
import { QuestionStatus } from "@/types/post";
import {
  DistributionQuantile,
  DistributionQuantileComponent,
  DistributionSlider,
  DistributionSliderComponent,
} from "@/types/question";
import { getCdfBounds } from "@/utils/charts";
import cn from "@/utils/cn";
import {
  getNormalizedContinuousForecast,
  getNumericForecastDataset,
  getQuantileNumericForecastDataset,
} from "@/utils/forecasts";
import { computeQuartilesFromCDF } from "@/utils/math";
import {
  formatResolution,
  getSubquestionPredictionInputMessage,
} from "@/utils/questions";

import { useHideCP } from "../../cp_provider";
import { ContinuousGroupOption } from "../continuous_group_accordion/group_forecast_accordion";
import ContinuousSlider from "../continuous_slider";
import {
  validateAllQuantileInputs,
  validateUserQuantileData,
} from "../helpers";
import NumericForecastTable from "../numeric_table";
import PredictButton from "../predict_button";
import ScoreDisplay from "../resolution/score_display";

type SliderWrapperProps = {
  option: ContinuousGroupOption;
  canPredict: boolean;
  isPending: boolean;
  handleChange: (
    optionId: number,
    distribution: DistributionSlider | DistributionQuantile
  ) => void;
  handleAddComponent: (option: ContinuousGroupOption) => void;
  handleResetForecasts: (option?: ContinuousGroupOption) => void;
  handlePredictSubmit: (id: number) => Promise<
    | {
        errors: ErrorResponse | undefined;
      }
    | undefined
  >;
  setForecastInputMode: (mode: ForecastInputType) => void;
};

const SliderWrapper: FC<PropsWithChildren<SliderWrapperProps>> = ({
  option,
  canPredict,
  isPending,
  handleChange,
  handleAddComponent,
  handleResetForecasts,
  handlePredictSubmit,
  setForecastInputMode,
}) => {
  const { user } = useAuth();
  const { hideCP } = useHideCP();
  const t = useTranslations();
  const locale = useLocale();
  const previousForecast = option.question.my_forecasts?.latest;
  const [overlayPreviousForecast, setOverlayPreviousForecast] =
    useState<boolean>(
      !!previousForecast?.forecast_values &&
        !previousForecast.distribution_input
    );
  const [submitError, setSubmitError] = useState<ErrorResponse>();
  const forecastInputMode = option.forecastInputMode;

  const forecast = useMemo(
    () =>
      forecastInputMode === ForecastInputType.Slider
        ? getNormalizedContinuousForecast(option.userSliderForecast)
        : option.userQuantileForecast,
    [option, forecastInputMode]
  );

  const hasUserForecast = useMemo(() => {
    const prevForecast = option.question.my_forecasts?.latest;

    return !!prevForecast && !!prevForecast.distribution_input;
  }, [option]);

  const dataset = useMemo(
    () =>
      forecastInputMode === ForecastInputType.Slider
        ? getNumericForecastDataset(
            forecast as DistributionSliderComponent[],
            option.question.open_lower_bound,
            option.question.open_upper_bound
          )
        : getQuantileNumericForecastDataset(
            forecast as DistributionQuantileComponent,
            option.question
          ),
    [option, forecast, forecastInputMode]
  );
  const predictionMessage = useMemo(
    () => getSubquestionPredictionInputMessage(option),
    [option]
  );

  const onSubmit = useCallback(async () => {
    setSubmitError(undefined);
    if (option.forecastInputMode === ForecastInputType.Quantile) {
      const errors = validateUserQuantileData({
        question: option.question,
        components: option.userQuantileForecast,
        cdf: dataset.cdf,
        t,
      });
      if (errors.length) {
        setSubmitError(new Error(errors[0] ?? t("unexpectedError")));
        return;
      }
    }
    const response = await handlePredictSubmit(option.id);
    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
    }
  }, [handlePredictSubmit, option, dataset, t]);

  const userCdf: number[] | undefined = getNumericForecastDataset(
    getNormalizedContinuousForecast(option.userSliderForecast),
    option.question.open_lower_bound,
    option.question.open_upper_bound
  ).cdf;
  const userPreviousCdf: number[] | undefined =
    overlayPreviousForecast && previousForecast
      ? previousForecast.forecast_values
      : undefined;
  const communityCdf: number[] | undefined =
    option.question.aggregations.recency_weighted.latest?.forecast_values;

  return (
    <div className="mt-0.5 bg-blue-600/10 dark:bg-blue-400/10">
      <div className="p-4 pb-0">
        <ContinuousSlider
          components={option.userSliderForecast}
          question={option.question}
          overlayPreviousForecast={overlayPreviousForecast}
          setOverlayPreviousForecast={setOverlayPreviousForecast}
          dataset={dataset}
          onChange={(components) => {
            handleChange(option.id, {
              components: components,
              type: ForecastInputType.Slider,
            });
          }}
          disabled={
            !canPredict || option.question.status !== QuestionStatus.OPEN
          }
          showInputModeSwitcher
          forecastInputMode={forecastInputMode}
          setForecastInputMode={setForecastInputMode}
          menu={option.menu}
        />
      </div>

      {predictionMessage && (
        <div className="mb-2 text-center text-sm italic text-gray-700 dark:text-gray-700-dark">
          {t(predictionMessage)}
        </div>
      )}
      {option.forecastInputMode === ForecastInputType.Slider && (
        <FormError
          errors={submitError}
          className="mt-2 flex items-center justify-center"
          detached
        />
      )}

      <div
        className={cn("flex flex-wrap items-center justify-center gap-3 p-4", {
          "pt-0": forecastInputMode === ForecastInputType.Quantile,
        })}
      >
        {option.question.status === QuestionStatus.OPEN &&
          canPredict &&
          forecastInputMode === ForecastInputType.Slider && (
            <>
              {!!user && (
                <>
                  <Button
                    variant="secondary"
                    type="reset"
                    onClick={() => handleAddComponent(option)}
                  >
                    {t("addComponentButton")}
                  </Button>
                  <Button
                    variant="secondary"
                    type="reset"
                    onClick={() => handleResetForecasts(option)}
                    disabled={!option.isDirty}
                  >
                    {t("discardChangesButton")}
                  </Button>
                </>
              )}

              <PredictButton
                onSubmit={onSubmit}
                isDirty={option.isDirty}
                hasUserForecast={hasUserForecast}
                isPending={isPending}
                isDisabled={
                  option.userSliderForecast === null &&
                  option.question.status !== QuestionStatus.OPEN
                }
                predictLabel={previousForecast ? undefined : t("predict")}
              />
            </>
          )}

        <NumericForecastTable
          question={option.question}
          userBounds={getCdfBounds(userCdf)}
          userQuartiles={option.userQuartiles ?? undefined}
          userPreviousBounds={getCdfBounds(userPreviousCdf)}
          userPreviousQuartiles={
            userPreviousCdf
              ? computeQuartilesFromCDF(userPreviousCdf)
              : undefined
          }
          communityBounds={getCdfBounds(communityCdf)}
          communityQuartiles={option.communityQuartiles ?? undefined}
          withCommunityQuartiles={!user || !hideCP}
          isDirty={option.isDirty}
          hasUserForecast={hasUserForecast}
          forecastInputMode={forecastInputMode}
          quantileComponents={option.userQuantileForecast}
          onQuantileChange={(quantileComponents) =>
            handleChange(option.id, {
              components: quantileComponents,
              type: ForecastInputType.Quantile,
            })
          }
        />
        {option.question.status === QuestionStatus.OPEN &&
          canPredict &&
          forecastInputMode === ForecastInputType.Quantile && (
            <>
              {!!user && (
                <Button
                  variant="secondary"
                  type="reset"
                  onClick={() => handleResetForecasts(option)}
                  disabled={!option.isDirty}
                >
                  {t("discardChangesButton")}
                </Button>
              )}

              <PredictButton
                onSubmit={onSubmit}
                isDirty={option.userQuantileForecast.some((q) => q.isDirty)}
                hasUserForecast={hasUserForecast}
                isPending={isPending}
                isDisabled={
                  validateAllQuantileInputs({
                    question: option.question,
                    components: option.userQuantileForecast,
                    t,
                  }).length !== 0
                }
                predictLabel={previousForecast ? undefined : t("predict")}
              />
            </>
          )}
        {option.forecastInputMode === ForecastInputType.Quantile && (
          <div className="flex w-full items-center justify-center">
            <FormError
              errors={submitError}
              className="mt-2 flex items-center justify-center"
              detached
            />
          </div>
        )}
        {!!option.resolution && (
          <div className="mb-3 text-gray-600 dark:text-gray-600-dark">
            <p className="my-1 flex justify-center gap-1 text-base">
              {t("resolutionDescriptionContinuous")}
              <strong
                className="text-purple-800 dark:text-purple-800-dark"
                suppressHydrationWarning
              >
                {formatResolution({
                  resolution: option.resolution,
                  questionType: option.question.type,
                  locale,
                  scaling: option.question.scaling,
                })}
              </strong>
            </p>
          </div>
        )}
      </div>

      {!isNil(option.question.resolution) && (
        <div className="my-4 p-4">
          <ScoreDisplay question={option.question} variant="transparent" />
        </div>
      )}
    </div>
  );
};

export default SliderWrapper;
