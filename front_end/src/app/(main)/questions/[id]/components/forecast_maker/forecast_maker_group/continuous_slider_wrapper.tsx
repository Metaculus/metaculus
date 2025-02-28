import { isNil } from "lodash";
import { useLocale, useTranslations } from "next-intl";
import { FC, PropsWithChildren, useState, useMemo, useCallback } from "react";

import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { ForecastInputType } from "@/types/charts";
import { ErrorResponse } from "@/types/fetch";
import { QuestionStatus } from "@/types/post";
import { DistributionSliderComponent } from "@/types/question";
import { getCdfBounds } from "@/utils/charts";
import {
  getNormalizedContinuousForecast,
  getNumericForecastDataset,
} from "@/utils/forecasts";
import { computeQuartilesFromCDF } from "@/utils/math";
import {
  formatResolution,
  getSubquestionPredictionInputMessage,
} from "@/utils/questions";

import { useHideCP } from "../../cp_provider";
import ContinuousSlider from "../continuous_slider";
import { ConditionalTableOption } from "../group_forecast_table";
import NumericForecastTable from "../numeric_table";
import PredictButton from "../predict_button";
import ScoreDisplay from "../resolution/score_display";

type SliderWrapperProps = {
  option: ConditionalTableOption;
  canPredict: boolean;
  isPending: boolean;
  handleChange: (id: number, components: DistributionSliderComponent[]) => void;
  handleAddComponent: (id: number) => void;
  handleResetForecasts: (id?: number) => void;
  handlePredictSubmit: (id: number) => Promise<
    | {
        errors: ErrorResponse | undefined;
      }
    | undefined
  >;
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
      !!previousForecast?.forecast_values &&
        !previousForecast.distribution_input
    );
  const [forecastInputMode, setForecastInputMode] =
    useState<ForecastInputType>("slider");
  const [submitError, setSubmitError] = useState<ErrorResponse>();
  const onSubmit = useCallback(async () => {
    setSubmitError(undefined);
    const response = await handlePredictSubmit(option.id);
    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
    }
  }, [option.id, handlePredictSubmit]);

  const forecast = useMemo(
    () => getNormalizedContinuousForecast(option.userForecast),
    [option]
  );

  const hasUserForecast = useMemo(() => {
    const prevForecast = option.question.my_forecasts?.latest;

    return !!prevForecast && !!prevForecast.distribution_input;
  }, [option]);

  const dataset = useMemo(
    () =>
      getNumericForecastDataset(
        forecast,
        option.question.open_lower_bound,
        option.question.open_upper_bound
      ),
    [option, forecast]
  );
  const predictionMessage = useMemo(
    () => getSubquestionPredictionInputMessage(option),
    [option]
  );
  const userCdf: number[] | undefined = getNumericForecastDataset(
    getNormalizedContinuousForecast(option.userForecast),
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
      <div className="p-4">
        <ContinuousSlider
          components={forecast}
          question={option.question}
          overlayPreviousForecast={overlayPreviousForecast}
          setOverlayPreviousForecast={setOverlayPreviousForecast}
          dataset={dataset}
          onChange={(components) => {
            handleChange(option.id, components);
          }}
          disabled={
            !canPredict || option.question.status !== QuestionStatus.OPEN
          }
          // showInputModeSwitcher
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
      <FormError
        errors={submitError}
        className="mt-2 flex items-center justify-center"
        detached
      />

      <div className="flex flex-wrap items-center justify-center gap-3 p-4">
        {option.question.status === QuestionStatus.OPEN &&
          canPredict &&
          forecastInputMode === "slider" && (
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
                    onClick={() => handleResetForecasts(option.id)}
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
                  option.userForecast === null &&
                  option.question.status !== QuestionStatus.OPEN
                }
                predictLabel={previousForecast ? undefined : t("predict")}
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
              withCommunityQuartiles={!user || !hideCP}
              isDirty={option.isDirty}
              hasUserForecast={hasUserForecast}
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

      {!isNil(option.question.resolution) && (
        <div className="my-4 p-4">
          <ScoreDisplay question={option.question} variant="transparent" />
        </div>
      )}
    </div>
  );
};

export default SliderWrapper;
