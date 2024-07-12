import { format } from "date-fns";
import { set } from "lodash";
import { useState } from "react";

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
  defaultMin: number;
  defaultMax: number;
  defaultOpenUpperBound: boolean;
  defaultOpenLowerBound: boolean;
  defaultZeroPoint: number;
  isLive: boolean;
  can_see_logarithmic: () => boolean;
}> = ({
  onChange,
  questionType,
  defaultMin,
  defaultMax,
  defaultOpenUpperBound,
  defaultOpenLowerBound,
  defaultZeroPoint,
  isLive,
  can_see_logarithmic,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [max, setMax] = useState(defaultMax);
  const [min, setMin] = useState(defaultMin);
  const [openUpperBound, setOpenUpperBound] = useState(defaultOpenUpperBound);
  const [openLowerBound, setOpenLowerBound] = useState(defaultOpenLowerBound);
  const [zeroPoint, setZeroPoint] = useState(defaultZeroPoint);
  const [logScaleEnabled, setLogScaleEnabled] = useState<boolean>(
    can_see_logarithmic()
  );

  return (
    <div>
      {error && (
        <div className="rounded-md bg-red-400 px-2 py-1 text-white">
          {error}
        </div>
      )}
      {questionType == "numeric" && (
        <>
          <div>
            <span>Max</span>
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
            <span>Min</span>
            <Input readOnly={isLive} type="number" defaultValue={min} />
          </div>
        </>
      )}
      {questionType == "date" && (
        <>
          <div className="flex w-full flex-col gap-4 md:flex-row">
            <div className="flex w-full flex-col gap-2">
              <span>Max</span>
              <Input
                readOnly={isLive}
                type="date"
                defaultValue={format(new Date(max * 1000), "yyyy-MM-dd")}
              />
            </div>
            <div className="flex w-full flex-col gap-2">
              <span>Min</span>
              <Input
                readOnly={isLive}
                type="date"
                defaultValue={format(new Date(min * 1000), "yyyy-MM-dd")}
              />
            </div>
          </div>
        </>
      )}
      {(questionType == "numeric" || questionType == "date") && (
        <>
          <div className="flex w-full flex-col gap-4 md:mt-[-8px] md:flex-row">
            <div className="flex w-full flex-col gap-2">
              <Checkbox
                label={"Open Upper Bound"}
                readOnly={isLive}
                onChange={async (e) => {
                  setOpenUpperBound(e);
                }}
                // @ts-ignore
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
                // @ts-ignore
                defaultChecked={openLowerBound}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
