import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import { useAuth } from "@/contexts/auth_context";
import { ErrorResponse } from "@/types/fetch";
import { QuestionStatus } from "@/types/post";
import { DistributionSliderComponent } from "@/types/question";

import { AccordionItem } from "./group_forecast_accordion_item";
import { useHideCP } from "../../cp_provider";
import SliderWrapper from "../forecast_maker_group/continuous_slider_wrapper";
import { ConditionalTableOption } from "../group_forecast_table";

type Props = {
  options: ConditionalTableOption[];
  groupVariable: string;
  canPredict: boolean;
  isPending: boolean;
  subQuestionId?: number | null;
  handleChange: (id: number, components: DistributionSliderComponent[]) => void;
  handleAddComponent: (id: number) => void;
  handleResetForecasts: (id?: number) => void;
  handlePredictSubmit: (id: number) => Promise<
    | {
        errors: ErrorResponse | undefined;
      }
    | undefined
  >;
};

const GroupForecastAccordion: FC<Props> = ({
  options,
  groupVariable,
  canPredict,
  isPending,
  subQuestionId,
  handleChange,
  handleAddComponent,
  handleResetForecasts,
  handlePredictSubmit,
}) => {
  const t = useTranslations();
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
    <div className="w-full">
      {!!resolvedOptions.length && (
        <div className="mb-0.5 flex w-full gap-0.5 text-left text-xs font-bold text-blue-700 dark:text-blue-700-dark">
          <div className="shrink grow overflow-hidden bg-blue-600/15 py-1 dark:bg-blue-400/15">
            <span className="line-clamp-2 pl-4">{groupVariable}</span>
          </div>
          <div className="min-w-[105px] max-w-[105px] shrink grow-[3] bg-blue-600/15 py-1 text-center dark:bg-blue-400/15 sm:min-w-[422px] sm:max-w-[422px]">
            {t("resolution")}
          </div>
          <div className="w-[43px] shrink-0 grow-0 bg-blue-600/15 py-1 dark:bg-blue-400/15"></div>
        </div>
      )}
      {resolvedOptions.map((option) => {
        return (
          <AccordionItem
            option={option}
            showCP={true}
            subQuestionId={subQuestionId}
            isResolvedOption={true}
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
        <div className="mb-0.5 mt-2 flex w-full gap-0.5 text-left text-xs font-bold text-blue-700 dark:text-blue-700-dark">
          <div className="shrink grow overflow-hidden bg-blue-600/15 py-1 dark:bg-blue-400/15">
            <span className="line-clamp-2 pl-4">{groupVariable}</span>
          </div>
          <div className="flex max-w-[105px] shrink grow-[3] gap-0.5 text-center sm:max-w-[422px]">
            <div className="w-[105px] bg-blue-600/15 py-1 dark:bg-blue-400/15">
              median
            </div>
            <div className="hidden bg-blue-600/15 dark:bg-blue-400/15 sm:block sm:w-[325px] sm:shrink-0 sm:grow-0 sm:py-1">
              PDF
            </div>
          </div>
          <div className="w-[43px] shrink-0 grow-0 bg-blue-600/15 py-1 dark:bg-blue-400/15"></div>
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
