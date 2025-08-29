import { FloatingPortal } from "@floating-ui/react";
import { useLocale, useTranslations } from "next-intl";
import React, {
  ComponentProps,
  FC,
  PropsWithChildren,
  ReactNode,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { VictoryLabel } from "victory";

import CPRevealTime from "@/components/cp_reveal_time";
import { FanOption } from "@/types/charts";
import { ChoiceTooltipItem } from "@/types/choices";
import { QuestionStatus } from "@/types/post";
import {
  Bounds,
  ForecastAvailability,
  Quartiles,
  QuestionWithNumericForecasts,
} from "@/types/question";
import cn from "@/utils/core/cn";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { formatResolution } from "@/utils/formatters/resolution";
import { unscaleNominalLocation } from "@/utils/math";
import { getQuestionForecastAvailability } from "@/utils/questions/forecastAvailability";
import { isUnsuccessfullyResolved } from "@/utils/questions/resolution";

import GroupPredictionsTooltip from "./group_predictions_tooltip";

const TOOLTIP_PADDING = 10;

type Props = ComponentProps<typeof VictoryLabel> & {
  options: FanOption[];
  chartHeight: number;
  forecastAvailability?: ForecastAvailability;
  hideCp?: boolean;
};

const ChartFanTooltip: FC<Props> = ({
  options,
  chartHeight,
  hideCp = false,
  forecastAvailability,
  ...props
}) => {
  const t = useTranslations();
  const locale = useLocale();

  const { x, y, datum } = props;
  const option = datum?.xName;

  const optionsMap = useMemo(
    () =>
      options.reduce<Record<string, FanOption>>(
        (acc, el) => ({ ...acc, [el.name]: el }),
        {}
      ),
    [options]
  );
  const activeItem = optionsMap[option];

  const { ref, width, height } = useTooltipSize(!!activeItem);

  if (typeof option !== "string" || !x || !y) {
    return null;
  }

  if (!activeItem) {
    return null;
  }

  const {
    communityQuartiles,
    communityBounds,
    userQuartiles,
    userBounds,
    question,
    resolved,
  } = activeItem;

  if (!question) {
    return null;
  }

  const position =
    y + TOOLTIP_PADDING + height > chartHeight ? "top" : "bottom";

  const communityPredictions = getTooltipItems({
    t,
    quartiles: communityQuartiles,
    bounds: communityBounds,
    question,
    hideCp,
    forecastAvailability,
  });
  const userPredictions = getTooltipItems({
    t,
    quartiles: userQuartiles,
    bounds: userBounds,
    question,
  });

  const questionForecastAvailability =
    getQuestionForecastAvailability(question);

  if (question.status === QuestionStatus.UPCOMING) {
    return (
      <MinifiedTooltip ref={ref} width={width} height={height} x={x} y={y}>
        <span>{t("Upcoming")}</span>
      </MinifiedTooltip>
    );
  } else if (questionForecastAvailability.cpRevealsOn) {
    return (
      <MinifiedTooltip ref={ref} width={width} height={height} x={x} y={y}>
        <CPRevealTime
          hiddenUntilView
          cpRevealTime={questionForecastAvailability.cpRevealsOn}
        />
      </MinifiedTooltip>
    );
  } else if (questionForecastAvailability.isEmpty) {
    return (
      <MinifiedTooltip ref={ref} width={width} height={height} x={x} y={y}>
        <span>{t("noForecastsYet")}</span>
      </MinifiedTooltip>
    );
  }

  const unsuccessfullyResolved = isUnsuccessfullyResolved(question.resolution);
  if (unsuccessfullyResolved) {
    return (
      <MinifiedTooltip
        ref={ref}
        width={width}
        height={height}
        x={x}
        y={y}
        className="border-purple-600 p-2 dark:border-purple-600-dark"
      >
        <div>
          {formatResolution({
            resolution: question.resolution,
            questionType: question.type,
            locale,
            scaling: question.scaling,
            unit: question.unit,
            actual_resolve_time: question.actual_resolve_time ?? null,
          })}
        </div>
      </MinifiedTooltip>
    );
  }

  return (
    <FloatingPortal id="fan-graph-container">
      <div
        ref={ref}
        className={cn(
          "pointer-events-none absolute z-100 rounded bg-gray-0 text-xs leading-4 shadow-lg dark:bg-gray-0-dark",
          { "opacity-0": !width && !height }
        )}
        style={{
          left: x - width / 2,
          top:
            position === "bottom"
              ? y + TOOLTIP_PADDING
              : y - height - TOOLTIP_PADDING,
        }}
      >
        <GroupPredictionsTooltip
          title={activeItem.question.label}
          communityPredictions={communityPredictions}
          userPredictions={userPredictions}
          FooterRow={
            <>
              {/* Total Forecasters Row */}
              <tr className="border-t border-gray-300 dark:border-gray-300-dark">
                <th className="px-3 pb-1.5 pt-2 text-left text-sm font-medium capitalize text-gray-800 dark:text-gray-800-dark">
                  {t("totalForecastersLabel")}
                </th>
                <td
                  className="pb-1 pr-3.5 pt-2 text-right text-sm font-normal tabular-nums text-gray-700 dark:text-gray-700-dark"
                  colSpan={3}
                >
                  {activeItem.question.aggregations[
                    activeItem.question.default_aggregation_method
                  ].latest?.forecaster_count ?? 0}
                </td>
              </tr>
              {/* Resolution Row - only if resolved */}
              {resolved && (
                <tr className="border-t border-gray-300 dark:border-gray-300-dark">
                  <th className="px-3 pb-1 pt-2 text-left text-sm font-medium capitalize text-gray-800 dark:text-gray-800-dark">
                    {t("resolution")}
                  </th>
                  <td
                    className="pb-1 pr-3.5 pt-2 text-right text-sm font-normal tabular-nums text-purple-800 dark:text-purple-800-dark"
                    colSpan={3}
                  >
                    <div>
                      {formatResolution({
                        resolution: question.resolution,
                        questionType: question.type,
                        locale,
                        scaling: question.scaling,
                        unit: question.unit,
                        actual_resolve_time:
                          question.actual_resolve_time ?? null,
                      })}
                    </div>
                  </td>
                </tr>
              )}
            </>
          }
        />
      </div>
    </FloatingPortal>
  );
};

const MinifiedTooltip: FC<
  PropsWithChildren<{
    ref: RefObject<HTMLDivElement | null>;
    width: number;
    height: number;
    x: number;
    y: number;
    className?: string;
  }>
> = ({ children, ref, width, height, x, y, className }) => {
  return (
    <FloatingPortal id="fan-graph-container">
      <div
        ref={ref}
        className={cn(
          "pointer-events-none absolute z-100 max-w-[200px] rounded border border-gray-300 bg-gray-0 p-2.5 text-center text-sm shadow-lg dark:border-gray-300-dark dark:bg-gray-0-dark",
          { "opacity-0": !width && !height },
          className
        )}
        style={{
          left: x - width / 2,
          top: y - height / 2,
        }}
      >
        {children}
      </div>
    </FloatingPortal>
  );
};

// we use this hook instead of useContainerSize because tooltip is rendered inside portal
// therefore, we need to delay the size calculation
const useTooltipSize = (open: boolean) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({
    height: 0,
    width: 0,
  });

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        const { width, height } = ref.current?.getBoundingClientRect() ?? {};
        if (width && height) {
          setSize({
            height,
            width,
          });
        }
      });
    }
  }, [open]);

  return { ref, ...size };
};

const getPredictionLabel = ({
  t,
  value,
  question,
  hideCp,
  forecastAvailability,
}: {
  t: ReturnType<typeof useTranslations>;
  value: number | null | undefined;
  question: QuestionWithNumericForecasts;
  hideCp?: boolean;
  forecastAvailability?: ForecastAvailability;
}): ReactNode => {
  if (forecastAvailability?.cpRevealsOn) {
    return <CPRevealTime cpRevealTime={forecastAvailability.cpRevealsOn} />;
  }

  if (forecastAvailability?.isEmpty) {
    return t("noForecastsYet");
  }

  if (hideCp) {
    return "...";
  }

  return getPredictionDisplayValue(value, {
    questionType: question.type,
    scaling: question.scaling,
    actual_resolve_time: question.actual_resolve_time ?? null,
  });
};

const getBoundsLabel = ({
  t,
  value,
  forecastAvailability,
  hideCp,
}: {
  t: ReturnType<typeof useTranslations>;
  value: number | null | undefined;
  forecastAvailability?: ForecastAvailability;
  hideCp?: boolean;
}) => {
  if (forecastAvailability?.cpRevealsOn) {
    return <CPRevealTime cpRevealTime={forecastAvailability.cpRevealsOn} />;
  }

  if (forecastAvailability?.isEmpty) {
    return t("noForecastsYet");
  }

  if (!value || hideCp) {
    return "...";
  }

  return (value * 100).toFixed(1) + "%";
};

function getTooltipItems({
  t,
  quartiles,
  bounds,
  question,
  hideCp,
  forecastAvailability,
}: {
  t: ReturnType<typeof useTranslations>;
  quartiles: Quartiles | null;
  bounds: Bounds | null;
  question: QuestionWithNumericForecasts;
  hideCp?: boolean;
  forecastAvailability?: ForecastAvailability;
}): ChoiceTooltipItem[] {
  const tooltipItems: ChoiceTooltipItem[] = [
    {
      choiceLabel: t("fanGraphThirdQuartileLabel"),
      valueElement: getPredictionLabel({
        t,
        value: quartiles?.upper75,
        question,
        hideCp,
        forecastAvailability,
      }),
    },
    {
      choiceLabel: t("fanGraphSecondQuartileLabel"),
      valueElement: getPredictionLabel({
        t,
        value: quartiles?.median,
        question,
        hideCp,
        forecastAvailability,
      }),
    },
    {
      choiceLabel: t("fanGraphFirstQuartileLabel"),
      valueElement: getPredictionLabel({
        t,
        value: quartiles?.lower25,
        question,
        hideCp,
        forecastAvailability,
      }),
    },
  ];

  if (question.open_lower_bound) {
    tooltipItems.unshift({
      choiceLabel: `${getPredictionDisplayValue(
        unscaleNominalLocation(
          question.scaling.range_min ?? 0,
          question.scaling
        ),
        {
          questionType: question.type,
          scaling: question.scaling,
          actual_resolve_time: question.actual_resolve_time ?? null,
        }
      )}`,
      valueElement: getBoundsLabel({
        t,
        value: bounds?.belowLower,
        forecastAvailability,
        hideCp,
      }),
    });
  }

  if (question.open_upper_bound) {
    tooltipItems.push({
      choiceLabel: `${getPredictionDisplayValue(
        unscaleNominalLocation(
          question.scaling.range_max ?? 1,
          question.scaling
        ),
        {
          questionType: question.type,
          scaling: question.scaling,
          actual_resolve_time: question.actual_resolve_time ?? null,
        }
      )}`,
      valueElement: getBoundsLabel({
        t,
        value: bounds?.aboveUpper,
        forecastAvailability,
        hideCp,
      }),
    });
  }

  return tooltipItems;
}

export default ChartFanTooltip;
