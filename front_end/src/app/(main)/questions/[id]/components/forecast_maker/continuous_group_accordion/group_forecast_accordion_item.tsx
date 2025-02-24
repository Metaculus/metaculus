import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Disclosure, DisclosurePanel } from "@headlessui/react";
import { useLocale } from "next-intl";
import { FC, PropsWithChildren, useState } from "react";

import ContinuousAreaChart from "@/components/charts/continuous_area_chart";
import { ContinuousForecastInputType } from "@/types/charts";
import { QuestionStatus } from "@/types/post";
import { Quantile } from "@/types/question";
import {
  displayValue,
  getContinuousAreaChartData,
  getDisplayValue,
} from "@/utils/charts";
import cn from "@/utils/cn";
import {
  getSliderNumericForecastDataset,
  getQuantileNumericForecastDataset,
} from "@/utils/forecasts";
import { formatResolution } from "@/utils/questions";

import { AccordionOpenButton } from "./accordion_open_button";
import { AccordionResolutionCell } from "./accordion_resolution_cell";
import { ContinuousGroupOption } from "./group_forecast_accordion";
import MobileAccordionModal from "./group_forecast_accordion_modal";

type AccordionItemProps = {
  option: ContinuousGroupOption;
  showCP?: boolean;
  subQuestionId?: number | null;
  type: QuestionStatus.OPEN | QuestionStatus.CLOSED | QuestionStatus.RESOLVED;
};

const AccordionItem: FC<PropsWithChildren<AccordionItemProps>> = ({
  option,
  showCP,
  children,
  subQuestionId,
  type,
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
  const formatedResolution = formatResolution(
    resolution,
    question.type,
    locale
  );

  const showUserPrediction = hasUserForecast || isDirty;
  const isResolvedOption = type === QuestionStatus.RESOLVED;
  const latest = question.aggregations.recency_weighted.latest;
  const optionForecast =
    forecastInputMode === ContinuousForecastInputType.Slider
      ? getSliderNumericForecastDataset(
          option.userSliderForecast,
          question.open_lower_bound,
          question.open_upper_bound
        )
      : getQuantileNumericForecastDataset(
          option.userQuantileForecast,
          question
        );

  const continuousAreaChartData = getContinuousAreaChartData(
    latest,
    question.my_forecasts?.latest,
    optionForecast && showUserPrediction
      ? { cdf: optionForecast.cdf, pmf: optionForecast.pmf }
      : undefined,
    type === QuestionStatus.CLOSED
  );
  const median = getDisplayValue({
    value: showCP ? option.communityQuartiles?.median : undefined,
    questionType: option.question.type,
    scaling: option.question.scaling,
  });
  const userMedian = showUserPrediction
    ? forecastInputMode === ContinuousForecastInputType.Quantile
      ? displayValue(
          option.userQuantileForecast?.find((q) => q.quantile === Quantile.q2)
            ?.value ?? null,
          option.question.type
        )
      : getDisplayValue({
          value: option.userQuartiles?.median,
          questionType: option.question.type,
          scaling: option.question.scaling,
        })
    : undefined;

  const handleClick = () => {
    setIsModalOpen((prev) => !prev);
  };

  return (
    <>
      <Disclosure as="div" defaultOpen={subQuestionId === option.id}>
        {({ open }) => (
          <div>
            <AccordionOpenButton
              onClick={handleClick}
              open={open}
              isResolved={isResolvedOption}
              isDirty={!isResolvedOption && isDirty}
            >
              <div className="flex h-full shrink grow items-center overflow-hidden">
                <span className="line-clamp-2 pl-4 pr-2 text-sm font-bold text-gray-900 dark:text-gray-900-dark sm:text-base">
                  {title}
                </span>
              </div>
              <div className="flex h-full min-w-[105px] max-w-[105px] shrink-0 grow-[3] items-center justify-center gap-0.5 sm:min-w-[420px] sm:max-w-[420px]">
                <AccordionResolutionCell
                  formatedResolution={formatedResolution}
                  resolution={resolution}
                  median={median}
                  userMedian={
                    option.userQuartiles?.median ? userMedian : undefined
                  }
                  type={type}
                />
                <div className="hidden h-full shrink-0 grow-0 items-center justify-center sm:block sm:w-[325px]">
                  {!open && (
                    <ContinuousAreaChart
                      data={continuousAreaChartData}
                      graphType="pmf"
                      height={55}
                      hideLabels
                      hideCP={!showCP}
                      scaling={question.scaling}
                      questionType={question.type}
                      resolution={question.resolution}
                    />
                  )}
                </div>
              </div>
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
      >
        {children}
      </MobileAccordionModal>
    </>
  );
};

export { AccordionItem };
