"use client";

import { format } from "date-fns";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";

import NumericTimeline from "@/components/charts/numeric_timeline";
import ExampleContinuousInput from "@/components/forecast_maker/continuous_input/example_continuous_input";
import Checkbox from "@/components/ui/checkbox";
import DatetimeUtc from "@/components/ui/datetime_utc";
import { FormError, Input } from "@/components/ui/form_field";
import { usePublicSettings } from "@/contexts/public_settings_context";
import {
  DefaultInboundOutcomeCount,
  QuestionDraft,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { ContinuousQuestionType, QuestionType } from "@/types/question";
import { getQuestionDraft } from "@/utils/drafts/questionForm";

const NumericQuestionInput: React.FC<{
  onChange: ({
    range_min,
    range_max,
    zero_point,
    open_upper_bound,
    open_lower_bound,
    inbound_outcome_count,
  }: {
    range_min: number;
    range_max: number;
    zero_point: number | null;
    open_upper_bound: boolean;
    open_lower_bound: boolean;
    inbound_outcome_count: number;
  }) => void;
  questionType: ContinuousQuestionType;
  defaultMin: number | undefined;
  defaultMax: number | undefined;
  defaultZeroPoint: number | undefined | null;
  defaultOpenUpperBound: boolean | undefined | null;
  defaultOpenLowerBound: boolean | undefined | null;
  defaultInboundOutcomeCount: number | undefined | null;
  hasForecasts: boolean;
  control?: UseFormReturn;
  index?: number;
  unit?: string;
  draftKey?: string;
}> = ({
  onChange,
  questionType,
  defaultMin,
  defaultMax,
  defaultZeroPoint,
  defaultOpenUpperBound,
  defaultOpenLowerBound,
  defaultInboundOutcomeCount,
  hasForecasts,
  control,
  index,
  unit,
  draftKey,
}) => {
  const t = useTranslations();
  const { DEBUG } = usePublicSettings();
  const [errors, setError] = useState<string[]>([]);
  const [min, setMin] = useState(
    questionType !== QuestionType.Discrete ||
      isNil(defaultMin) ||
      isNil(defaultMax) ||
      isNil(defaultInboundOutcomeCount)
      ? defaultMin
      : Math.round(
          1e10 *
            (defaultMin +
              0.5 * ((defaultMax - defaultMin) / defaultInboundOutcomeCount))
        ) / 1e10
  );
  const [max, setMax] = useState(
    questionType !== QuestionType.Discrete ||
      isNil(defaultMin) ||
      isNil(defaultMax) ||
      isNil(defaultInboundOutcomeCount)
      ? defaultMax
      : Math.round(
          1e10 *
            (defaultMax -
              0.5 * ((defaultMax - defaultMin) / defaultInboundOutcomeCount))
        ) / 1e10
  );
  const [openUpperBound, setOpenUpperBound] = useState(
    isNil(defaultOpenUpperBound) ? false : defaultOpenUpperBound
  );
  const [openLowerBound, setOpenLowerBound] = useState(
    isNil(defaultOpenLowerBound) ? false : defaultOpenLowerBound
  );
  const [zeroPoint, setZeroPoint] = useState(
    isNil(defaultZeroPoint) || Number.isNaN(defaultZeroPoint)
      ? null
      : defaultZeroPoint
  );
  const [step, setStep] = useState(
    isNil(defaultInboundOutcomeCount) || isNil(max) || isNil(min)
      ? 1
      : Math.round(1e10 * ((max - min) / (defaultInboundOutcomeCount - 1))) /
          1e10
  );
  const [question, setQuestion] = useState<QuestionWithNumericForecasts>({
    id: 1,
    title: "",
    description: "",
    created_at: "",
    updated_at: "",
    scheduled_close_time: "",
    scheduled_resolve_time: "",
    fine_print: "",
    resolution_criteria: "",
    label: "",
    unit: unit || "",
    author_username: "",
    post_id: 0,
    resolution: "",
    include_bots_in_aggregates: false,
    question_weight: 1.0,
    default_score_type: "peer",
    forecasts: {
      timestamps: [],
      nr_forecasters: [],
      my_forecasts: {
        timestamps: [],
        medians: [],
        distribution_input: null,
      },
      medians: [],
      q3s: [],
      q1s: [],
      means: [],
      latest_pmf: [],
      latest_cdf: [],
      histogram: [],
    },
    type: questionType,
    scaling: {
      range_max: max as number,
      range_min: min as number,
      zero_point: zeroPoint,
    },
    open_lower_bound: openLowerBound,
    open_upper_bound: openUpperBound,
    inbound_outcome_count: isNil(defaultInboundOutcomeCount)
      ? questionType !== QuestionType.Discrete || isNil(min) || isNil(max)
        ? DefaultInboundOutcomeCount
        : Math.max(3, Math.min(200, Math.round((max - min) / step)))
      : defaultInboundOutcomeCount,
    aggregations: {
      recency_weighted: { history: [], latest: undefined },
    },
  });

  const runChecks = () => {
    const current_errors = [];
    if (isNil(max)) {
      current_errors.push("Max is required");
    }
    if (isNil(min)) {
      current_errors.push("Min is required");
    }

    if (zeroPoint !== undefined && zeroPoint !== null) {
      if (questionType == QuestionType.Discrete) {
        current_errors.push(t("zeroPointError0"));
      } else {
        if ((min ? min : 0) <= zeroPoint && zeroPoint <= (max ? max : 0)) {
          questionType == QuestionType.Numeric
            ? current_errors.push(
                t.rich("zeroPointError1", { zeroPoint, min, max })
              )
            : current_errors.push(
                t.rich("zeroPointError1", {
                  zeroPoint: format(
                    new Date(zeroPoint * 1000),
                    "yyyy-MM-dd HH:mm"
                  ),
                  min: format(
                    new Date((min ? min : 0) * 1000),
                    "yyyy-MM-dd HH:mm"
                  ),
                  max: format(
                    new Date((max ? max : 0) * 1000),
                    "yyyy-MM-dd HH:mm"
                  ),
                })
              );
        }
      }
    }
    if (questionType == QuestionType.Discrete) {
      if (!isNil(min) && !isNil(max) && !isNil(step)) {
        if (step === 0) {
          current_errors.push(`Step cannot be zero`);
        }
        if (step > (max - min) / 2) {
          current_errors.push(
            t.rich("stepError0", { halfRange: (max - min) / 2 })
          );
        }
        if (step != 0 && step < (max - min) / 200) {
          current_errors.push(
            t.rich("stepError1", { rangePortion: (max - min) / 2 })
          );
        }
      }
    }
    if (!isNil(min) && !isNil(max)) {
      if (isNaN(min) || isNaN(max)) {
        current_errors.push(t("minMaxError0"));
      }
      if (min >= max) {
        current_errors.push(t("minMaxError1"));
      }
    }

    setError([...current_errors.filter((item) => typeof item === "string")]);
    if (current_errors.length > 0) {
      return false;
    }
    return true;
  };
  const isMounted = useRef(false);
  const shouldUpdateParrent = useRef(false);
  useEffect(() => {
    let mn: number = Math.round(1e10 * (min as number)) / 1e10;
    let mx: number = Math.round(1e10 * (max as number)) / 1e10;
    if (questionType === QuestionType.Discrete) {
      mx = mx - (Math.round(1e10 * (mx - mn)) % (1e10 * step)) / 1e10; // estimate new value
      mx = Math.round(1e10 * (mx + 0.5 * step)) / 1e10;
      mn -= 0.5 * step;
    }
    let inboundOutcomeCount: number;
    if (questionType === QuestionType.Discrete) {
      inboundOutcomeCount = Math.max(
        3,
        Math.min(200, Math.round((mx - mn) / step))
      );
    } else {
      inboundOutcomeCount = DefaultInboundOutcomeCount;
    }
    if (!isMounted.current) {
      // populate draft values
      const draft = getQuestionDraft(draftKey ?? "");
      if (draft) {
        const {
          draftMin,
          draftMax,
          draftOpenLowerBound,
          draftOpenUpperBound,
          draftZeroPoint,
          draftInboundOutcomeCount,
        } = getDraftValues(draft, index);
        inboundOutcomeCount =
          draftInboundOutcomeCount ?? DefaultInboundOutcomeCount;
        mn =
          Math.round(
            1e10 * (isNil(draftMin) ? min ?? 0 : (draftMin as number))
          ) / 1e10;
        mx =
          Math.round(
            1e10 * (isNil(draftMax) ? max ?? 1 : (draftMax as number))
          ) / 1e10;
        if (questionType === QuestionType.Discrete) {
          const draftStep =
            isNil(draftMin) || isNil(draftMax)
              ? 1
              : Math.round(1e10 * ((mx - mn) / inboundOutcomeCount)) / 1e10;
          setStep(draftStep);
          setMax(mx - 0.5 * draftStep);
          setMin(mn + 0.5 * draftStep);
        } else {
          setMax(mx);
          setMin(mn);
        }
        setOpenLowerBound(
          isNil(draftOpenLowerBound) ? openLowerBound : draftOpenLowerBound
        );
        setOpenUpperBound(
          isNil(draftOpenUpperBound) ? openUpperBound : draftOpenUpperBound
        );
        setZeroPoint(isNil(draftZeroPoint) ? zeroPoint : draftZeroPoint);
      } else {
        onChange({
          range_min: mn as number,
          range_max: mx as number,
          zero_point: zeroPoint,
          open_lower_bound: openLowerBound,
          open_upper_bound: openUpperBound,
          inbound_outcome_count: inboundOutcomeCount,
        });
        shouldUpdateParrent.current = true;
      }
      isMounted.current = true;
      return;
    }
    // prevent update of draft timestamp after mounting
    if (!shouldUpdateParrent.current) {
      shouldUpdateParrent.current = true;
      return;
    }
    const ok = runChecks();
    if (!ok) {
      return;
    }
    onChange({
      range_min: mn as number,
      range_max: mx as number,
      zero_point: zeroPoint,
      open_lower_bound: openLowerBound,
      open_upper_bound: openUpperBound,
      inbound_outcome_count: inboundOutcomeCount,
    });
    setQuestion((prevQuestion) => ({
      ...prevQuestion,
      scaling: {
        range_max: mx as number,
        range_min: mn as number,
        zero_point: zeroPoint,
      },
      open_upper_bound: openUpperBound,
      open_lower_bound: openLowerBound,
      inbound_outcome_count: inboundOutcomeCount,
    }));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, openUpperBound, openLowerBound, zeroPoint, step]);

  return (
    <div>
      {errors.length > 0 && isMounted.current && (
        <div className="mb-4 mt-2 flex flex-col gap-2 rounded-md bg-red-400 px-2 py-1 text-white">
          {errors.map((error, index) => {
            return <div key={index}>{error}</div>;
          })}
        </div>
      )}
      <div className="flex flex-col gap-4">
        {(questionType == QuestionType.Numeric ||
          questionType == QuestionType.Discrete) && (
          <>
            <div>
              <span className="mr-2">Min</span>
              <Input
                readOnly={hasForecasts}
                disabled={hasForecasts}
                type="number"
                step="any"
                defaultValue={min}
                onChange={(e) => {
                  e.preventDefault();
                  setMin(Number(e.target.value));
                }}
              />
            </div>
            <div>
              <span className="mr-2">Max</span>
              <Input
                readOnly={hasForecasts}
                disabled={hasForecasts}
                type="number"
                step="any"
                onChange={(e) => {
                  e.preventDefault();
                  setMax(Number(e.target.value));
                }}
                defaultValue={max}
              />
            </div>
          </>
        )}
        {questionType === QuestionType.Discrete && (
          <div className="ml-4">
            <span className="mr-2">Step</span>
            <Input
              readOnly={hasForecasts}
              disabled={hasForecasts}
              type="number"
              step="any"
              min={0}
              value={step}
              onChange={(e) => {
                setStep(Number(e.target.value));
              }}
            />
            {step > 0 &&
              !isNil(max) &&
              !isNil(min) &&
              step <= max - min &&
              !isNil(question.scaling?.range_max) &&
              Math.round(1e10 * (max - min)) % (1e10 * step) != 0 && (
                <span className="ml-2 text-sm font-medium text-red-500 dark:text-red-500-dark">
                  {t.rich("rangeWarning0", {
                    newMax:
                      Math.round(
                        1e10 * (question.scaling.range_max - 0.5 * step)
                      ) / 1e10,
                  })}
                </span>
              )}
            <br />
          </div>
        )}
        {questionType == QuestionType.Date && (
          <>
            <div className="flex w-full flex-col gap-4 md:flex-row">
              <div className="flex w-full flex-col gap-2">
                <span className="mr-2">Min</span>
                <DatetimeUtc
                  readOnly={hasForecasts}
                  disabled={hasForecasts}
                  className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
                  defaultValue={
                    !isNil(min) && !Number.isNaN(min)
                      ? new Date(min * 1000).toISOString()
                      : undefined
                  }
                  onChange={(dateString) => {
                    control?.clearErrors(`min-value-${index}`);
                    setMin(new Date(dateString).getTime() / 1000);
                  }}
                  onError={(error: { message: string }) => {
                    control &&
                      control.setError(`min-value-${index}`, {
                        type: "manual",
                        message: error.message,
                      });
                  }}
                />
                <FormError
                  errors={control?.formState.errors[`min-value-${index}`]}
                  name={`min-value`}
                />
              </div>
              <div className="flex w-full flex-col gap-2">
                <span className="mr-2">Max</span>
                <DatetimeUtc
                  readOnly={hasForecasts}
                  disabled={hasForecasts}
                  className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
                  defaultValue={
                    !isNil(max) && !Number.isNaN(max)
                      ? new Date(max * 1000).toISOString()
                      : undefined
                  }
                  onChange={(dateString) => {
                    control?.clearErrors(`max-value-${index}`);
                    setMax(new Date(dateString).getTime() / 1000);
                  }}
                  onError={(error: { message: string }) => {
                    control?.setError(`max-value-${index}`, {
                      type: "manual",
                      message: error.message,
                    });
                  }}
                />
                <FormError
                  errors={control?.formState.errors[`max-value-${index}`]}
                  name={`max-value`}
                />
              </div>
            </div>
          </>
        )}
        {
          <>
            <div className="flex w-full flex-col gap-4 md:mt-[-8px] md:flex-row">
              <div className="flex w-full flex-col gap-2">
                <Checkbox
                  label={"Open Lower Bound"}
                  readOnly={hasForecasts}
                  disabled={hasForecasts}
                  onChange={(e) => {
                    setOpenLowerBound(e);
                  }}
                  checked={openLowerBound}
                  defaultChecked={openLowerBound}
                />
              </div>
              <div className="flex w-full flex-col gap-2">
                <Checkbox
                  label={"Open Upper Bound"}
                  readOnly={hasForecasts}
                  disabled={hasForecasts}
                  onChange={async (e) => {
                    setOpenUpperBound(e);
                  }}
                  checked={openUpperBound}
                  defaultChecked={openUpperBound}
                />
              </div>
            </div>
          </>
        }
        {questionType !== QuestionType.Discrete && (
          <div>
            <span className="mr-2">Logarithmic scaling?</span>
            <Input
              disabled={hasForecasts}
              type="checkbox"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.checked) {
                  if (questionType == QuestionType.Numeric) {
                    setZeroPoint(0);
                  } else {
                    setZeroPoint(
                      (Date.now() - 1000 * 60 * 60 * 24 * 365) / 1000
                    );
                  }
                } else {
                  setZeroPoint(null);
                }
              }}
              checked={zeroPoint !== null && zeroPoint !== undefined}
            />
            {!isNil(zeroPoint) &&
              (questionType == QuestionType.Numeric ? (
                <div className="ml-2">
                  <span className="mr-2">Zero Point</span>
                  <Input
                    readOnly={hasForecasts}
                    disabled={hasForecasts}
                    type="number"
                    step="any"
                    onChange={(e) => {
                      setZeroPoint(Number(e.target.value));
                    }}
                    defaultValue={zeroPoint}
                  />
                </div>
              ) : (
                <div className="ml-2">
                  <span className="mr-2">Zero Point</span>
                  <DatetimeUtc
                    readOnly={hasForecasts}
                    disabled={hasForecasts}
                    className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
                    defaultValue={new Date(
                      !Number.isNaN(zeroPoint) ? zeroPoint * 1000 : 0
                    ).toISOString()}
                    onChange={(dateString) => {
                      setZeroPoint(new Date(dateString).getTime() / 1000);
                    }}
                  />
                </div>
              ))}
          </div>
        )}

        {errors.length === 0 && !isNil(max) && !isNil(min) && (
          <>
            NOTE: timeline to be removed. For demo purposes only:
            <NumericTimeline
              aggregation={{
                history: [
                  {
                    start_time: 1751303566.822108,
                    end_time: 1751304445.570179,
                    forecaster_count: 1,
                    interval_lower_bounds: [0.5],
                    centers: [0.666],
                    interval_upper_bounds: [0.833],
                  },
                  {
                    start_time: 1751304445.570179,
                    end_time: 1751304896.931686,
                    forecaster_count: 2,
                    interval_lower_bounds: [0.514],
                    centers: [0.723],
                    interval_upper_bounds: [0.927],
                  },
                  {
                    start_time: 1751304896.931686,
                    end_time: 1751310678.88108,
                    forecaster_count: 3,
                    interval_lower_bounds: [0.383],
                    centers: [0.656],
                    interval_upper_bounds: [0.905],
                  },
                ],
                latest: {
                  start_time: 1751495432.499511,
                  end_time: 1752001662.982,
                  forecaster_count: 31,
                  interval_lower_bounds: [0.349],
                  centers: [0.481],
                  interval_upper_bounds: [0.622],
                  forecast_values: [
                    0.036, 0.037, 0.038, 0.039, 0.04, 0.041, 0.042, 0.043,
                    0.044, 0.045, 0.046, 0.048, 0.049, 0.05, 0.052, 0.053,
                    0.054, 0.056, 0.057, 0.059, 0.061, 0.062, 0.064, 0.066,
                    0.068, 0.07, 0.072, 0.074, 0.076, 0.078, 0.08, 0.083, 0.085,
                    0.088, 0.09, 0.093, 0.096, 0.099, 0.102, 0.105, 0.108,
                    0.111, 0.115, 0.118, 0.122, 0.125, 0.129, 0.133, 0.137,
                    0.141, 0.145, 0.149, 0.154, 0.158, 0.163, 0.167, 0.172,
                    0.177, 0.182, 0.187, 0.192, 0.197, 0.203, 0.208, 0.214,
                    0.219, 0.225, 0.231, 0.237, 0.244, 0.25, 0.257, 0.264,
                    0.271, 0.278, 0.286, 0.294, 0.302, 0.311, 0.32, 0.329,
                    0.339, 0.349, 0.359, 0.369, 0.38, 0.391, 0.401, 0.412,
                    0.423, 0.434, 0.444, 0.455, 0.466, 0.476, 0.487, 0.497,
                    0.508, 0.518, 0.529, 0.539, 0.55, 0.56, 0.571, 0.581, 0.591,
                    0.601, 0.611, 0.621, 0.63, 0.639, 0.648, 0.657, 0.665,
                    0.673, 0.681, 0.689, 0.697, 0.705, 0.712, 0.719, 0.726,
                    0.733, 0.739, 0.746, 0.752, 0.758, 0.765, 0.77, 0.776,
                    0.782, 0.788, 0.793, 0.798, 0.804, 0.809, 0.814, 0.819,
                    0.824, 0.829, 0.833, 0.838, 0.842, 0.847, 0.851, 0.855,
                    0.859, 0.863, 0.867, 0.871, 0.875, 0.878, 0.882, 0.885,
                    0.889, 0.892, 0.895, 0.899, 0.902, 0.905, 0.908, 0.91,
                    0.913, 0.915, 0.917, 0.919, 0.921, 0.923, 0.925, 0.927,
                    0.929, 0.931, 0.933, 0.935, 0.936, 0.938, 0.94, 0.941,
                    0.943, 0.944, 0.946, 0.947, 0.949, 0.95, 0.951, 0.953,
                    0.954, 0.955, 0.957, 0.958, 0.959, 0.96, 0.961, 0.962,
                    0.963, 0.964, 0.965, 0.966, 0.967, 0.968, 0.969,
                  ],
                  means: null,
                  histogram: null,
                },
                score_data: {},
                movement: null,
              }}
              aggregationIndex={0}
              myForecasts={{
                history: [],
                latest: null,
                score_data: {},
              }}
              defaultZoom={"all"}
              withZoomPicker={true}
              height={150}
              cursorTimestamp={null}
              onCursorChange={() => {}}
              onChartReady={() => {}}
              questionType={question.type}
              actualCloseTime={1753484340000}
              scaling={question.scaling}
              extraTheme={undefined}
              resolution={null}
              resolveTime={null}
              hideCP={false}
              isEmptyDomain={false}
              openTime={1751302800000}
              unit={question.unit}
              tickFontSize={undefined}
              nonInteractive={undefined}
              inboundOutcomeCount={question.inbound_outcome_count}
              isEmbedded={undefined}
              simplifiedCursor={true}
            />
            Example input chart:
            <ExampleContinuousInput question={question} />
          </>
        )}
      </div>
    </div>
  );
};

function getDraftValues(draft: QuestionDraft, index?: number) {
  const isGroup = !isNil(index);
  const groupSubquestion = isGroup ? draft.subQuestions?.[index] : undefined;
  const draftMin = isGroup
    ? groupSubquestion?.scaling?.range_min
    : draft.scaling?.range_min;
  const draftMax = isGroup
    ? groupSubquestion?.scaling?.range_max
    : draft.scaling?.range_max;
  const draftOpenLowerBound = isGroup
    ? groupSubquestion?.open_lower_bound
    : draft.open_lower_bound;
  const draftOpenUpperBound = isGroup
    ? groupSubquestion?.open_upper_bound
    : draft.open_upper_bound;
  const draftZeroPoint = isGroup
    ? groupSubquestion?.scaling?.zero_point
    : draft.scaling?.zero_point;
  const draftInboundOutcomeCount = isGroup
    ? groupSubquestion?.inbound_outcome_count
    : draft.inbound_outcome_count;

  return {
    draftMin,
    draftMax,
    draftOpenLowerBound,
    draftOpenUpperBound,
    draftZeroPoint,
    draftInboundOutcomeCount,
  };
}
export default NumericQuestionInput;
