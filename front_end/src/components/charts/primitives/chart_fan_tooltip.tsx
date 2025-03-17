import { FloatingPortal } from "@floating-ui/react";
import { useLocale, useTranslations } from "next-intl";
import React, {
  ComponentProps,
  FC,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { VictoryLabel } from "victory";

import CPRevealTime from "@/components/cp_reveal_time";
import { FanOption } from "@/types/charts";
import { ChoiceTooltipItem } from "@/types/choices";
import {
  Bounds,
  ForecastAvailability,
  Quartiles,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getDisplayValue, unscaleNominalLocation } from "@/utils/charts";
import cn from "@/utils/cn";
import { formatResolution } from "@/utils/questions";

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

  return (
    <FloatingPortal id="fan-graph-container">
      <div
        ref={ref}
        className={cn(
          "pointer-events-none absolute z-100 rounded bg-gray-0 p-2 leading-4 shadow-lg dark:bg-gray-0-dark",
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
            resolved ? (
              <tr>
                <th className="px-1.5 py-1 text-left text-sm font-bold capitalize text-purple-800 dark:text-purple-800-dark">
                  {t("resolution")}
                </th>
                <td
                  className="px-1.5 py-1 text-center text-sm text-purple-800 dark:text-purple-800-dark"
                  colSpan={3}
                >
                  <div>
                    {formatResolution({
                      resolution: question.resolution,
                      questionType: question.type,
                      locale,
                      scaling: question.scaling,
                      unit: question.unit,
                    })}
                  </div>
                </td>
              </tr>
            ) : null
          }
        />
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

  return getDisplayValue({
    value: value,
    questionType: question.type,
    scaling: question.scaling,
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
      choiceLabel: `< ${getDisplayValue({
        value: unscaleNominalLocation(
          question.scaling.range_min ?? 0,
          question.scaling
        ),
        questionType: question.type,
        scaling: question.scaling,
      })}`,
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
      choiceLabel: `> ${getDisplayValue({
        value: unscaleNominalLocation(
          question.scaling.range_max ?? 1,
          question.scaling
        ),
        questionType: question.type,
        scaling: question.scaling,
      })}`,
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
