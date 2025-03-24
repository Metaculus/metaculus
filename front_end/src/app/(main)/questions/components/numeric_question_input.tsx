import { format } from "date-fns";
import { isNil } from "lodash";
import dynamic from "next/dynamic";
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
import { cdfFromSliders, cdfToPmf } from "@/utils/math";

const ContinuousPredictionChart = dynamic(
  () =>
    import(
      "../[id]/components/forecast_maker/continuous_input/continuous_prediction_chart"
    ),
  {
    ssr: false,
  }
);

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
  chartWidth?: number;
  control?: UseFormReturn;
  index?: number;
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
  chartWidth = 800,
  control,
  index,
}) => {
  const [errors, setError] = useState<string[]>([]);
  const [max, setMax] = useState(defaultMax);
  const [min, setMin] = useState(defaultMin);
  const [openUpperBound, setOpenUpperBound] = useState(
    defaultOpenUpperBound === undefined || defaultOpenUpperBound === null
      ? false
      : defaultOpenUpperBound
  );
  const [openLowerBound, setOpenLowerBound] = useState(
    defaultOpenLowerBound === undefined || defaultOpenLowerBound === null
      ? false
      : defaultOpenLowerBound
  );
  const [zeroPoint, setZeroPoint] = useState(
    defaultZeroPoint === undefined ||
      defaultZeroPoint === null ||
      Number.isNaN(defaultZeroPoint)
      ? null
      : defaultZeroPoint
  );
  const [inboundOutcomeCount, setInboundOutcomeCount] = useState(
    defaultInboundOutcomeCount || DefaultInboundOutcomeCount
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
    unit: "",
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
    inbound_outcome_count: inboundOutcomeCount,
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
      if ((min ? min : 0) <= zeroPoint && zeroPoint <= (max ? max : 0)) {
        questionType == QuestionType.Numeric
          ? current_errors.push(
              `Zero point (${zeroPoint}) should not be between min (${min}) and max (${max})`
            )
          : current_errors.push(
              `Zero point (${format(new Date(zeroPoint * 1000), "yyyy-MM-dd HH:mm")}) should not be between min (${format(new Date((min ? min : 0) * 1000), "yyyy-MM-dd HH:mm")}) and max (${format(new Date((max ? max : 0) * 1000), "yyyy-MM-dd HH:mm")})`
            );
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
    let mn: number = min as number;
    let mx: number = max as number;
    if (questionType === QuestionType.Discrete && inboundOutcomeCount > 1) {
      mn =
        Math.round(
          1e7 *
            ((min as number) -
              (0.5 * ((max as number) - (min as number))) /
                (inboundOutcomeCount - 1))
        ) / 1e7;
      mx =
        Math.round(
          1e7 *
            ((max as number) +
              (0.5 * ((max as number) - (min as number))) /
                (inboundOutcomeCount - 1))
        ) / 1e7;
    }
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
  }, [
    min,
    max,
    openUpperBound,
    openLowerBound,
    zeroPoint,
    inboundOutcomeCount,
  ]);

  const exampleCdf = cdfFromSliders(
    0.4,
    0.6,
    0.67,
    openLowerBound,
    openUpperBound,
    inboundOutcomeCount
  );

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
                type="float"
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
                type="float"
                onChange={(e) => {
                  e.preventDefault();
                  setMax(Number(e.target.value));
                }}
                defaultValue={max}
              />
            </div>
          </>
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
                    type="float"
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
        {questionType === QuestionType.Discrete && (
          <div className="ml-2">
            <span className="mr-2">Inbound Outcome Count</span>
            <Input
              readOnly={hasForecasts}
              disabled={hasForecasts}
              type="number"
              min={1}
              max={9999}
              value={inboundOutcomeCount}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value >= 1 && value <= 9999) {
                  setInboundOutcomeCount(value);
                }
              }}
            />
            {inboundOutcomeCount &&
              !isNil(question.scaling.range_max) &&
              !isNil(question.scaling.range_min) && (
                <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-500-dark">
                  Note: outcome bins have size{" "}
                  {Math.round(
                    ((question.scaling.range_max - question.scaling.range_min) /
                      inboundOutcomeCount) *
                      1000
                  ) / 1000}
                </span>
              )}
            <br />
          </div>
        )}
        {errors.length === 0 && !isNil(max) && !isNil(min) && (
          <>
            Example input chart:
            <ContinuousPredictionChart
              key={`${question.scaling.range_min}-${question.scaling.range_max}-${question.scaling.zero_point}`}
              dataset={{
                cdf: exampleCdf,
                pmf: cdfToPmf(exampleCdf),
              }}
              graphType={"pmf"}
              question={question}
              readOnly={false}
              height={100}
              width={chartWidth}
              showCP={false}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default NumericQuestionInput;
