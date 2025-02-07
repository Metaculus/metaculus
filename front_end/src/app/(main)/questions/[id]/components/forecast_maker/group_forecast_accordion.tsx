import { useLocale, useTranslations } from "next-intl";
import { FC, ReactNode, useMemo } from "react";

import { MultiSliderValue } from "@/components/sliders/multi_slider";
import { useAuth } from "@/contexts/auth_context";
import { QuestionStatus, Resolution } from "@/types/post";
import {
  DistributionSliderComponent,
  Quartiles,
  Question,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getDisplayValue } from "@/utils/charts";
import { formatResolution } from "@/utils/questions";

import SliderWrapper from "./forecast_maker_group/continuous_slider_wrapper";
import {
  ActiveAccordionItem,
  ResolvedAccordionItem,
} from "./group_forecast_accordion_items";
import { useHideCP } from "../cp_provider";

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
type Props = {
  options: ConditionalTableOption[];
  groupVariable: string;
  canPredict: boolean;
  isPending: boolean;
  handleChange: (
    id: number,
    forecast: MultiSliderValue[],
    weight: number[]
  ) => void;
  handleAddComponent: (id: number) => void;
  handleResetForecasts: () => void;
  handlePredictSubmit: () => void;
};

const GroupForecastAccordion: FC<Props> = ({
  options,
  groupVariable,
  canPredict,
  isPending,
  handleChange,
  handleAddComponent,
  handleResetForecasts,
  handlePredictSubmit,
}) => {
  const t = useTranslations();
  const locale = useLocale();
  const { hideCP } = useHideCP();
  const { user } = useAuth();
  const showCP = !user || !hideCP;

  const { resolvedOptions, activeOptions } = useMemo(
    () => ({
      resolvedOptions: options.filter(
        (option) =>
          option.question.status &&
          [QuestionStatus.CLOSED, QuestionStatus.RESOLVED].includes(
            option.question.status
          )
      ),
      activeOptions: options.filter(
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
          <div className="shrink grow bg-[#758EA91F] py-1">
            <span className="pl-4">{groupVariable}</span>
          </div>
          <div className="max-w-[422px] shrink grow-[3] bg-[#758EA91F] py-1 text-center">
            {t("resolution")}
          </div>
          <div className="w-[43px] shrink-0 grow-0 bg-[#758EA91F] py-1"></div>
        </div>
      )}
      {resolvedOptions.map((option) => {
        return (
          <ResolvedAccordionItem
            option={option}
            resolution={formatResolution(
              option.resolution,
              option.question.type,
              locale
            )}
            key={option.id}
          >
            <SliderWrapper
              option={option}
              canPredict={canPredict}
              isPending={isPending}
              handleChange={handleChange}
              handleAddComponent={handleAddComponent}
              handleResetForecasts={handleResetForecasts}
              handlePredictSubmit={handlePredictSubmit}
            />
          </ResolvedAccordionItem>
        );
      })}
      {!!activeOptions.length && (
        <div className="flex w-full gap-[2px] text-left text-xs font-bold text-blue-700 dark:text-blue-700-dark">
          <div className="shrink grow bg-[#758EA91F] py-1">
            <span className="pl-4">{groupVariable}</span>
          </div>
          <div className="flex max-w-[422px] shrink grow-[3] gap-[2px] text-center">
            <div className="w-[95px] bg-[#758EA91F] py-1">median</div>
            <div className="w-[325px] shrink-0 grow-0 bg-[#758EA91F] py-1">
              PDF
            </div>
          </div>
          <div className="w-[43px] shrink-0 grow-0 bg-[#758EA91F] py-1"></div>
        </div>
      )}
      {activeOptions.map((option) => {
        return (
          <ActiveAccordionItem option={option} showCP={showCP} key={option.id}>
            <SliderWrapper
              option={option}
              canPredict={canPredict}
              isPending={isPending}
              handleChange={handleChange}
              handleAddComponent={handleAddComponent}
              handleResetForecasts={handleResetForecasts}
              handlePredictSubmit={handlePredictSubmit}
            />
          </ActiveAccordionItem>
        );
      })}
    </div>
  );
};

export default GroupForecastAccordion;
