import { format } from "date-fns";
import { isNil } from "lodash";
import { useEffect, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";

import Checkbox from "@/components/ui/checkbox";
import DatetimeUtc from "@/components/ui/datetime_utc";
import { FormError, Input } from "@/components/ui/form_field";
import {
  DefaultInboundOutcomeCount,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { QuestionType } from "@/types/question";

import ExampleContinuousInput from "../[id]/components/continuous_input/example_continuous_input";

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
  questionType:
    | QuestionType.Numeric
    | QuestionType.Date
    | QuestionType.Discrete;
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
}) => {
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
    nr_forecasters: 0,
    author_username: "",
    post_id: 0,
    resolution: "",
    include_bots_in_aggregates: false,
    question_weight: 1.0,
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
        current_errors.push(
          "Zero point is not supported for discrete questions"
        );
      } else {
        if ((min ? min : 0) <= zeroPoint && zeroPoint <= (max ? max : 0)) {
          questionType == QuestionType.Numeric
            ? current_errors.push(
                `Zero point (${zeroPoint}) should not be between min (${min}) and max (${max})`
              )
            : current_errors.push(
                `Zero point (${format(new Date(zeroPoint * 1000), "yyyy-MM-dd HH:mm")}) should ` +
                  `not be between min (${format(new Date((min ? min : 0) * 1000), "yyyy-MM-dd HH:mm")}) ` +
                  `and max (${format(new Date((max ? max : 0) * 1000), "yyyy-MM-dd HH:mm")})`
              );
        }
      }
    }
    if (questionType == QuestionType.Discrete) {
      if (!isNil(min) && !isNil(max) && !isNil(step)) {
        if (step > (max - min) / 2) {
          current_errors.push(
            `Step cannot be more than half the range: (${(max - min) / 2})`
          );
        }
        if (step != 0 && step < (max - min) / 200) {
          current_errors.push(
            `Step must be at least 1/200 of the range: (${(max - min) / 200})`
          );
        }
      }
    }
    if (!isNil(min) && !isNil(max)) {
      if (isNaN(min) || isNaN(max)) {
        current_errors.push("Provide correct min and max values");
      }
      if (min >= max) {
        current_errors.push("Minimum value should be less than maximum value");
      }
    }

    setError(current_errors);
    if (current_errors.length > 0) {
      return false;
    }
    return true;
  };
  const isMounted = useRef(false);
  useEffect(() => {
    let mn: number = Math.round(1e10 * (min as number)) / 1e10;
    let mx: number = Math.round(1e10 * (max as number)) / 1e10;
    if (questionType === QuestionType.Discrete) {
      mx = mx - (Math.round(1e10 * (mx - mn)) % (1e10 * step)) / 1e10; // estimate new value
      mx = Math.round(1e10 * (mx + 0.5 * step)) / 1e10;
      mn -= 0.5 * step;
    }
    const inboundOutcomeCount = Math.max(
      3,
      Math.min(200, Math.round((mx - mn) / step))
    );
    if (!isMounted.current) {
      onChange({
        range_min: mn as number,
        range_max: mx as number,
        zero_point: zeroPoint,
        open_lower_bound: openLowerBound,
        open_upper_bound: openUpperBound,
        inbound_outcome_count: inboundOutcomeCount,
      });

      isMounted.current = true;
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
                  Warning: Step does not divide the range evenly. Max reduced to{" "}
                  {Math.round(
                    1e10 * (question.scaling.range_max - 0.5 * step)
                  ) / 1e10}
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
            Example input chart:
            <ExampleContinuousInput question={question} />
          </>
        )}
      </div>
    </div>
  );
};

export default NumericQuestionInput;
