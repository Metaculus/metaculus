import { isNil } from "lodash";
import { useLocale, useTranslations } from "next-intl";
import React, {
  FC,
  PropsWithChildren,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";

import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { ContinuousForecastInputType } from "@/types/charts";
import { ErrorResponse } from "@/types/fetch";
import { QuestionStatus } from "@/types/post";
import {
  DistributionQuantile,
  DistributionQuantileComponent,
  DistributionSlider,
  DistributionSliderComponent,
} from "@/types/question";
import cn from "@/utils/cn";
import {
  getNormalizedContinuousForecast,
  getQuantileNumericForecastDataset,
  getSliderNumericForecastDataset,
} from "@/utils/forecasts";
import {
  formatResolution,
  getSubquestionPredictionInputMessage,
} from "@/utils/questions";

import { ContinuousGroupOption } from "../continuous_group_accordion/group_forecast_accordion";
import ContinuousInput from "../continuous_input";
import {
  validateAllQuantileInputs,
  validateUserQuantileData,
} from "../helpers";
import PredictButton from "../predict_button";
import ScoreDisplay from "../resolution/score_display";

type Props = {
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
  setForecastInputMode: (mode: ContinuousForecastInputType) => void;
};

const ContinuousInputWrapper: FC<PropsWithChildren<Props>> = ({
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
      forecastInputMode === ContinuousForecastInputType.Slider
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
      forecastInputMode === ContinuousForecastInputType.Slider
        ? getSliderNumericForecastDataset(
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
    if (option.forecastInputMode === ContinuousForecastInputType.Quantile) {
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

  const userCdf: number[] | undefined = getSliderNumericForecastDataset(
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

  let SubmitControls: ReactNode = null;
  if (option.question.status === QuestionStatus.OPEN && canPredict) {
    SubmitControls = (
      <>
        <FormError
          errors={submitError}
          className="mb-2 flex items-center justify-center"
          detached
        />
        <div
          className={cn(
            "flex flex-wrap items-center justify-center gap-3 p-4",
            {
              "pt-0":
                forecastInputMode === ContinuousForecastInputType.Quantile,
            }
          )}
        >
          {!!user && (
            <>
              {forecastInputMode === ContinuousForecastInputType.Slider && (
                <Button
                  variant="secondary"
                  type="reset"
                  onClick={() => handleAddComponent(option)}
                >
                  {t("addComponentButton")}
                </Button>
              )}
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

          {forecastInputMode === ContinuousForecastInputType.Slider ? (
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
          ) : (
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
          )}
        </div>
      </>
    );
  }

  return (
    <div className="mt-0.5 bg-blue-600/10 dark:bg-blue-400/10">
      <div className="p-4 pb-0">
        <ContinuousInput
          question={option.question}
          dataset={dataset}
          userCdf={userCdf}
          userPreviousCdf={userPreviousCdf}
          communityCdf={communityCdf}
          sliderComponents={option.userSliderForecast}
          onSliderChange={(components) =>
            handleChange(option.id, {
              components: components,
              type: ContinuousForecastInputType.Slider,
            })
          }
          quantileComponent={option.userQuantileForecast}
          onQuantileChange={(quantileComponents) =>
            handleChange(option.id, {
              components: quantileComponents,
              type: ContinuousForecastInputType.Quantile,
            })
          }
          overlayPreviousForecast={overlayPreviousForecast}
          onOverlayPreviousForecastChange={setOverlayPreviousForecast}
          forecastInputMode={forecastInputMode}
          onForecastInputModeChange={setForecastInputMode}
          hasUserForecast={hasUserForecast}
          isDirty={option.isDirty}
          submitControls={SubmitControls}
          disabled={
            !canPredict || option.question.status !== QuestionStatus.OPEN
          }
          predictionMessage={
            predictionMessage ? t(predictionMessage) : undefined
          }
          menu={option.menu}
        />
      </div>

      {!!option.resolution && (
        <div className="mb-3 text-gray-600 dark:text-gray-600-dark">
          <p className="my-1 flex justify-center gap-1 text-base">
            {t("resolutionDescriptionContinuous")}
            <strong
              className="text-purple-800 dark:text-purple-800-dark"
              suppressHydrationWarning
            >
              {formatResolution(
                option.resolution,
                option.question.type,
                locale
              )}
            </strong>
          </p>
        </div>
      )}

      {!isNil(option.question.resolution) && (
        <div className="my-4 p-4">
          <ScoreDisplay question={option.question} variant="transparent" />
        </div>
      )}
    </div>
  );
};

export default ContinuousInputWrapper;
