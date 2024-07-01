"use client";
import { faAnglesRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Radio, RadioGroup } from "@headlessui/react";
import classNames from "classnames";
import { FC } from "react";

import RadioButton from "@/components/ui/radio_button";
import { Question, QuestionWithForecasts } from "@/types/question";

export type ConditionalTableOption = {
  id: number;
  name: string;
  value: number | null;
  isDirty: boolean;
};

type Props = {
  condition: QuestionWithForecasts;
  childQuestion: Question;
  value: number | null;
  options: ConditionalTableOption[];
  onChange: (value: number) => void;
  formatForecastValue?: (value: number | null) => string;
};

const ConditionalForecastTable: FC<Props> = ({
  condition,
  childQuestion,
  options,
  value,
  onChange,
  formatForecastValue,
}) => {
  return (
    <table className="w-full table-fixed border-separate overflow-hidden rounded border border-gray-300 bg-gray-0 dark:border-gray-300-dark dark:bg-gray-0-dark">
      <thead>
        <tr>
          <th className="px-2 py-3 text-left align-top">
            <h4 className="m-0 text-base font-bold leading-5">
              {condition.title}
            </h4>
          </th>
          <th className="border-l py-3 pl-4 pr-2 text-left align-top">
            <h4 className="m-0 text-base font-bold leading-5">
              {childQuestion.title}
            </h4>
          </th>
        </tr>
      </thead>
      <RadioGroup value={value} as="tbody" onChange={onChange}>
        {options.map((option) => (
          <Radio
            as="tr"
            key={option.id}
            value={option.id}
            className={classNames(" text-xs uppercase leading-none ", {
              "bg-gray-100 dark:bg-gray-100-dark": option.id !== value,
              "bg-gray-0 dark:bg-gray-0-dark": option.id === value,
              "bg-orange-100 dark:bg-orange-100-dark": option.isDirty,
            })}
          >
            {({ checked, disabled }) => (
              <>
                <td className="border-t px-2 py-3 pr-4">
                  <RadioButton
                    checked={checked}
                    disabled={disabled}
                    size="small"
                  >
                    <span>
                      If <strong>{option.name}</strong>
                    </span>
                  </RadioButton>
                </td>
                <td className="relative border-t py-3 pl-4 pr-2">
                  <FontAwesomeIcon
                    icon={faAnglesRight}
                    className="ConditionalPredictionRow-chevrons absolute -left-1.5"
                  />
                  My prediction{" "}
                  <strong>
                    <span className="text-orange-800 dark:text-orange-800-dark">
                      {formatForecastValue
                        ? formatForecastValue(option.value)
                        : option.value}
                    </span>
                  </strong>
                </td>
              </>
            )}
          </Radio>
        ))}
      </RadioGroup>
    </table>
  );
};

export default ConditionalForecastTable;
