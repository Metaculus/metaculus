import { useLocale, useTranslations } from "next-intl";
import { FC, PropsWithChildren, useState, useMemo } from "react";

import { MultiSliderValue } from "@/components/sliders/multi_slider";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { ForecastInputType } from "@/types/charts";
import { QuestionStatus } from "@/types/post";
import {
  getNormalizedContinuousForecast,
  getNumericForecastDataset,
} from "@/utils/forecasts";

import ContinuousSlider from "../continuous_slider";
import { ConditionalTableOption } from "../group_forecast_table";
import PredictButton from "../predict_button";
import { formatResolution } from "@/utils/questions";
import NumericForecastTable from "../numeric_table";
import { getCdfBounds } from "@/utils/charts";
import { computeQuartilesFromCDF } from "@/utils/math";
import { useHideCP } from "../../cp_provider";

type SliderWrapperProps = {
  option: ConditionalTableOption;
  canPredict: boolean;
  isPending: boolean;
  handleChange: (
    id: number,
    forecast: MultiSliderValue[],
    weight: number[]
  ) => void;
  handleAddComponent: (id: number) => void;
  handleResetForecasts: () => void;
  handlePredictSubmit: () => void;
};

const SliderWrapper: FC<PropsWithChildren<SliderWrapperProps>> = ({
  option,
  canPredict,
  isPending,
  handleChange,
  handleAddComponent,
  handleResetForecasts,
  handlePredictSubmit,
}) => {
  const { user } = useAuth();
  const { hideCP } = useHideCP();
  const t = useTranslations();
  const locale = useLocale();
  const previousForecast = option.question.my_forecasts?.latest;
  const [overlayPreviousForecast, setOverlayPreviousForecast] =
    useState<boolean>(
      !!previousForecast?.forecast_values && !previousForecast.slider_values
    );
  const [forecastInputMode, setForecastInputMode] =
    useState<ForecastInputType>("slider");

  const forecast = useMemo(
    () => getNormalizedContinuousForecast(option.userForecast),
    [option]
  );
  // TODO: check if this is correct
  const hasUserForecast = useMemo(() => {
    const prevForecast = option.question.my_forecasts?.latest;

    return !!prevForecast && !!prevForecast.slider_values;
  }, [option]);
  const dataset = useMemo(
    () =>
      getNumericForecastDataset(
        forecast,
        option.userWeights,
        option.question.open_lower_bound,
        option.question.open_upper_bound
      ),
    [option, forecast]
  );

  const userCdf: number[] | undefined = getNumericForecastDataset(
    getNormalizedContinuousForecast(option.userForecast),
    option.userWeights,
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
    <div className="mt-[2px] bg-[#758EA914] dark:bg-[#D7E4F214]">
      <div className="p-4">
        <ContinuousSlider
          forecast={forecast}
          weights={option.userWeights}
          question={option.question}
          overlayPreviousForecast={overlayPreviousForecast}
          setOverlayPreviousForecast={setOverlayPreviousForecast}
          dataset={dataset}
          onChange={(forecast, weight) => {
            handleChange(option.id, forecast, weight);
          }}
          disabled={
            !canPredict || option.question.status !== QuestionStatus.OPEN
          }
          // showInputModeSwitcher
          forecastInputMode={forecastInputMode}
          setForecastInputMode={setForecastInputMode}
        />
      </div>
      {option.question.status == QuestionStatus.OPEN && (
        <div className="flex flex-wrap items-center justify-center gap-3 p-4">
          {canPredict && forecastInputMode === "slider" && (
            <>
              {!!user && (
                <>
                  <Button
                    variant="secondary"
                    type="reset"
                    onClick={() => handleAddComponent(option.id)}
                  >
                    {t("addComponentButton")}
                  </Button>
                  <Button
                    variant="secondary"
                    type="reset"
                    onClick={handleResetForecasts}
                    disabled={!option.isDirty}
                  >
                    {t("discardChangesButton")}
                  </Button>
                </>
              )}
              {/* TODO: Check if this is correct */}
              <PredictButton
                onSubmit={handlePredictSubmit}
                isDirty={option.isDirty}
                hasUserForecast={hasUserForecast}
                isPending={isPending}
                isDisabled={!option.isDirty}
              />
            </>
          )}
          <>
            {forecastInputMode === "slider" ? (
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
                withUserQuartiles={option.resolution === null}
                withCommunityQuartiles={!user || !hideCP}
                isDirty={option.isDirty}
                hasUserForecast={hasUserForecast} // Recheck this
              />
            ) : (
              <div>There will be a table inputs</div>
            )}

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
          </>
        </div>
      )}
    </div>
  );
};

export default SliderWrapper;
