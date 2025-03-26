import { useTranslations } from "next-intl";
import { FC, ReactNode, useMemo } from "react";

import ForecastMakerGroupCopyMenu from "@/app/(main)/questions/[id]/components/forecast_maker/forecast_maker_group/forecast_maker_group_copy_menu";
import { useAuth } from "@/contexts/auth_context";
import { ContinuousForecastInputType } from "@/types/charts";
import { ErrorResponse } from "@/types/fetch";
import { QuestionStatus, Resolution } from "@/types/post";
import {
  DistributionQuantile,
  DistributionQuantileComponent,
  DistributionSlider,
  DistributionSliderComponent,
  Quartiles,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { isUnitCompact } from "@/utils/questions";

import { AccordionItem } from "./group_forecast_accordion_item";
import { useHideCP } from "../../cp_provider";
import ContinuousInputWrapper from "../forecast_maker_group/continuous_input_wrapper";

export type ContinuousGroupOption = {
  id: number;
  name: string;
  question: QuestionWithNumericForecasts;
  userSliderForecast: DistributionSliderComponent[];
  userQuantileForecast: DistributionQuantileComponent;
  forecastInputMode: ContinuousForecastInputType;
  userQuartiles: Quartiles | null;
  communityQuartiles: Quartiles | null;
  isDirty: boolean;
  hasUserForecast: boolean;
  resolution: Resolution | null;
  menu?: ReactNode;
};

type Props = {
  options: ContinuousGroupOption[];
  groupVariable: string;
  canPredict: boolean;
  isPending: boolean;
  subQuestionId?: number | null;
  handleChange: (
    optionId: number,
    distribution: DistributionSlider | DistributionQuantile
  ) => void;
  handleAddComponent: (option: ContinuousGroupOption) => void;
  handleResetForecasts: (option?: ContinuousGroupOption) => void;
  handlePredictSubmit: (id: number) => Promise<
    | {
        errors: ErrorResponse | undefined;
      }
    | undefined
  >;
  handleForecastInputModeChange: (
    optionId: number,
    mode: ContinuousForecastInputType
  ) => void;
  handleCopy: (fromOptionId: number, toOptionId: number) => void;
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
  handleForecastInputModeChange,
  handleCopy,
}) => {
  const t = useTranslations();
  const { hideCP } = useHideCP();
  const { user } = useAuth();
  const showCP = !user || !hideCP;

  const { resolvedOptions, closedOptions, activeOptions } = useMemo(
    () => ({
      resolvedOptions: options.filter(
        (option) =>
          option.question.status &&
          [QuestionStatus.RESOLVED].includes(option.question.status)
      ),
      closedOptions: options.filter(
        (option) =>
          option.question.status &&
          [QuestionStatus.CLOSED].includes(option.question.status)
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

  const homogeneousUnit = useMemo(() => {
    const units = Array.from(new Set(options.map((obj) => obj.question.unit)));

    if (units.length !== 1) return undefined;

    return units[0] || undefined;
  }, [options]);

  return (
    <div className="w-full">
      {!!activeOptions.length && (
        <div className="mb-0.5 mt-2 flex w-full gap-0.5 text-left text-xs font-bold text-blue-700 dark:text-blue-700-dark">
          <div className="flex shrink grow items-center overflow-hidden bg-blue-600/15 py-1 dark:bg-blue-400/15">
            <span className="line-clamp-2 pl-4">{groupVariable}</span>
          </div>
          <div className="flex max-w-[105px] shrink grow-[3] items-center gap-0.5 text-center sm:max-w-[422px]">
            <div className="w-[105px] bg-blue-600/15 py-1 dark:bg-blue-400/15">
              {t("median")}
              {homogeneousUnit && !isUnitCompact(homogeneousUnit) && (
                <div>({homogeneousUnit})</div>
              )}
            </div>
            <div className="hidden h-full bg-blue-600/15 dark:bg-blue-400/15 sm:flex sm:w-[325px] sm:shrink-0 sm:grow-0 sm:py-1">
              <div className="m-auto">{t("pdf")}</div>
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
            type={QuestionStatus.OPEN}
            unit={
              option.question.unit && isUnitCompact(option.question.unit)
                ? option.question.unit
                : undefined
            }
          >
            <ContinuousInputWrapper
              option={option}
              copyMenu={
                <ForecastMakerGroupCopyMenu
                  option={option}
                  options={options}
                  handleCopy={handleCopy}
                />
              }
              canPredict={canPredict}
              isPending={isPending}
              handleChange={handleChange}
              handleAddComponent={handleAddComponent}
              handleResetForecasts={handleResetForecasts}
              handlePredictSubmit={handlePredictSubmit}
              setForecastInputMode={(mode) =>
                handleForecastInputModeChange(option.id, mode)
              }
            />
          </AccordionItem>
        );
      })}
      {/* Closed questions block */}
      {!!closedOptions.length && (
        <div className="m-0 flex w-full items-center justify-center bg-blue-600/15 py-1 text-center text-xs font-bold text-blue-700 dark:bg-blue-400/15 dark:text-blue-700-dark">
          {t("closedForForecasting")}
        </div>
      )}
      {closedOptions.map((option) => {
        return (
          <AccordionItem
            option={option}
            showCP={true}
            subQuestionId={subQuestionId}
            type={QuestionStatus.CLOSED}
            key={option.id}
          >
            <ContinuousInputWrapper
              option={option}
              canPredict={false}
              isPending={isPending}
              handleChange={handleChange}
              handleAddComponent={handleAddComponent}
              handleResetForecasts={handleResetForecasts}
              handlePredictSubmit={handlePredictSubmit}
              setForecastInputMode={(mode) =>
                handleForecastInputModeChange(option.id, mode)
              }
            />
          </AccordionItem>
        );
      })}
      {/* Resolved questions block */}
      {!!resolvedOptions.length && (
        <div className="m-0 flex w-full items-center justify-center bg-blue-600/15 py-1 text-center text-xs font-bold text-blue-700 dark:bg-blue-400/15 dark:text-blue-700-dark">
          {t("resolved")}
        </div>
      )}
      {resolvedOptions.map((option) => {
        return (
          <AccordionItem
            option={option}
            showCP={true}
            subQuestionId={subQuestionId}
            type={QuestionStatus.RESOLVED}
            key={option.id}
          >
            <ContinuousInputWrapper
              option={option}
              canPredict={false}
              isPending={isPending}
              handleChange={handleChange}
              handleAddComponent={handleAddComponent}
              handleResetForecasts={handleResetForecasts}
              handlePredictSubmit={handlePredictSubmit}
              setForecastInputMode={(mode) =>
                handleForecastInputModeChange(option.id, mode)
              }
            />
          </AccordionItem>
        );
      })}
    </div>
  );
};

export default GroupForecastAccordion;
