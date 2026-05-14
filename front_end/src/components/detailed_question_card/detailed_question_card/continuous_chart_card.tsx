"use client";
import { isNil } from "lodash";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { VictoryThemeDefinition } from "victory";

import { useIsEmbedMode } from "@/app/(embed)/questions/components/question_view_mode_context";
import QuestionHeaderCPStatus from "@/app/(main)/questions/[id]/components/question_view/forecaster_question_view/question_header/question_header_cp_status";
import NumericTimeline from "@/components/charts/numeric_timeline";
import QuestionPredictionTooltip from "@/components/charts/primitives/question_prediction_tooltip";
import ContinuousPredictionChart from "@/components/forecast_maker/continuous_input/continuous_prediction_chart";
import Button from "@/components/ui/button";
import { GroupButton } from "@/components/ui/button_group";
import { useAuth } from "@/contexts/auth_context";
import { useContinuousChartCursor } from "@/contexts/continuous_chart_cursor_context";
import { EmbedChartType, TimelineChartZoomOption } from "@/types/charts";
import { KeyFactor } from "@/types/comment";
import {
  ForecastAvailability,
  NumericAggregateForecast,
  QuestionType,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { ThemeColor } from "@/types/theme";
import { getCursorForecast } from "@/utils/charts/cursor";
import cn from "@/utils/core/cn";
import { isForecastActive } from "@/utils/forecasts/helpers";
import {
  getDiscreteValueOptions,
  getPredictionDisplayValue,
  getUserPredictionDisplayValue,
} from "@/utils/formatters/prediction";
import {
  getPostDrivenTime,
  isContinuousQuestion,
} from "@/utils/questions/helpers";

import { useFullAggregation } from "./hooks/use_full_aggregation";

const Histogram = dynamic(() => import("@/components/charts/histogram"), {
  ssr: false,
});

type Props = {
  question: QuestionWithNumericForecasts;
  hideCP?: boolean;
  nrForecasters?: number;
  forecastAvailability?: ForecastAvailability;
  hideTitle?: boolean;
  isConsumerView?: boolean;
  embedChartHeight?: number;
  extraTheme?: VictoryThemeDefinition;
  colorOverride?: ThemeColor | string;
  defaultZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  embedChartType?: EmbedChartType;
  keyFactors?: KeyFactor[];
};

type ChartView = "timeline" | "histogram";

const DetailedContinuousChartCard: FC<Props> = ({
  question,
  hideCP,
  nrForecasters,
  forecastAvailability,
  hideTitle,
  isConsumerView: isConsumerViewProp,
  embedChartHeight,
  extraTheme,
  colorOverride,
  defaultZoom,
  withZoomPicker,
  embedChartType,
  keyFactors,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const effectiveDefaultZoom =
    defaultZoom ??
    (user ? TimelineChartZoomOption.All : TimelineChartZoomOption.TwoMonths);

  const effectiveWithZoomPicker = withZoomPicker ?? true;
  const isConsumerView = isConsumerViewProp ?? !user;
  const isContinuousConsumer = isConsumerView && isContinuousQuestion(question);
  const [isChartReady, setIsChartReady] = useState(false);
  const [activeView, setActiveView] = useState<ChartView>("timeline");

  const isContinuous = isContinuousQuestion(question);
  const [shouldFetchFull, setShouldFetchFull] = useState(false);
  const { data: enrichedAggregation = null } = useFullAggregation(
    question.id,
    question.default_aggregation_method,
    question.include_bots_in_aggregates,
    isContinuous && shouldFetchFull
  );

  const handlePointerEnter = useCallback(() => {
    if (isContinuous) setShouldFetchFull(true);
  }, [isContinuous]);

  const aggregation =
    question.aggregations[question.default_aggregation_method];
  const effectiveAggregation = (enrichedAggregation ??
    aggregation) as typeof aggregation;
  const isCpHidden = !!forecastAvailability?.cpRevealsOn;

  const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);
  const [showNewsAnnotations, setShowNewsAnnotations] = useState(true);
  const hasNewsKeyFactors = keyFactors?.some((kf) => !!kf.news) ?? false;

  const cursorData = useMemo(() => {
    if (isCpHidden) {
      return {
        timestamp:
          cursorTimestamp ?? question.my_forecasts?.latest?.start_time ?? null,
        forecasterCount: nrForecasters ?? 0,
        interval_lower_bound: null,
        center: null,
        interval_upper_bound: null,
      };
    }

    const forecast = getCursorForecast(cursorTimestamp, effectiveAggregation);
    let timestamp = cursorTimestamp;
    if (
      timestamp === null &&
      question.my_forecasts?.latest?.start_time &&
      isForecastActive(question.my_forecasts?.latest) &&
      forecast &&
      forecast.start_time < question.my_forecasts.latest.start_time
    ) {
      timestamp = question.my_forecasts.latest.start_time;
    } else {
      timestamp = forecast?.start_time ?? cursorTimestamp;
    }

    return {
      timestamp: timestamp,
      forecasterCount: forecast?.forecaster_count ?? 0,
      interval_lower_bound: forecast?.interval_lower_bounds?.[0] ?? null,
      center: forecast?.centers?.[0] ?? null,
      interval_upper_bound: forecast?.interval_upper_bounds?.[0] ?? null,
    };
  }, [
    isCpHidden,
    cursorTimestamp,
    effectiveAggregation,
    question.my_forecasts,
    nrForecasters,
  ]);

  const discreteValueOptions = getDiscreteValueOptions(question);

  const cpCursorElement = useMemo(() => {
    if (hideCP) {
      return "...";
    }

    const displayValue = getPredictionDisplayValue(cursorData?.center, {
      questionType: question.type,
      scaling: question.scaling,
      unit: question.unit,
      actual_resolve_time: question.actual_resolve_time ?? null,
      discreteValueOptions,
    });
    return renderDisplayValue(displayValue);
  }, [
    t,
    cursorData,
    forecastAvailability,
    question.scaling,
    question.type,
    question.actual_resolve_time,
    question.unit,
    hideCP,
    discreteValueOptions,
  ]);

  const userCursorElement = useMemo(() => {
    if (!question.my_forecasts?.history.length) {
      return null;
    }
    const userDisplayValue = getUserPredictionDisplayValue({
      myForecasts: question.my_forecasts,
      timestamp: cursorData.timestamp,
      questionType: question.type,
      scaling: question.scaling,
      showRange: false,
      unit: question.unit,
      actual_resolve_time: question.actual_resolve_time ?? null,
      discreteValueOptions,
    });
    return renderDisplayValue(userDisplayValue);
  }, [
    question.my_forecasts,
    cursorData.timestamp,
    question.type,
    question.scaling,
    question.actual_resolve_time,
    question.unit,
    discreteValueOptions,
  ]);

  const isBinary = question.type === QuestionType.Binary;

  const activeForecast = useMemo<NumericAggregateForecast | null>(() => {
    if (
      isCpHidden ||
      cursorTimestamp === null ||
      !isContinuousQuestion(question)
    )
      return null;
    return getCursorForecast(
      cursorTimestamp,
      effectiveAggregation
    ) as NumericAggregateForecast | null;
  }, [isCpHidden, cursorTimestamp, effectiveAggregation, question]);

  const cursorCtx = useContinuousChartCursor();
  const setCursorForecast = cursorCtx?.setActiveForecast;
  useEffect(() => {
    if (!isContinuousQuestion(question) || !setCursorForecast) return;
    setCursorForecast(activeForecast);
    return () => setCursorForecast(null);
  }, [activeForecast, setCursorForecast, question]);

  const handleCursorChange = useCallback((value: number | null) => {
    setCursorTimestamp(value);
  }, []);

  const handleChartReady = useCallback(() => {
    setIsChartReady(true);
  }, []);

  const isEmbed = useIsEmbedMode();

  const cursorTooltip = useMemo(() => {
    return (
      <QuestionPredictionTooltip
        communityPrediction={cpCursorElement}
        userPrediction={userCursorElement}
        totalForecasters={cursorData.forecasterCount}
        questionStatus={question.status}
      />
    );
  }, [
    cpCursorElement,
    userCursorElement,
    cursorData.forecasterCount,
    question.status,
  ]);

  const shouldOverlayCp =
    isEmbed &&
    !hideCP &&
    !forecastAvailability?.isEmpty &&
    !forecastAvailability?.cpRevealsOn &&
    (question.type === QuestionType.Binary || isContinuousQuestion(question));

  const chartViewButtons: GroupButton<ChartView>[] = [
    { value: "timeline", label: t("timeline") },
    { value: "histogram", label: t("histogram") },
  ];

  const viewToggle = isBinary ? (
    <div className="flex gap-2 pl-2">
      {chartViewButtons.map(({ value, label }) => (
        <Button
          key={value}
          onClick={() => setActiveView(value)}
          className={cn(
            "h-6 rounded border-0 px-1 py-0.5 text-sm font-normal leading-4",
            activeView === value
              ? "bg-blue-200 text-blue-800 hover:text-blue-800 active:text-blue-800 dark:bg-blue-200-dark dark:text-blue-800-dark"
              : "text-gray-500 hover:text-gray-500 active:text-gray-500 dark:text-gray-500-dark"
          )}
        >
          {label}
        </Button>
      ))}
    </div>
  ) : null;

  // Binary gets the toggle as the title node; continuous keeps the text heading.
  let timelineTitle: ReactNode;
  if (!isEmbed && !hideTitle) {
    timelineTitle = isBinary ? viewToggle : t("forecastTimelineHeading");
  }

  const chartHeight = embedChartHeight ?? 150;

  const renderTimeline = () => (
    <NumericTimeline
      aggregation={effectiveAggregation}
      myForecasts={question.my_forecasts}
      resolution={question.resolution}
      resolveTime={question.actual_resolve_time}
      cursorTimestamp={cursorTimestamp}
      onCursorChange={handleCursorChange}
      onChartReady={handleChartReady}
      questionType={question.type}
      questionStatus={question.status}
      actualCloseTime={getPostDrivenTime(question.actual_close_time)}
      scaling={question.scaling}
      defaultZoom={effectiveDefaultZoom}
      withZoomPicker={effectiveWithZoomPicker}
      hideCP={hideCP || !!forecastAvailability?.cpRevealsOn}
      isEmptyDomain={
        !!forecastAvailability?.isEmpty || !!forecastAvailability?.cpRevealsOn
      }
      openTime={getPostDrivenTime(question.open_time)}
      unit={question.unit}
      inboundOutcomeCount={question.inbound_outcome_count}
      simplifiedCursor={false}
      hideCursorValueLabel={isContinuousConsumer && !isEmbed}
      title={timelineTitle}
      forecastAvailability={forecastAvailability}
      suppressEmptyOverlay
      cursorTooltip={
        forecastAvailability?.isEmpty || isContinuous
          ? undefined
          : cursorTooltip
      }
      isConsumerView={isContinuousConsumer}
      isEmbedded={isEmbed}
      height={chartHeight}
      extraTheme={extraTheme}
      colorOverride={colorOverride}
      keyFactors={hasNewsKeyFactors ? keyFactors : undefined}
      showNewsAnnotations={showNewsAnnotations}
      onToggleNewsAnnotations={
        hasNewsKeyFactors
          ? () => setShowNewsAnnotations((prev) => !prev)
          : undefined
      }
    />
  );

  const cpColorOverride: string | undefined =
    typeof colorOverride === "string" ? colorOverride : undefined;

  const overlayNode = (
    <QuestionHeaderCPStatus
      question={question}
      size="md"
      hideLabel={isContinuousQuestion(question)}
      colorOverride={cpColorOverride}
      chartTheme={extraTheme}
      cursorForecast={activeForecast}
    />
  );

  const canRenderCurrentEmbed =
    embedChartType === EmbedChartType.Current &&
    !hideCP &&
    !forecastAvailability?.cpRevealsOn;

  const renderHistogram = () => {
    const aggregationLatest = effectiveAggregation.latest;
    const histogram = aggregationLatest?.histogram?.at(0);
    if (!histogram?.length) {
      return (
        <div className="flex w-full flex-col">
          {!isEmbed && !hideTitle && (
            <div className="mb-2.5 flex w-full md:mb-5">
              <div className="text-xs font-normal text-blue-900 dark:text-gray-900-dark md:text-base">
                {viewToggle}
              </div>
            </div>
          )}
          <div
            className="flex w-full items-center justify-center"
            style={{ height: chartHeight }}
          >
            <span className="text-sm text-gray-500 dark:text-gray-500-dark">
              {t("noHistogramData")}
            </span>
          </div>
        </div>
      );
    }

    const histogramData = histogram.map((value, index) => ({
      x: index,
      y: value,
    }));
    const median = aggregationLatest?.centers?.[0];
    const mean = aggregationLatest?.means?.[0];

    return (
      <div className="flex w-full flex-col">
        {!isEmbed && !hideTitle && (
          <div className="mb-2.5 flex w-full md:mb-5">
            <div className="text-xs font-normal text-blue-900 dark:text-gray-900-dark md:text-base">
              {viewToggle}
            </div>
          </div>
        )}
        <div
          className="flex w-full flex-col justify-center"
          style={{ height: chartHeight }}
        >
          {!hideCP && !isCpHidden && (
            <Histogram
              histogramData={histogramData}
              median={median}
              mean={mean}
              color="gray"
            />
          )}
        </div>
      </div>
    );
  };

  if (canRenderCurrentEmbed) {
    return (
      <div className="w-full overflow-hidden" style={{ height: chartHeight }}>
        <ContinuousPredictionChart
          question={question}
          dataset={{
            cdf: [],
            pmf: [],
          }}
          chartTheme={extraTheme}
          graphType={"pmf"}
          height={chartHeight}
          readOnly
        />
      </div>
    );
  }

  if (isBinary && activeView === "histogram") {
    return <>{renderHistogram()}</>;
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        isChartReady ? "opacity-100" : "opacity-0"
      )}
      onPointerEnter={isContinuous ? handlePointerEnter : undefined}
    >
      {isContinuousQuestion(question) && !isEmbed ? (
        <>
          {/* Desktop */}
          <div className="hidden items-stretch gap-4 md:flex">
            {isContinuousQuestion(question) && !isEmbed && (
              <QuestionHeaderCPStatus
                question={question}
                size="lg"
                hideLabel={true}
                cursorForecast={activeForecast}
              />
            )}

            <div className="relative flex-1">
              <OverlayableTimeline
                enabled={shouldOverlayCp}
                alwaysOverlay={isBinary}
                timeline={renderTimeline()}
                overlay={overlayNode}
              />
            </div>
          </div>

          {/* Mobile */}
          <div className="relative md:hidden">
            <OverlayableTimeline
              enabled={shouldOverlayCp}
              alwaysOverlay={isBinary}
              timeline={renderTimeline()}
              overlay={overlayNode}
            />
          </div>
        </>
      ) : (
        <div className="relative">
          <OverlayableTimeline
            enabled={shouldOverlayCp}
            alwaysOverlay={isBinary}
            timeline={renderTimeline()}
            overlay={overlayNode}
          />
        </div>
      )}
    </div>
  );
};

type OverlayableTimelineProps = {
  enabled: boolean;
  alwaysOverlay?: boolean;
  timeline: ReactNode;
  overlay: ReactNode;
};

const OverlayableTimeline: FC<OverlayableTimelineProps> = ({
  enabled,
  alwaysOverlay,
  timeline,
  overlay,
}) => {
  if (!enabled) return <>{timeline}</>;

  return (
    <div
      className={cn(
        "group relative flex",
        !alwaysOverlay && "@[23.5rem]:items-center @[23.5rem]:gap-3"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-10 flex items-center justify-center",
          "opacity-100 transition-opacity duration-200 group-focus-within:opacity-0 group-hover:opacity-0",
          alwaysOverlay
            ? "@[23.5rem]:hidden"
            : cn(
                "@[23.5rem]:pointer-events-auto @[23.5rem]:static @[23.5rem]:inset-auto @[23.5rem]:z-auto",
                "@[23.5rem]:shrink-0 @[23.5rem]:opacity-100 @[23.5rem]:transition-none",
                "@[23.5rem]:group-focus-within:opacity-100 @[23.5rem]:group-hover:opacity-100"
              )
        )}
      >
        {overlay}
      </div>
      <div
        className={cn(
          "opacity-10 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100",
          "@[23.5rem]:min-w-0 @[23.5rem]:flex-1 @[23.5rem]:opacity-100 @[23.5rem]:transition-none"
        )}
      >
        {timeline}
      </div>
    </div>
  );
};

function renderDisplayValue(displayValue: string): ReactNode {
  const displayValueChunks = displayValue.split("\n");
  if (displayValueChunks.length > 1) {
    const [centerLabel, intervalLabel] = displayValueChunks;
    return (
      <>
        <div>{centerLabel}</div>
        {!isNil(intervalLabel) && (
          <div className="text-xs font-medium">{intervalLabel}</div>
        )}
      </>
    );
  }
  return displayValue;
}

export default DetailedContinuousChartCard;
