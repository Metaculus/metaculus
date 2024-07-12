import { format } from "date-fns";
import { set } from "lodash";
import { useEffect, useState } from "react";

import Checkbox from "@/components/ui/checkbox";
import { Input } from "@/components/ui/form_field";
import { QuestionType } from "@/types/question";

const NumericQuestionInput: React.FC<{
  onChange: (
    min: number,
    max: number,
    open_upper_bound: boolean,
    open_lower_bound: boolean,
    zero_point: number
  ) => void;
  questionType: QuestionType.Numeric | QuestionType.Date;
  defaultMin: number | undefined;
  defaultMax: number | undefined;
  defaultOpenUpperBound: boolean | undefined | null;
  defaultOpenLowerBound: boolean | undefined | null;
  defaultZeroPoint: number | undefined | null;
  isLive: boolean;
  canSeeLogarithmic: boolean | undefined;
}> = ({
  onChange,
  questionType,
  defaultMin,
  defaultMax,
  defaultOpenUpperBound,
  defaultOpenLowerBound,
  defaultZeroPoint,
  isLive,
  canSeeLogarithmic,
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
    defaultZeroPoint === undefined || defaultZeroPoint === null
      ? 0
      : defaultZeroPoint
  );

  const runChecks = () => {
    const current_errors = [];
    if (max === undefined) {
      current_errors.push("Max is required");
    }
    if (min === undefined) {
      current_errors.push("Min is required");
    }

    if (zeroPoint !== undefined && min !== undefined) {
      if (zeroPoint != 0) {
        if (min < zeroPoint) {
          current_errors.push(
            `Minimum value (${min}) should be greater than zero point (${zeroPoint})`
          );
        }
      }
    }
    console.log(min, max);
    if (min !== undefined && max !== undefined) {
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

  useEffect(() => {
    const ok = runChecks();
    if (!ok) {
      return;
    }
    onChange(
      min as number,
      max as number,
      openUpperBound,
      openLowerBound,
      zeroPoint
    );
  }, [min, max, openUpperBound, openLowerBound, zeroPoint]);

  return (
    <div>
      {errors.length > 0 && (
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
              <span className="mr-2">Max</span>
              <Input
                readOnly={isLive}
                type="number"
                onChange={(e) => {
                  e.preventDefault();
                  setMax(Number(e.target.value));
                }}
                defaultValue={max}
              />
            </div>
            <div>
              <span className="mr-2">Min</span>
              <Input
                readOnly={isLive}
                type="number"
                defaultValue={min}
                onChange={(e) => {
                  e.preventDefault();
                  setMin(Number(e.target.value));
                }}
              />
            </div>
          </>
        )}
        {questionType == QuestionType.Date && (
          <>
            <div className="flex w-full flex-col gap-4 md:flex-row">
              <div className="flex w-full flex-col gap-2">
                <span className="mr-2">Max</span>
                <Input
                  readOnly={isLive}
                  type="date"
                  defaultValue={
                    max !== undefined
                      ? format(new Date(max * 1000), "yyyy-MM-dd")
                      : undefined
                  }
                  onChange={(e) => {
                    e.preventDefault();
                    setMax(new Date(e.target.value).getTime() / 1000);
                  }}
                />
              </div>
              <div className="flex w-full flex-col gap-2">
                <span className="mr-2">Min</span>
                <Input
                  readOnly={isLive}
                  type="date"
                  defaultValue={
                    min !== undefined
                      ? format(new Date(min * 1000), "yyyy-MM-dd")
                      : undefined
                  }
                  onChange={(e) => {
                    e.preventDefault();
                    setMin(new Date(e.target.value).getTime() / 1000);
                  }}
                />
              </div>
            </div>
          </>
        )}
        {(questionType == QuestionType.Numeric ||
          questionType == QuestionType.Date) && (
          <>
            <div className="flex w-full flex-col gap-4 md:mt-[-8px] md:flex-row">
              <div className="flex w-full flex-col gap-2">
                <Checkbox
                  label={"Open Upper Bound"}
                  readOnly={isLive}
                  onChange={async (e) => {
                    setOpenUpperBound(e);
                  }}
                  defaultChecked={openUpperBound}
                />
              </div>
              <div className="flex w-full flex-col gap-2">
                <Checkbox
                  label={"Open Lower Bound"}
                  readOnly={isLive}
                  onChange={(e) => {
                    setOpenLowerBound(e);
                  }}
                  defaultChecked={openLowerBound}
                />
              </div>
            </div>
          </>
        )}
        {canSeeLogarithmic && (
          <div>
            <span className="mr-2">Is Logarithmic ?</span>
            <Input
              disabled={isLive}
              type="checkbox"
              onChange={(e) => {
                setZeroPoint(2.8);
              }}
              checked={zeroPoint != 0}
            />
            {zeroPoint != 0 && (
              <div className="ml-2">
                <span className="mr-2">Zero Point</span>
                <Input
                  readOnly={isLive}
                  type="number"
                  onChange={(e) => {
                    setZeroPoint(Number(e.target.value));
                  }}
                  defaultValue={zeroPoint}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NumericQuestionInput;
