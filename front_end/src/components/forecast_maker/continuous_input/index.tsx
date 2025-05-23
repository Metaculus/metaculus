import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useEffect, useRef } from "react";

import ContinuousTable from "@/components/forecast_maker/continuous_table";
import { useAuth } from "@/contexts/auth_context";
import { useHideCP } from "@/contexts/cp_context";
import { ContinuousForecastInputType } from "@/types/charts";
import {
  DistributionQuantileComponent,
  DistributionSliderComponent,
  QuantileValue,
  QuestionType,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { isAllQuantileComponentsDirty } from "@/utils/forecasts/helpers";
import {
  getQuantilesDistributionFromSlider,
  getSliderDistributionFromQuantiles,
} from "@/utils/forecasts/switch_forecast_type";
import { computeQuartilesFromCDF, getCdfBounds } from "@/utils/math";

import ContinuousInputContainer from "./continuous_input_container";
import ContinuousPredictionChart from "./continuous_prediction_chart";
import ContinuousSlider from "./continuous_slider";
import { validateAllQuantileInputs } from "../helpers";

type Props = {
  question: QuestionWithNumericForecasts;
  dataset: {
    cdf: number[];
    pmf: number[];
    componentCdfs?: number[][];
  };
  userCdf: number[] | undefined;
  userPreviousCdf: number[] | undefined;
  communityCdf: number[] | undefined;
  sliderComponents: DistributionSliderComponent[];
  onSliderChange: (components: DistributionSliderComponent[]) => void;
  quantileComponent: DistributionQuantileComponent;
  onQuantileChange: (quantileComponents: QuantileValue[]) => void;
  overlayPreviousForecast: boolean;
  onOverlayPreviousForecastChange: (value: boolean) => void;
  forecastInputMode: ContinuousForecastInputType;
  onForecastInputModeChange: (mode: ContinuousForecastInputType) => void;
  hasUserForecast: boolean;
  isDirty?: boolean;
  submitControls?: ReactNode;
  disabled?: boolean;
  disableInputModeSwitch?: boolean;
  predictionMessage?: ReactNode;
  menu?: ReactNode;
  copyMenu?: ReactNode;
};

const ContinuousInput: FC<Props> = ({
  question,
  dataset,
  userCdf,
  userPreviousCdf,
  communityCdf,
  sliderComponents,
  onSliderChange,
  quantileComponent,
  onQuantileChange,
  overlayPreviousForecast,
  onOverlayPreviousForecastChange,
  forecastInputMode,
  onForecastInputModeChange,
  hasUserForecast,
  isDirty,
  submitControls,
  disabled,
  disableInputModeSwitch,
  predictionMessage,
  menu,
  copyMenu,
}) => {
  const { user } = useAuth();
  const { hideCP } = useHideCP();
  const t = useTranslations();
  const previousForecast = question.my_forecasts?.latest;
  const isMounted = useRef(false);
  const withCommunityQuartiles = !user || !hideCP;

  // populate forecast data from another tab
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (
      forecastInputMode === ContinuousForecastInputType.Quantile &&
      (isDirty ||
        (previousForecast?.distribution_input?.type ===
          ContinuousForecastInputType.Slider &&
          isNil(previousForecast.end_time)))
    ) {
      onQuantileChange(
        getQuantilesDistributionFromSlider(sliderComponents, question, true)
      );
    } else if (
      forecastInputMode === ContinuousForecastInputType.Slider &&
      isAllQuantileComponentsDirty(quantileComponent) &&
      validateAllQuantileInputs({
        question,
        components: quantileComponent,
        t,
      }).length === 0
    ) {
      onSliderChange(
        getSliderDistributionFromQuantiles(quantileComponent, question)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forecastInputMode]);

  const discrete = question.type === QuestionType.Discrete;

  return (
    <ContinuousInputContainer
      forecastInputMode={forecastInputMode}
      onInputModeChange={onForecastInputModeChange}
      overlayPreviousForecast={overlayPreviousForecast}
      onOverlayPreviousForecastChange={onOverlayPreviousForecastChange}
      previousForecast={previousForecast}
      menu={menu}
      copyMenu={copyMenu}
      disabled={disabled || disableInputModeSwitch}
      questionType={question.type}
    >
      {(sliderGraphType, tableGraphType) => (
        <>
          <ContinuousPredictionChart
            dataset={dataset}
            graphType={
              forecastInputMode === ContinuousForecastInputType.Slider
                ? sliderGraphType
                : tableGraphType
            }
            overlayPreviousForecast={overlayPreviousForecast}
            question={question}
            readOnly={disabled}
            showCP={!user || !hideCP || !!question.resolution}
          />

          {forecastInputMode === ContinuousForecastInputType.Slider && (
            <>
              <ContinuousSlider
                components={sliderComponents}
                onChange={onSliderChange}
                disabled={disabled}
              />
              {submitControls}
            </>
          )}

          {predictionMessage && (
            <div className="mb-2 text-center text-sm italic text-gray-700 dark:text-gray-700-dark">
              {predictionMessage}
            </div>
          )}

          <ContinuousTable
            question={question}
            userBounds={getCdfBounds(userCdf)}
            userQuartiles={
              userCdf
                ? computeQuartilesFromCDF(userCdf, true, discrete)
                : undefined
            }
            quantileComponents={quantileComponent}
            onQuantileChange={onQuantileChange}
            userPreviousBounds={getCdfBounds(userPreviousCdf)}
            userPreviousQuartiles={
              userPreviousCdf
                ? computeQuartilesFromCDF(userPreviousCdf, true, discrete)
                : undefined
            }
            communityBounds={getCdfBounds(communityCdf)}
            communityQuartiles={
              communityCdf
                ? computeQuartilesFromCDF(communityCdf, true, discrete)
                : undefined
            }
            withCommunityQuartiles={withCommunityQuartiles}
            isDirty={isDirty}
            disableQuantileInput={disabled}
            hasUserForecast={hasUserForecast}
            forecastInputMode={forecastInputMode}
          />

          {forecastInputMode === ContinuousForecastInputType.Quantile && (
            <>{submitControls}</>
          )}
        </>
      )}
    </ContinuousInputContainer>
  );
};

export default ContinuousInput;
