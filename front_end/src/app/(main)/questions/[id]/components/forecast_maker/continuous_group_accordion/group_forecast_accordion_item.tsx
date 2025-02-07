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
import { ContinuousAreaType } from "@/types/charts";
import { getDisplayValue } from "@/utils/charts";
import cn from "@/utils/cn";
import { cdfToPmf } from "@/utils/math";

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
  const continuousAreaChartData: ContinuousAreaGraphInput = !isResolved
    ? []
    : [];
  let median: string | undefined;
  let userMedian: string | undefined;

  if (!isResolved) {
    const latest = question.aggregations.recency_weighted.latest;
    if (latest && !latest.end_time) {
      continuousAreaChartData.push({
        pmf: cdfToPmf(latest.forecast_values),
        cdf: latest.forecast_values,
        type: "community" as ContinuousAreaType,
      });
    }
    const userForecast = question.my_forecasts?.latest;
    if (!!userForecast && !userForecast.end_time) {
      continuousAreaChartData.push({
        pmf: cdfToPmf(userForecast.forecast_values),
        cdf: userForecast.forecast_values,
        type: "user" as ContinuousAreaType,
      });
    }
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
            <div
              className={cn(
                "flex h-[58px] w-full gap-[2px] bg-blue-100 text-left text-xs font-bold text-blue-700 dark:bg-blue-100-dark dark:text-blue-700-dark",
                open && "bg-[#758EA914] dark:bg-[#D7E4F214]",
                !isResolved &&
                  isDirty &&
                  "bg-orange-100 dark:bg-orange-100-dark"
              )}
            >
              <div className="flex h-full shrink grow items-center">
                <span className="pl-4 text-base font-bold text-gray-900 dark:text-gray-900-dark">
                  {title}
                </span>
              </div>
              <div className="flex h-full max-w-[105px] shrink grow-[3] items-center justify-center gap-[2px] sm:max-w-[420px]">
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
              <OpenAccordionButton
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                open={open}
                isDirty={!isResolved && isDirty}
              />
            </div>
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
};

const OpenAccordionButton: FC<OpenAccordionButtonProps> = ({
  isOpen,
  setIsOpen,
  open,
  isDirty,
}) => {
  return (
    <>
      {/* Mobile button */}
      <Button
        className="flex h-full w-[43px] shrink-0 grow-0 items-center justify-center sm:hidden"
        onClick={() => setIsOpen(!isOpen)}
        presentationType="icon"
        variant="text"
      >
        <div className="flex size-[26px] items-center justify-center rounded-full border border-blue-400 dark:border-blue-400-dark">
          <FontAwesomeIcon
            icon={faChevronDown}
            className={cn(
              "h-4 text-blue-500 duration-75 ease-linear dark:text-blue-500-dark",
              open && "rotate-180"
            )}
          />
        </div>
      </Button>
      {/* Desktop button */}
      <DisclosureButton
        className={cn(
          "hidden bg-blue-100 text-left text-xs font-bold text-blue-700 dark:bg-blue-100-dark dark:text-blue-700-dark sm:flex",
          open && "bg-transparent dark:bg-transparent",
          isDirty && "bg-orange-100 dark:bg-orange-100-dark"
        )}
      >
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
    </>
  );
};

export { AccordionItem };
