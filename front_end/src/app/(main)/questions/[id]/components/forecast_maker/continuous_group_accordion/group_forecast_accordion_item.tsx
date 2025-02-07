import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { FC, PropsWithChildren, useState } from "react";

import ContinuousAreaChart, {
  ContinuousAreaGraphInput,
} from "@/components/charts/continuous_area_chart";
import ResolutionIcon from "@/components/icons/resolution";
import Button from "@/components/ui/button";
import { getContinuousAreaChartData, getDisplayValue } from "@/utils/charts";
import cn from "@/utils/cn";
import { getNumericForecastDataset } from "@/utils/forecasts";

import MobileAccordionModal from "./group_forecast_accordion_modal";
import { ConditionalTableOption } from "../group_forecast_table";
import ScoreDisplay from "../resolution/score_display";

type AccordionItemProps = {
  option: ConditionalTableOption;
  showCP?: boolean;
  resolution?: string;
  subQuestionId?: number | null;
};

const AccordionItem: FC<PropsWithChildren<AccordionItemProps>> = ({
  option,
  showCP,
  resolution,
  children,
  subQuestionId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { question, name: title, isDirty } = option;
  const isResolved = !!resolution;

  // Only calculate these if not resolved
  let continuousAreaChartData: ContinuousAreaGraphInput = [];
  let median: string | undefined;
  let userMedian: string | undefined;

  if (!isResolved) {
    const latest = question.aggregations.recency_weighted.latest;
    const optionForecast = option.userForecast
      ? getNumericForecastDataset(
          option.userForecast,
          question.open_lower_bound,
          question.open_upper_bound
        )
      : null;

    continuousAreaChartData = getContinuousAreaChartData(
      latest,
      question.my_forecasts?.latest,
      optionForecast
        ? { cdf: optionForecast.cdf, pmf: optionForecast.pmf }
        : undefined
    );
    median = getDisplayValue({
      value: showCP ? option.communityQuartiles?.median : undefined,
      questionType: option.question.type,
      scaling: option.question.scaling,
    });
    userMedian = getDisplayValue({
      value: option.userQuartiles?.median,
      questionType: option.question.type,
      scaling: option.question.scaling,
    });
  }

  return (
    <>
      <Disclosure as="div" defaultOpen={subQuestionId === option.id}>
        {({ open }) => (
          <div>
            <OpenAccordionButton
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              open={open}
              isResolved={isResolved}
              isDirty={!isResolved && isDirty}
            >
              <div className="flex h-full shrink grow items-center">
                <span className="pl-4 text-base font-bold text-gray-900 dark:text-gray-900-dark">
                  {title}
                </span>
              </div>
              <div className="flex h-full max-w-[105px] shrink grow-[3] items-center justify-center gap-0.5 sm:max-w-[420px]">
                {isResolved ? (
                  <>
                    <ResolutionIcon />
                    <span
                      className="text-sm font-bold text-purple-800 dark:text-purple-800-dark"
                      suppressHydrationWarning
                    >
                      {resolution}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex h-full flex-col items-center justify-center sm:w-[105px]">
                      <p className="m-0 text-olive-800 dark:text-olive-800-dark">
                        {median}
                      </p>
                      {!!option.userQuartiles?.median && (
                        <p className="m-0 text-orange-700 dark:text-orange-700-dark">
                          {userMedian}
                        </p>
                      )}
                    </div>
                    <div className="hidden h-full shrink-0 grow-0 items-center justify-center sm:block sm:w-[325px]">
                      {!open && (
                        <ContinuousAreaChart
                          data={continuousAreaChartData}
                          graphType="pmf"
                          height={55}
                          hideLabels
                          hideCP={!showCP}
                          scaling={question.scaling}
                          resolution={question.resolution}
                        />
                      )}
                    </div>
                  </>
                )}
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
            </OpenAccordionButton>
            <DisclosurePanel className="mb-2 pt-0">
              <>
                {children}
                <ScoreDisplay
                  question={question}
                  className={isResolved ? "my-4" : undefined}
                />
              </>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>
      <MobileAccordionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
      >
        {children}
      </MobileAccordionModal>
    </>
  );
};

type OpenAccordionButtonProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  open: boolean;
  isDirty?: boolean;
  isResolved?: boolean;
};

const OpenAccordionButton: FC<PropsWithChildren<OpenAccordionButtonProps>> = ({
  isOpen,
  setIsOpen,
  open,
  isDirty,
  isResolved,
  children,
}) => {
  return (
    <>
      {/* Mobile button */}
      <Button
        className={cn(
          "flex h-[58px] w-full gap-0.5 rounded-none bg-blue-100 text-left text-xs font-bold text-blue-700 dark:bg-blue-100-dark dark:text-blue-700-dark sm:hidden",
          open && "bg-blue-600/10 dark:bg-blue-400/10",
          !isResolved && isDirty && "bg-orange-100 dark:bg-orange-100-dark"
        )}
        onClick={() => setIsOpen(!isOpen)}
        variant="text"
      >
        {children}
      </Button>
      {/* Desktop button */}
      <DisclosureButton
        className={cn(
          "hidden h-[58px] w-full gap-0.5 bg-blue-100 text-left text-xs font-bold text-blue-700 dark:bg-blue-100-dark dark:text-blue-700-dark sm:flex",
          open && "bg-blue-600/10 dark:bg-blue-400/10",
          !isResolved && isDirty && "bg-orange-100 dark:bg-orange-100-dark"
        )}
      >
        {children}
      </DisclosureButton>
    </>
  );
};

export { AccordionItem };
