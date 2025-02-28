import React, { FC, ReactNode } from "react";

import { useHideCP } from "@/app/(main)/questions/[id]/components/cp_provider";
import ContinuousTable from "@/app/(main)/questions/[id]/components/forecast_maker/continuous_table";
import { useAuth } from "@/contexts/auth_context";
import { ContinuousForecastInputType } from "@/types/charts";
import {
  DistributionQuantileComponent,
  DistributionSliderComponent,
  QuantileValue,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getCdfBounds } from "@/utils/charts";
import { computeQuartilesFromCDF } from "@/utils/math";

import ContinuousInputContainer from "./continuous_input_container";
import ContinuousPredictionChart from "./continuous_prediction_chart";
import ContinuousSlider from "./continuous_slider";

type Props = {
  question: QuestionWithNumericForecasts;
  dataset: {
    cdf: number[];
    pmf: number[];
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
  predictionMessage?: ReactNode;
  menu?: ReactNode;
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
  predictionMessage,
  menu,
}) => {
  const { user } = useAuth();
  const { hideCP } = useHideCP();

  const previousForecast = question.my_forecasts?.latest;

  const withCommunityQuartiles = !user || !hideCP;

  return (
    <ContinuousInputContainer
      forecastInputMode={forecastInputMode}
      onInputModeChange={onForecastInputModeChange}
      overlayPreviousForecast={overlayPreviousForecast}
      onOverlayPreviousForecastChange={onOverlayPreviousForecastChange}
      previousForecast={previousForecast}
      menu={menu}
      disabled={disabled}
    >
      {(graphType) => (
        <>
          <ContinuousPredictionChart
            dataset={dataset}
            graphType={graphType}
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
              userCdf ? computeQuartilesFromCDF(userCdf) : undefined
            }
            quantileComponents={quantileComponent}
            onQuantileChange={onQuantileChange}
            userPreviousBounds={getCdfBounds(userPreviousCdf)}
            userPreviousQuartiles={
              userPreviousCdf
                ? computeQuartilesFromCDF(userPreviousCdf)
                : undefined
            }
            communityBounds={getCdfBounds(communityCdf)}
            communityQuartiles={
              communityCdf ? computeQuartilesFromCDF(communityCdf) : undefined
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
