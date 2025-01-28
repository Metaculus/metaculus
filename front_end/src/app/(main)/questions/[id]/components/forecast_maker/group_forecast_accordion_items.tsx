import ResolutionIcon from "@/components/icons/resolution";
import cn from "@/utils/cn";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { FC, PropsWithChildren, useMemo, useState } from "react";
import ContinuousSlider from "./continuous_slider";
import { MultiSliderValue } from "@/components/sliders/multi_slider";
import { ForecastInputType } from "@/types/charts";
import { QuestionStatus } from "@/types/post";
import {
  extractPrevNumericForecastValue,
  getNormalizedContinuousForecast,
  getNormalizedContinuousWeight,
  getNumericForecastDataset,
} from "@/utils/forecasts";
import { ConditionalTableOption } from "./group_forecast_table";
import { isNil } from "lodash";

type ResolvedItemProps = {
  title: string;
  resolution: string;
};

type PendingItemProps = {
  title: string;
  median: string;
  forecast: string;
};

type SliderWrapperProps = {
  option: ConditionalTableOption;
  canPredict: boolean;
};

const ResolvedAccordionItem: FC<PropsWithChildren<ResolvedItemProps>> = ({
  title,
  resolution,
  children,
}) => {
  return (
    <Disclosure defaultOpen={false} as="div">
      {({ open }) => (
        <div>
          <DisclosureButton
            className={cn(
              "flex h-[58px] w-full gap-[2px] bg-blue-100 text-left text-xs font-bold text-blue-700 dark:bg-blue-100-dark dark:text-blue-700-dark",
              open && "bg-[#758EA914] dark:bg-[#D7E4F214]"
            )}
          >
            <div className="flex h-full w-[200px] shrink-0 grow-0 items-center">
              <span className="pl-4 text-base font-bold text-gray-900 dark:text-gray-900-dark">
                {title}
              </span>
            </div>
            <div className="flex h-full shrink grow items-center justify-center">
              <ResolutionIcon />
              <span
                className="text-sm font-bold text-purple-800 dark:text-purple-800-dark"
                suppressHydrationWarning
              >
                {resolution}
              </span>
            </div>
            <div className="flex h-full w-[43px] shrink-0 grow-0 items-center justify-center">
              <div className="flex size-[26px] items-center justify-center rounded-full border border-blue-400 dark:border-blue-400-dark">
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={cn(
                    "h-4 text-blue-500 duration-75 ease-linear dark:text-blue-500-dark",
                    open && "rotate-180"
                  )}
                />
              </div>
            </div>
          </DisclosureButton>
          <DisclosurePanel className="pt-0">{children}</DisclosurePanel>
        </div>
      )}
    </Disclosure>
  );
};

const PendingAccordionItem: FC<PropsWithChildren<PendingItemProps>> = ({
  title,
  median,
  forecast,
  children,
}) => {
  return (
    <Disclosure defaultOpen={false} as="div">
      {({ open }) => (
        <div>
          <DisclosureButton
            className={cn(
              "flex h-[58px] w-full gap-[2px] bg-blue-100 text-left text-xs font-bold text-blue-700 dark:bg-blue-100-dark dark:text-blue-700-dark",
              open && "bg-[#758EA914] dark:bg-[#D7E4F214]"
            )}
          >
            <div className="flex h-full w-[200px] shrink-0 grow-0 items-center">
              <span className="pl-4 text-base font-bold text-gray-900 dark:text-gray-900-dark">
                {title}
              </span>
            </div>
            <div className="flex h-full shrink grow items-center justify-center gap-[2px]">
              <div className="flex h-full w-[92px] items-center justify-center">
                {median}
              </div>
              <div className="flex h-full shrink grow items-center justify-center">
                {forecast}
              </div>
            </div>
            <div className="flex h-full w-[43px] shrink-0 grow-0 items-center justify-center">
              <div className="flex size-[26px] items-center justify-center rounded-full border border-blue-400 dark:border-blue-400-dark">
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={cn(
                    "h-4 text-blue-500 duration-75 ease-linear dark:text-blue-500-dark",
                    open && "rotate-180"
                  )}
                />
              </div>
            </div>
          </DisclosureButton>
          <DisclosurePanel className="pt-0">{children}</DisclosurePanel>
        </div>
      )}
    </Disclosure>
  );
};

const SliderWrapper: FC<PropsWithChildren<SliderWrapperProps>> = ({
  option,
  canPredict,
}) => {
  const [forecast, setForecast] = useState<MultiSliderValue[]>(
    getNormalizedContinuousForecast(option.userForecast)
  );
  const previousForecast = option.question.my_forecasts?.latest;
  const activeForecast =
    !!previousForecast && isNil(previousForecast.end_time)
      ? previousForecast
      : undefined;
  const [overlayPreviousForecast, setOverlayPreviousForecast] =
    useState<boolean>(
      !!previousForecast?.forecast_values && !previousForecast.slider_values
    );
  const activeForecastSliderValues = activeForecast
    ? extractPrevNumericForecastValue(activeForecast.slider_values)
    : {};
  const [weights, setWeights] = useState<number[]>(
    getNormalizedContinuousWeight(activeForecastSliderValues.weights)
  );
  const [isDirty, setIsDirty] = useState(false);
  const [forecastInputMode, setForecastInputMode] =
    useState<ForecastInputType>("slider");

  const dataset = useMemo(
    () =>
      getNumericForecastDataset(
        forecast,
        weights,
        option.question.open_lower_bound,
        option.question.open_upper_bound
      ),
    [
      forecast,
      option.question.open_lower_bound,
      option.question.open_upper_bound,
      weights,
    ]
  );
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
            setForecast(forecast);
            setWeights(weight);
            setIsDirty(true);
          }}
          disabled={
            !canPredict || option.question.status !== QuestionStatus.OPEN
          }
          showInputModeSwitcher
          forecastInputMode={forecastInputMode}
          setForecastInputMode={setForecastInputMode}
        />
      </div>
    </div>
  );
};

export { ResolvedAccordionItem, PendingAccordionItem, SliderWrapper };
