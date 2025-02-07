import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { FC, PropsWithChildren } from "react";

import ContinuousAreaChart, {
  ContinuousAreaGraphInput,
} from "@/components/charts/continuous_area_chart";
import ResolutionIcon from "@/components/icons/resolution";
import { ContinuousAreaType } from "@/types/charts";
import cn from "@/utils/cn";
import { cdfToPmf } from "@/utils/math";
import { ConditionalTableOption } from "./group_forecast_accordion";
import { getDisplayValue } from "@/utils/charts";
import { useTranslations } from "next-intl";
import ScoreDisplay from "./resolution/score_display";

type ResolvedItemProps = {
  option: ConditionalTableOption;
  resolution: string;
};

const ResolvedAccordionItem: FC<PropsWithChildren<ResolvedItemProps>> = ({
  option,
  resolution,
  children,
}) => {
  const t = useTranslations();
  const { question, name: title } = option;
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
            <div className="flex h-full shrink grow items-center">
              <span className="pl-4 text-base font-bold text-gray-900 dark:text-gray-900-dark">
                {title}
              </span>
            </div>
            <div className="flex h-full max-w-[420px] shrink grow-[3] items-center justify-center">
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
          <DisclosurePanel className="pt-0">
            <>
              {children}

              <ScoreDisplay question={question} />

              <div className="mb-3 text-gray-600 dark:text-gray-600-dark">
                <p className="my-1 flex justify-center gap-1 text-base">
                  {t("resolutionDescriptionContinuous")}
                  <strong
                    className="text-purple-800 dark:text-purple-800-dark"
                    suppressHydrationWarning
                  >
                    {resolution}
                  </strong>
                </p>
              </div>
            </>
          </DisclosurePanel>
        </div>
      )}
    </Disclosure>
  );
};

type ActiveItemProps = {
  option: ConditionalTableOption;
  showCP: boolean;
};

const ActiveAccordionItem: FC<PropsWithChildren<ActiveItemProps>> = ({
  option,
  showCP,
  children,
}) => {
  const { question, name: title, isDirty } = option;
  const latest = question.aggregations.recency_weighted.latest;
  const continuousAreaChartData: ContinuousAreaGraphInput = [];

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
  const median = getDisplayValue({
    value: showCP ? option.communityQuartiles?.median : undefined,
    questionType: option.question.type,
    scaling: option.question.scaling,
  });

  const userMedian = getDisplayValue({
    value: option.userQuartiles?.median,
    questionType: option.question.type,
    scaling: option.question.scaling,
  });
  return (
    <Disclosure defaultOpen={false} as="div">
      {({ open }) => (
        <div>
          <DisclosureButton
            className={cn(
              "flex h-[58px] w-full gap-[2px] bg-blue-100 text-left text-xs font-bold text-blue-700 dark:bg-blue-100-dark dark:text-blue-700-dark",
              open && "bg-[#758EA914] dark:bg-[#D7E4F214]",
              isDirty && "bg-orange-100 dark:bg-orange-100-dark"
            )}
          >
            <div className="flex h-full shrink grow items-center">
              <span className="pl-4 text-base font-bold text-gray-900 dark:text-gray-900-dark">
                {title}
              </span>
            </div>
            <div className="flex h-full shrink items-center justify-center gap-[2px]">
              <div className="flex h-full w-[95px] flex-col items-center justify-center">
                <p className="m-0 text-olive-800 dark:text-olive-800-dark">
                  {median}
                </p>
                {!!option.userQuartiles?.median && (
                  <p className="m-0 text-orange-700 dark:text-orange-700-dark">
                    {userMedian}
                  </p>
                )}
              </div>
              <div className="flex h-full w-[325px] shrink-0 grow-0 items-center justify-center">
                <ContinuousAreaChart
                  data={continuousAreaChartData}
                  graphType={"pmf"}
                  height={55}
                  hideLabels
                  hideCP={false} //TODO: fix this
                  scaling={question.scaling}
                  resolution={question.resolution}
                />
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
          <DisclosurePanel className="mb-2 pt-0">
            <>
              {children}
              <ScoreDisplay question={question} />
            </>
          </DisclosurePanel>
        </div>
      )}
    </Disclosure>
  );
};

export { ResolvedAccordionItem, ActiveAccordionItem };
