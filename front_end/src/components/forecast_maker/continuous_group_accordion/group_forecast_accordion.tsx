import { useTranslations } from "next-intl";
import { FC, ReactNode, useMemo, useState } from "react";

import ForecastMakerGroupCopyMenu from "@/components/forecast_maker/forecast_maker_group/forecast_maker_group_copy_menu";
import { useAuth } from "@/contexts/auth_context";
import { useHideCP } from "@/contexts/cp_context";
import { ContinuousForecastInputType } from "@/types/charts";
import { ErrorResponse } from "@/types/fetch";
import { ProjectPermissions, QuestionStatus, Resolution } from "@/types/post";
import {
  DistributionQuantile,
  DistributionQuantileComponent,
  DistributionSlider,
  DistributionSliderComponent,
  Quartiles,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { isUnitCompact } from "@/utils/questions/units";

import { AccordionItem } from "./group_forecast_accordion_item";
import ContinuousInputWrapper from "../forecast_maker_group/continuous_input_wrapper";
import { ForecastExpirationValue } from "../forecast_expiration_modal";

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
  forecastExpiration?: ForecastExpirationValue;
};

type Props = {
  options: ContinuousGroupOption[];
  groupVariable: string;
  canPredict: boolean;
  isPending: boolean;
  subQuestionId?: number | null;
  permission?: ProjectPermissions;
  handleChange: (
    optionId: number,
    distribution: DistributionSlider | DistributionQuantile
  ) => void;
  handleAddComponent: (option: ContinuousGroupOption) => void;
  handleResetForecasts: (option?: ContinuousGroupOption) => void;
  handlePredictSubmit: (
    id: number,
    forecastExpiration: ForecastExpirationValue
  ) => Promise<
    | {
        errors: ErrorResponse | undefined;
      }
    | undefined
  >;
  handlePredictWithdraw: (id: number) => Promise<
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
  handleForecastExpiration: (
    optionId: number,
    forecastExpiration: ForecastExpirationValue
  ) => void;
};

const GroupForecastAccordion: FC<Props> = ({
  options,
  groupVariable,
  canPredict,
  isPending,
  subQuestionId,
  permission,
  handleChange,
  handleAddComponent,
  handleResetForecasts,
  handlePredictSubmit,
  handlePredictWithdraw,
  handleForecastInputModeChange,
  handleForecastExpiration,
  handleCopy,
}) => {
  const t = useTranslations();
  const { hideCP } = useHideCP();
  const { user } = useAuth();
  const showCP = !user || !hideCP;
  const [forcedOpenId, setForcedOpenId] = useState<number>();

  const { resolvedOptions, closedOptions, activeOptions, openOptions } =
    useMemo(
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
        openOptions: options.filter(
          (option) => option.question.status === QuestionStatus.OPEN
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
            forcedOpenId={forcedOpenId}
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
                openOptions.length > 1 &&
                option.question.status === QuestionStatus.OPEN ? (
                  <ForecastMakerGroupCopyMenu
                    option={option}
                    options={openOptions}
                    handleCopy={handleCopy}
                    setForcedOpenId={setForcedOpenId}
                  />
                ) : undefined
              }
              permission={permission}
              canPredict={canPredict}
              isPending={isPending}
              handleChange={handleChange}
              handleAddComponent={handleAddComponent}
              handleResetForecasts={handleResetForecasts}
              handlePredictSubmit={handlePredictSubmit}
              handlePredictWithdraw={handlePredictWithdraw}
              handleForecastExpiration={handleForecastExpiration}
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
              handlePredictWithdraw={handlePredictWithdraw}
              setForecastInputMode={(mode) =>
                handleForecastInputModeChange(option.id, mode)
              }
              handleForecastExpiration={handleForecastExpiration}
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
              handlePredictWithdraw={handlePredictWithdraw}
              setForecastInputMode={(mode) =>
                handleForecastInputModeChange(option.id, mode)
              }
              handleForecastExpiration={handleForecastExpiration}
            />
          </AccordionItem>
        );
      })}
    </div>
  );
};

export default GroupForecastAccordion;
