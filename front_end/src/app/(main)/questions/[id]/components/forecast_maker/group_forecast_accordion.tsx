import { useLocale, useTranslations } from "next-intl";
import { FC, ReactNode, useMemo } from "react";

import { MultiSliderValue } from "@/components/sliders/multi_slider";
import { QuestionStatus, Resolution } from "@/types/post";
import {
  DistributionSliderComponent,
  Quartiles,
  Question,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getDisplayValue } from "@/utils/charts";
import { formatResolution } from "@/utils/questions";

export type ConditionalTableOption = {
  id: number;
  name: string;
  question: QuestionWithNumericForecasts;
  userForecast: DistributionSliderComponent[] | null;
  userQuartiles: Quartiles | null;
  communityQuartiles: Quartiles | null;
  isDirty: boolean;
  resolution: Resolution | null;
  menu?: ReactNode;
};
import {
  PendingAccordionItem,
  ResolvedAccordionItem,
  SliderWrapper,
} from "./group_forecast_accordion_items";

type Props = {
  options: ConditionalTableOption[];
  questions: QuestionWithNumericForecasts[];
  groupVariable: string;
  canPredict: boolean;
  showCP?: boolean;
};

const GroupForecastAccordion: FC<Props> = ({
  options,
  questions,
  groupVariable,
  canPredict,
  showCP = true,
}) => {
  const t = useTranslations();
  const locale = useLocale();

  const { resolvedOptions, pendingOptions } = useMemo(
    () => ({
      resolvedOptions: options.filter(
        (option) =>
          option.question.status &&
          [QuestionStatus.CLOSED, QuestionStatus.RESOLVED].includes(
            option.question.status
          )
      ),
      pendingOptions: options.filter(
        (option) =>
          !option.question.status ||
          ![QuestionStatus.CLOSED, QuestionStatus.RESOLVED].includes(
            option.question.status
          )
      ),
    }),
    [options]
  );

  return (
    <div className="my-10 w-full">
      {!!resolvedOptions.length && (
        <div className="flex w-full gap-[2px] text-left text-xs font-bold text-blue-700 dark:text-blue-700-dark">
          <div className="w-[200px] shrink-0 grow-0 bg-[#758EA91F] py-1">
            <span className="pl-4">{groupVariable}</span>
          </div>
          <div className="shrink grow bg-[#758EA91F] py-1 text-center">
            {t("resolution")}
          </div>
          <div className="w-[43px] shrink-0 grow-0 bg-[#758EA91F] py-1"></div>
        </div>
      )}
      {resolvedOptions.map((option) => {
        return (
          <ResolvedAccordionItem
            title={option.name}
            resolution={formatResolution(
              option.resolution,
              option.question.type,
              locale
            )}
            key={option.id}
          >
            <SliderWrapper option={option} canPredict={canPredict} />
          </ResolvedAccordionItem>
        );
      })}
      {!!pendingOptions.length && (
        <div className="flex w-full gap-[2px] text-left text-xs font-bold text-blue-700 dark:text-blue-700-dark">
          <div className="w-[200px] shrink-0 grow-0 bg-[#758EA91F] py-1">
            <span className="pl-4">{groupVariable}</span>
          </div>
          <div className="flex shrink grow gap-[2px] text-center">
            <div className="w-[92px] bg-[#758EA91F] py-1">median</div>
            <div className="shrink grow bg-[#758EA91F] py-1">PDF</div>
          </div>
          <div className="w-[43px] shrink-0 grow-0 bg-[#758EA91F] py-1"></div>
        </div>
      )}
      {pendingOptions.map((option) => {
        return (
          <PendingAccordionItem
            title={option.name}
            median={getDisplayValue({
              value: showCP ? option.communityQuartiles?.median : undefined,
              questionType: (
                questions.find(
                  (question) => question.id === option.id
                ) as Question
              ).type,
              scaling: (
                questions.find(
                  (question) => question.id === option.id
                ) as Question
              ).scaling,
            })}
            forecast="forecast"
            key={option.id}
          >
            Expanded content
          </PendingAccordionItem>
        );
      })}
    </div>
  );
};

export default GroupForecastAccordion;
