import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Disclosure, DisclosurePanel } from "@headlessui/react";
import { isNil } from "lodash";
import { useLocale } from "next-intl";
import { FC, memo, PropsWithChildren, useEffect, useState } from "react";

import ContinuousAreaChart, {
  getContinuousAreaChartData,
} from "@/components/charts/continuous_area_chart";
import TruncatedTextTooltip from "@/components/truncated_text_tooltip";
import { useBreakpoint } from "@/hooks/tailwind";
import { ContinuousForecastInputType } from "@/types/charts";
import { QuestionStatus } from "@/types/post";
import { Quantile, Scaling } from "@/types/question";
import cn from "@/utils/core/cn";
import {
  getQuantileNumericForecastDataset,
  getSliderNumericForecastDataset,
} from "@/utils/forecasts/dataset";
import { formatRelativeDate } from "@/utils/formatters/date";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { formatResolution } from "@/utils/formatters/resolution";
import { computeQuartilesFromCDF } from "@/utils/math";

import { AccordionOpenButton } from "./accordion_open_button";
import { AccordionResolutionCell } from "./accordion_resolution_cell";
import { ContinuousGroupOption } from "./group_forecast_accordion";
import MobileAccordionModal from "./group_forecast_accordion_modal";

type AccordionItemProps = {
  option: ContinuousGroupOption;
  showCP?: boolean;
  subQuestionId?: number | null;
  type: QuestionStatus.OPEN | QuestionStatus.CLOSED | QuestionStatus.RESOLVED;
  unit?: string;
  forcedOpenId?: number;
  forcedExpandAll?: boolean;
  globalScaling?: Scaling;
};

const AccordionItem: FC<PropsWithChildren<AccordionItemProps>> = memo(
  ({
    option,
    showCP,
    children,
    subQuestionId,
    type,
    unit,
    forcedOpenId,
    forcedExpandAll,
    globalScaling,
  }) => {
    const locale = useLocale();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const {
      question,
      name: title,
      isDirty,
      resolution,
      forecastInputMode,
      hasUserForecast,
    } = option;
    const formatedResolution = formatResolution({
      resolution,
      questionType: question.type,
      locale,
      scaling: question.scaling,
      unit,
      actual_resolve_time: question.actual_resolve_time ?? null,
      sigfigs: 6,
    });
    const isLargeScreen = useBreakpoint("sm");
    const showUserPrediction = hasUserForecast || isDirty;
    const isResolvedOption = type === QuestionStatus.RESOLVED;
    const optionForecast =
      forecastInputMode === ContinuousForecastInputType.Slider
        ? getSliderNumericForecastDataset(option.userSliderForecast, question)
        : getQuantileNumericForecastDataset(
            option.userQuantileForecast,
            question
          );

    const continuousAreaChartData = getContinuousAreaChartData({
      question,
      userForecastOverride:
        optionForecast && showUserPrediction
          ? { cdf: optionForecast.cdf, pmf: optionForecast.pmf }
          : undefined,
      isClosed: type === QuestionStatus.CLOSED,
    });
    const median = getPredictionDisplayValue(
      showCP ? option.communityQuartiles?.median : undefined,
      {
        questionType: option.question.type,
        scaling: option.question.scaling,
        unit,
        actual_resolve_time: option.question.actual_resolve_time ?? null,
      }
    );
    const endSec = option.withdrawnEndTimeSec;
    const wasWithdrawn = endSec != null && endSec * 1000 < Date.now();
    const withdrawnMedian =
      wasWithdrawn && question.my_forecasts?.latest?.forecast_values
        ? computeQuartilesFromCDF(question.my_forecasts.latest.forecast_values)
            .median
        : undefined;

    const withdrawnLabel = wasWithdrawn
      ? `Withdrawn ${formatRelativeDate(locale, new Date(endSec * 1000), { short: true })}`
      : undefined;

    let userMedian = showUserPrediction
      ? forecastInputMode === ContinuousForecastInputType.Quantile
        ? getPredictionDisplayValue(
            option.userQuantileForecast?.find((q) => q.quantile === Quantile.q2)
              ?.value ?? null,
            {
              questionType: option.question.type,
              unit,
              actual_resolve_time: option.question.actual_resolve_time ?? null,
            }
          )
        : getPredictionDisplayValue(option.userQuartiles?.median, {
            questionType: option.question.type,
            scaling: option.question.scaling,
            unit,
            actual_resolve_time: option.question.actual_resolve_time ?? null,
          })
      : undefined;

    // Build a cross-question shared domain in internal coordinates and flags for borders
    if (wasWithdrawn && !isDirty && withdrawnMedian != null) {
      userMedian = getPredictionDisplayValue(withdrawnMedian, {
        questionType: option.question.type,
        scaling: option.question.scaling,
        unit,
        actual_resolve_time: option.question.actual_resolve_time ?? null,
      });
    }

    const handleClick = () => {
      setIsModalOpen((prev) => !prev);
    };

    const isForceOpen = forcedOpenId === option.id;

    useEffect(() => {
      if (!isForceOpen) {
        setIsModalOpen(false);
      } else if (!isLargeScreen) {
        setIsModalOpen(true);
      }
      // We intentionally keep only forcedOpenId in the dependencies,
      // because this effect should re-trigger only when forcedOpenId changes — not other params.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [forcedOpenId]);

    return (
      <>
        <Disclosure
          as="div"
          defaultOpen={
            forcedExpandAll ||
            subQuestionId === option.id ||
            forcedOpenId === option.id
          }
          id={`group-option-${option.id}`}
          // Change the key so that when forceOpen toggles, Disclosure re-mounts
          key={`${option.id}-${forcedOpenId === option.id ? "open" : "closed"}`}
        >
          {({ open }) => (
            <div>
              <AccordionOpenButton
                onClick={handleClick}
                open={open}
                isResolved={isResolvedOption}
                isDirty={!isResolvedOption && isDirty}
              >
                <div className="flex h-full shrink grow items-center overflow-hidden">
                  <TruncatedTextTooltip
                    text={title}
                    showTooltip={!open}
                    className="line-clamp-2 pl-4 pr-2 text-sm font-bold text-gray-900 dark:text-gray-900-dark sm:text-base"
                    tooltipClassName="text-center !border-blue-400 dark:!border-blue-400-dark bg-gray-0 dark:bg-gray-0-dark text-sm font-bold text-gray-900 dark:text-gray-900-dark sm:text-base p-2"
                  />
                </div>
                {(!open || !isLargeScreen) && (
                  <div className="flex h-full min-w-[105px] max-w-[105px] shrink-0 grow-[3] items-center justify-center gap-0.5 sm:min-w-[420px] sm:max-w-[420px]">
                    <AccordionResolutionCell
                      formatedResolution={formatedResolution}
                      resolution={resolution}
                      median={median}
                      userMedian={
                        !isNil(option.userQuartiles?.median)
                          ? userMedian
                          : undefined
                      }
                      type={type}
                      withdrawnLabel={
                        wasWithdrawn && !isDirty ? withdrawnLabel : undefined
                      }
                    />
                    <div className="hidden h-full shrink-0 grow-0 items-center sm:block sm:w-[325px]">
                      <ContinuousAreaChart
                        data={continuousAreaChartData}
                        graphType="pmf"
                        height={55}
                        hideLabels
                        hideCP={!showCP}
                        question={question}
                        withResolutionChip={false}
                        withTodayLine={false}
                        globalScaling={globalScaling}
                        outlineUser={wasWithdrawn && !isDirty}
                      />
                    </div>
                  </div>
                )}
                <div className="flex h-full w-[43px] shrink-0 grow-0 items-center justify-center">
                  <div className="flex size-[26px] items-center justify-center rounded-full border border-blue-400 bg-blue-100 dark:border-blue-400-dark dark:bg-blue-100-dark">
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={cn(
                        "h-4 -rotate-90 text-blue-700 duration-75 ease-linear dark:text-blue-700-dark sm:rotate-0",
                        open && "sm:rotate-180"
                      )}
                    />
                  </div>
                </div>
              </AccordionOpenButton>
              <DisclosurePanel className="mb-2 hidden pt-0 sm:block">
                {children}
              </DisclosurePanel>
            </div>
          )}
        </Disclosure>
        <MobileAccordionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={title}
          className="pt-header"
        >
          {children}
        </MobileAccordionModal>
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.option === nextProps.option &&
      prevProps.showCP === nextProps.showCP &&
      prevProps.forcedOpenId === nextProps.forcedOpenId &&
      prevProps.subQuestionId === nextProps.subQuestionId
    );
  }
);
AccordionItem.displayName = "AccordionItem";
export { AccordionItem };
