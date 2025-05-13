import { format } from "date-fns";
import { isNil } from "lodash";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";

import Checkbox from "@/components/ui/checkbox";
import DatetimeUtc from "@/components/ui/datetime_utc";
import { FormError, Input } from "@/components/ui/form_field";
import { QuestionDraft, QuestionWithNumericForecasts } from "@/types/question";
import { QuestionType } from "@/types/question";
import { getQuestionDraft } from "@/utils/drafts/questionForm";

const ContinuousPredictionChart = dynamic(
  () =>
    import(
      "@/components/forecast_maker/continuous_input/continuous_prediction_chart"
    ),
  {
    ssr: false,
  }
);

const NumericQuestionInput: React.FC<{
  onChange: ({
    min,
    max,
    open_upper_bound,
    open_lower_bound,
    zero_point,
  }: {
    min: number;
    max: number;
    open_upper_bound: boolean;
    open_lower_bound: boolean;
    zero_point: number | null;
  }) => void;
  questionType: QuestionType.Numeric | QuestionType.Date;
  defaultMin: number | undefined;
  defaultMax: number | undefined;
  defaultOpenUpperBound: boolean | undefined | null;
  defaultOpenLowerBound: boolean | undefined | null;
  defaultZeroPoint: number | undefined | null;
  hasForecasts: boolean;
  control?: UseFormReturn;
  index?: number;
  draftKey?: string;
}> = ({
  onChange,
  questionType,
  defaultMin,
  defaultMax,
  defaultOpenUpperBound,
  defaultOpenLowerBound,
  defaultZeroPoint,
  hasForecasts,
  control,
  index,
  draftKey,
}) => {
  const [errors, setError] = useState<string[]>([]);
  const [max, setMax] = useState(defaultMax);
  const [min, setMin] = useState(defaultMin);
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
  const [question, setQuestion] = useState<QuestionWithNumericForecasts>({
    id: 1,
    title: "",
    description: "",
    created_at: "",
    updated_at: "",
    scheduled_close_time: "",
    scheduled_resolve_time: "",
    possibilities: {},
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
  const shouldUpdateParrent = useRef(false);
  useEffect(() => {
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
        } = getDraftValues(draft, index);
        setMin(isNil(draftMin) ? min : draftMin);
        setMax(isNil(draftMax) ? max : draftMax);
        setOpenLowerBound(
          isNil(draftOpenLowerBound) ? openLowerBound : draftOpenLowerBound
        );
        setOpenUpperBound(
          isNil(draftOpenUpperBound) ? openUpperBound : draftOpenUpperBound
        );
        setZeroPoint(isNil(draftZeroPoint) ? zeroPoint : draftZeroPoint);
      } else {
        onChange({
          min: min as number,
          max: max as number,
          open_lower_bound: openLowerBound,
          open_upper_bound: openUpperBound,
          zero_point: zeroPoint,
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
      min: min as number,
      max: max as number,
      open_lower_bound: openLowerBound,
      open_upper_bound: openUpperBound,
      zero_point: zeroPoint,
    });
    setQuestion((prevQuestion) => ({
      ...prevQuestion,
      open_upper_bound: openUpperBound,
      open_lower_bound: openLowerBound,
      scaling: {
        range_max: max as number,
        range_min: min as number,
        zero_point: zeroPoint,
      },
    }));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, openUpperBound, openLowerBound, zeroPoint]);

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
        {questionType == QuestionType.Numeric && (
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
                  setZeroPoint((Date.now() - 1000 * 60 * 60 * 24 * 365) / 1000);
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
        {errors.length === 0 && !isNil(max) && !isNil(min) && (
          <>
            Example input chart:
            <ContinuousPredictionChart
              key={`${question.scaling.range_min}-${question.scaling.range_max}-${question.scaling.zero_point}`}
              dataset={{
                cdf: [
                  0, 0.0003, 0.0007, 0.0011, 0.0015, 0.0019, 0.0023, 0.0028,
                  0.0033, 0.0038, 0.0043, 0.0049, 0.0054, 0.006, 0.0067, 0.0073,
                  0.008, 0.0087, 0.0095, 0.0103, 0.0111, 0.0119, 0.0128, 0.0138,
                  0.0148, 0.0158, 0.0169, 0.018, 0.0192, 0.0204, 0.0217, 0.0231,
                  0.0245, 0.026, 0.0275, 0.0291, 0.0308, 0.0326, 0.0345, 0.0364,
                  0.0384, 0.0406, 0.0428, 0.0451, 0.0475, 0.05, 0.0527, 0.0554,
                  0.0583, 0.0613, 0.0645, 0.0677, 0.0712, 0.0747, 0.0784,
                  0.0823, 0.0863, 0.0905, 0.0948, 0.0994, 0.1041, 0.109, 0.1141,
                  0.1194, 0.1248, 0.1305, 0.1364, 0.1425, 0.1488, 0.1554,
                  0.1622, 0.1692, 0.1764, 0.1838, 0.1915, 0.1994, 0.2076, 0.216,
                  0.2246, 0.2335, 0.2426, 0.2519, 0.2615, 0.2712, 0.2812,
                  0.2915, 0.3019, 0.3125, 0.3233, 0.3343, 0.3455, 0.3568,
                  0.3683, 0.3799, 0.3917, 0.4036, 0.4156, 0.4277, 0.4399,
                  0.4521, 0.4644, 0.4767, 0.4891, 0.5014, 0.5138, 0.5261,
                  0.5384, 0.5506, 0.5628, 0.5749, 0.5869, 0.5987, 0.6105,
                  0.6222, 0.6337, 0.645, 0.6562, 0.6673, 0.6781, 0.6888, 0.6993,
                  0.7095, 0.7196, 0.7295, 0.7391, 0.7485, 0.7577, 0.7667,
                  0.7754, 0.784, 0.7923, 0.8003, 0.8082, 0.8158, 0.8232, 0.8303,
                  0.8373, 0.844, 0.8505, 0.8568, 0.8629, 0.8688, 0.8745, 0.8799,
                  0.8852, 0.8903, 0.8952, 0.9, 0.9045, 0.9089, 0.9132, 0.9172,
                  0.9211, 0.9249, 0.9285, 0.9319, 0.9353, 0.9385, 0.9415,
                  0.9445, 0.9473, 0.95, 0.9526, 0.9551, 0.9575, 0.9598, 0.9619,
                  0.964, 0.9661, 0.968, 0.9698, 0.9716, 0.9733, 0.9749, 0.9764,
                  0.9779, 0.9793, 0.9807, 0.982, 0.9832, 0.9844, 0.9856, 0.9867,
                  0.9877, 0.9887, 0.9897, 0.9906, 0.9915, 0.9923, 0.9931,
                  0.9939, 0.9946, 0.9953, 0.996, 0.9966, 0.9972, 0.9978, 0.9984,
                  0.9989, 0.9995, 1,
                ],
                pmf: [
                  0, 0.0003, 0.0003, 0.0003, 0.0004, 0.0004, 0.0004, 0.0004,
                  0.0004, 0.0005, 0.0005, 0.0005, 0.0005, 0.0006, 0.0006,
                  0.0006, 0.0006, 0.0007, 0.0007, 0.0007, 0.0008, 0.0008,
                  0.0009, 0.0009, 0.0009, 0.001, 0.001, 0.0011, 0.0011, 0.0012,
                  0.0012, 0.0013, 0.0014, 0.0014, 0.0015, 0.0016, 0.0016,
                  0.0017, 0.0018, 0.0019, 0.002, 0.0021, 0.0022, 0.0023, 0.0024,
                  0.0025, 0.0026, 0.0027, 0.0028, 0.003, 0.0031, 0.0032, 0.0034,
                  0.0035, 0.0037, 0.0038, 0.004, 0.0041, 0.0043, 0.0045, 0.0047,
                  0.0048, 0.005, 0.0052, 0.0054, 0.0056, 0.0058, 0.0061, 0.0063,
                  0.0065, 0.0067, 0.0069, 0.0072, 0.0074, 0.0076, 0.0079,
                  0.0081, 0.0083, 0.0086, 0.0088, 0.009, 0.0093, 0.0095, 0.0097,
                  0.0099, 0.0102, 0.0104, 0.0106, 0.0108, 0.0109, 0.0111,
                  0.0113, 0.0114, 0.0116, 0.0117, 0.0118, 0.0119, 0.012, 0.0121,
                  0.0122, 0.0122, 0.0123, 0.0123, 0.0123, 0.0123, 0.0123,
                  0.0122, 0.0122, 0.0121, 0.012, 0.0119, 0.0118, 0.0117, 0.0116,
                  0.0115, 0.0113, 0.0111, 0.011, 0.0108, 0.0106, 0.0104, 0.0102,
                  0.01, 0.0098, 0.0096, 0.0094, 0.0092, 0.0089, 0.0087, 0.0085,
                  0.0082, 0.008, 0.0078, 0.0076, 0.0073, 0.0071, 0.0069, 0.0067,
                  0.0065, 0.0062, 0.006, 0.0058, 0.0056, 0.0054, 0.0052, 0.005,
                  0.0049, 0.0047, 0.0045, 0.0043, 0.0042, 0.004, 0.0039, 0.0037,
                  0.0036, 0.0034, 0.0033, 0.0031, 0.003, 0.0029, 0.0028, 0.0027,
                  0.0025, 0.0024, 0.0023, 0.0022, 0.0021, 0.002, 0.002, 0.0019,
                  0.0018, 0.0017, 0.0016, 0.0016, 0.0015, 0.0014, 0.0014,
                  0.0013, 0.0012, 0.0012, 0.0011, 0.0011, 0.001, 0.001, 0.0009,
                  0.0009, 0.0009, 0.0008, 0.0008, 0.0008, 0.0007, 0.0007,
                  0.0007, 0.0006, 0.0006, 0.0006, 0.0005, 0.0005, 0.0005,
                  0.0005, 0.0004,
                ],
              }}
              graphType={"pmf"}
              question={question}
              readOnly={false}
              height={100}
              showCP={false}
            />
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

  return {
    draftMin,
    draftMax,
    draftOpenLowerBound,
    draftOpenUpperBound,
    draftZeroPoint,
  };
}
export default NumericQuestionInput;
