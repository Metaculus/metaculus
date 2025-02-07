import { useLocale, useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import { useAuth } from "@/contexts/auth_context";
import { ErrorResponse } from "@/types/fetch";
import { QuestionStatus } from "@/types/post";
import { DistributionSliderComponent } from "@/types/question";
import { formatResolution } from "@/utils/questions";

import { AccordionItem } from "./group_forecast_accordion_item";
import { useHideCP } from "../../cp_provider";
import SliderWrapper from "../forecast_maker_group/continuous_slider_wrapper";
import { ConditionalTableOption } from "../group_forecast_table";

type Props = {
  options: ConditionalTableOption[];
  groupVariable: string;
  canPredict: boolean;
  isPending: boolean;
  submitError: ErrorResponse | undefined;
  subQuestionId?: number | null;
  handleChange: (id: number, components: DistributionSliderComponent[]) => void;
  handleAddComponent: (id: number) => void;
  handleResetForecasts: () => void;
  handlePredictSubmit: () => void;
};

const GroupForecastAccordion: FC<Props> = ({
  options,
  groupVariable,
  canPredict,
  isPending,
  submitError,
  subQuestionId,
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
        <div className="mb-[3px] flex w-full gap-[2px] text-left text-xs font-bold text-blue-700 dark:text-blue-700-dark">
          <div className="shrink grow bg-[#758EA91F] py-1 dark:bg-[#D7E4F21F]">
            <span className="pl-4">{groupVariable}</span>
          </div>
          <div className="max-w-[105px] shrink grow-[3] bg-[#758EA91F] py-1 text-center dark:bg-[#D7E4F21F] sm:max-w-[422px]">
            {t("resolution")}
          </div>
          <div className="w-[43px] shrink-0 grow-0 bg-[#758EA91F] py-1 dark:bg-[#D7E4F21F]"></div>
        </div>
      )}
      {resolvedOptions.map((option) => {
        return (
          <AccordionItem
            option={option}
            resolution={formatResolution(
              option.resolution,
              option.question.type,
              locale
            )}
            showCP={true}
            subQuestionId={subQuestionId}
            key={option.id}
          >
            <SliderWrapper
              option={option}
              canPredict={false}
              isPending={isPending}
              handleChange={handleChange}
              handleAddComponent={handleAddComponent}
              handleResetForecasts={handleResetForecasts}
              handlePredictSubmit={handlePredictSubmit}
            />
          </AccordionItem>
        );
      })}
      {!!activeOptions.length && (
        <div className="mb-[3px] mt-2 flex w-full gap-[2px] text-left text-xs font-bold text-blue-700 dark:text-blue-700-dark">
          <div className="shrink grow bg-[#758EA91F] py-1 dark:bg-[#D7E4F21F]">
            <span className="pl-4">{groupVariable}</span>
          </div>
          <div className="flex max-w-[105px] shrink grow-[3] gap-[2px] text-center sm:max-w-[422px]">
            <div className="w-[105px] bg-[#758EA91F] py-1 dark:bg-[#D7E4F21F]">
              median
            </div>
            <div className="hidden bg-[#758EA91F] dark:bg-[#D7E4F21F] sm:block sm:w-[325px] sm:shrink-0 sm:grow-0 sm:py-1">
              PDF
            </div>
          </div>
          <div className="w-[43px] shrink-0 grow-0 bg-[#758EA91F] py-1 dark:bg-[#D7E4F21F]"></div>
        </div>
      )}
      {activeOptions.map((option) => {
        return (
          <AccordionItem
            option={option}
            showCP={showCP}
            key={option.id}
            subQuestionId={subQuestionId}
          >
            <SliderWrapper
              option={option}
              canPredict={canPredict}
              isPending={isPending}
              submitError={submitError}
              handleChange={handleChange}
              handleAddComponent={handleAddComponent}
              handleResetForecasts={handleResetForecasts}
              handlePredictSubmit={handlePredictSubmit}
            />
          </AccordionItem>
        );
      })}
    </div>
  );
};

export default GroupForecastAccordion;
