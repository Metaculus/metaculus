import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useEffect, useRef, useState } from "react";

import ContinuousTable from "@/components/forecast_maker/continuous_table";
import ForecastPredictionMessage from "@/components/forecast_maker/prediction_message";
import { useAuth } from "@/contexts/auth_context";
import { useHideCP } from "@/contexts/cp_context";
import { ContinuousForecastInputType } from "@/types/charts";
import {
  DistributionQuantileComponent,
  DistributionSliderComponent,
  PinnedOutOfBounds,
  QuantileValue,
  QuestionType,
  QuestionWithNumericForecasts,
} from "@/types/question";
import {
  isAllQuantileComponentsDirty,
  isForecastActive,
} from "@/utils/forecasts/helpers";
import { getInitialQuantileDistributionComponents } from "@/utils/forecasts/initial_values";
import {
  hasAdvancedSliderComponents,
  makeDefaultSliderComponent,
} from "@/utils/forecasts/slider_components";
import {
  getQuantilesDistributionFromSlider,
  getSliderDistributionFromQuantiles,
} from "@/utils/forecasts/switch_forecast_type";
import { computeQuartilesFromCDF, getCdfBounds } from "@/utils/math";

import ContinuousInputContainer, {
  ContinuousInputContainerProps,
} from "./continuous_input_container";
import ContinuousPredictionChart from "./continuous_prediction_chart";
import ContinuousSlider from "./continuous_slider";
import { validateAllQuantileInputs } from "../helpers";

type InputState = {
  slider: DistributionSliderComponent[];
  pinned: PinnedOutOfBounds | null;
  quantile: DistributionQuantileComponent;
};

type Props = {
  question: QuestionWithNumericForecasts;
  dataset: {
    cdf: number[];
    pmf: number[];
    componentCdfs?: number[][];
  };
  userCdf: number[] | undefined;
  userPreviousCdf: number[] | undefined;
  overlayPreviousCdf?: number[] | undefined;
  communityCdf: number[] | undefined;
  sliderComponents: DistributionSliderComponent[];
  // Pinned out-of-bounds mass (advanced mode only); part of the slider state
  pinnedOutOfBounds?: PinnedOutOfBounds | null;
  onSliderChange: (
    components: DistributionSliderComponent[],
    pinnedOutOfBounds: PinnedOutOfBounds | null
  ) => void;
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
  clipboardData?: Omit<
    NonNullable<ContinuousInputContainerProps["clipboardData"]>,
    "scaling" | "openLowerBound" | "openUpperBound"
  >;
  skipModeSyncRef?: React.RefObject<boolean>;
  userPreviousLabel?: string;
  userPreviousRowClassName?: string;
  hideCurrentUserRow?: boolean;
  outlineUser?: boolean;
};

const ContinuousInput: FC<Props> = ({
  question,
  dataset,
  userCdf,
  userPreviousCdf,
  communityCdf,
  sliderComponents,
  pinnedOutOfBounds = null,
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
  clipboardData,
  skipModeSyncRef,
  userPreviousLabel,
  userPreviousRowClassName,
  hideCurrentUserRow,
  overlayPreviousCdf,
  outlineUser = false,
}) => {
  const { user } = useAuth();
  const { hideCP } = useHideCP();
  const t = useTranslations();
  const previousForecast = question.my_forecasts?.latest;
  const isMounted = useRef(false);
  const withCommunityQuartiles = !user || !hideCP;

  // Advanced mode keeps its own input state, separate from regular mode:
  // toggling stashes the state of the mode being left and restores that of
  // the mode being entered. There's no conversion between them.
  const requiresAdvanced =
    hasAdvancedSliderComponents(sliderComponents) || !!pinnedOutOfBounds;
  const [isAdvanced, setIsAdvanced] = useState(requiresAdvanced);
  const stashedStateRef = useRef<{
    regular?: InputState;
    advanced?: InputState;
  }>({});
  // State only advanced mode can show may arrive at any time (loading a
  // forecast, discarding edits, pasting), so switch to advanced to show it
  if (!isAdvanced && requiresAdvanced) {
    setIsAdvanced(true);
  }

  const restoreState = ({ slider, pinned, quantile }: InputState) => {
    // The group forecast maker takes the input mode from whichever state
    // changed last, so update the active mode's state last
    if (forecastInputMode === ContinuousForecastInputType.Slider) {
      onQuantileChange(quantile);
      onSliderChange(slider, pinned);
    } else {
      onSliderChange(slider, pinned);
      onQuantileChange(quantile);
    }
  };

  const handleAdvancedChange = (value: boolean) => {
    if (value === isAdvanced) return;
    const current: InputState = {
      slider: sliderComponents,
      pinned: pinnedOutOfBounds,
      quantile: quantileComponent,
    };
    const stash = stashedStateRef.current;
    if (value) {
      stash.regular = current;
      // On first entry, the regular state is a valid advanced state as-is
      if (stash.advanced) restoreState(stash.advanced);
    } else {
      stash.advanced = current;
      // Nothing is stashed if we started in advanced mode (e.g. the saved
      // forecast needs it), so start fresh
      restoreState(
        stash.regular ?? {
          slider: [makeDefaultSliderComponent()],
          pinned: null,
          quantile: getInitialQuantileDistributionComponents(
            undefined,
            undefined,
            question
          ),
        }
      );
    }
    setIsAdvanced(value);
  };

  // populate forecast data from another tab
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (skipModeSyncRef?.current) {
      skipModeSyncRef.current = false;
      return;
    }
    // Translating between slider and table isn't supported in advanced mode
    if (isAdvanced) {
      return;
    }
    if (
      forecastInputMode === ContinuousForecastInputType.Quantile &&
      (isDirty ||
        (previousForecast?.distribution_input?.type ===
          ContinuousForecastInputType.Slider &&
          isForecastActive(previousForecast)))
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
        getSliderDistributionFromQuantiles(quantileComponent, question),
        null
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forecastInputMode]);

  const discrete = question.type === QuestionType.Discrete;

  const derivedHideCurrentUserRow =
    hideCurrentUserRow ??
    (!isDirty && (!hasUserForecast || !userCdf || userCdf.length === 0));

  return (
    <ContinuousInputContainer
      forecastInputMode={forecastInputMode}
      onInputModeChange={onForecastInputModeChange}
      overlayPreviousForecast={overlayPreviousForecast}
      onOverlayPreviousForecastChange={onOverlayPreviousForecastChange}
      previousForecast={previousForecast}
      menu={menu}
      copyMenu={copyMenu}
      clipboardData={
        clipboardData
          ? {
              ...clipboardData,
              scaling: question.scaling,
              openLowerBound: !!question.open_lower_bound,
              openUpperBound: !!question.open_upper_bound,
            }
          : undefined
      }
      disabled={disabled || disableInputModeSwitch}
      questionType={question.type}
      isAdvanced={isAdvanced}
      onAdvancedChange={handleAdvancedChange}
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
            previousCdf={overlayPreviousCdf}
            question={question}
            readOnly={disabled}
            hasUserForecast={hasUserForecast}
            showCP={!user || !hideCP || !!question.resolution}
            outlineUser={outlineUser}
          />

          {forecastInputMode === ContinuousForecastInputType.Slider && (
            <>
              <ContinuousSlider
                components={sliderComponents}
                onChange={(components) =>
                  onSliderChange(components, pinnedOutOfBounds)
                }
                disabled={disabled}
                advanced={
                  isAdvanced
                    ? {
                        bounds: {
                          open_lower_bound: !!question.open_lower_bound,
                          open_upper_bound: !!question.open_upper_bound,
                        },
                        pinnedOutOfBounds,
                        onPinnedOutOfBoundsChange: (pinned) =>
                          onSliderChange(sliderComponents, pinned),
                        cdf: dataset.cdf,
                      }
                    : undefined
                }
              />
              {submitControls}
            </>
          )}

          <ForecastPredictionMessage predictionMessage={predictionMessage} />

          <ContinuousTable
            question={question}
            userBounds={getCdfBounds(userCdf)}
            userQuartiles={
              userCdf?.length
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
            userPreviousLabel={userPreviousLabel}
            userPreviousRowClassName={userPreviousRowClassName}
            hideCurrentUserRow={derivedHideCurrentUserRow}
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
