"use client";

import { faAnglesRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Radio, RadioGroup } from "@headlessui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { ForecastExpirationValue } from "@/components/forecast_maker/forecast_expiration";
import RadioButton from "@/components/ui/radio_button";
import { ContinuousForecastInputType } from "@/types/charts";
import { Question, QuestionWithForecasts } from "@/types/question";
import cn from "@/utils/core/cn";

export type ConditionalTableOption = {
  id: number;
  name: string;
  value: number | null;
  isDirty: boolean;
  quantileValue?: number | null;
  forecastInputMode?: ContinuousForecastInputType;
  forecastExpiration?: ForecastExpirationValue;
};

type Props = {
  postTitle: string;
  condition: QuestionWithForecasts;
  conditionChild: QuestionWithForecasts;
  childQuestion: Question;
  value: number | null;
  options: ConditionalTableOption[];
  onChange: (value: number) => void;
  formatForecastValue?: (
    value: number | null,
    forecastInputMode?: ContinuousForecastInputType
  ) => string;
};

const ConditionalForecastTable: FC<Props> = ({
  condition,
  conditionChild,
  options,
  value,
  onChange,
  formatForecastValue,
}) => {
  const t = useTranslations();

  const conditionHref = `/questions/${condition.post_id}`;
  const childHref = `/questions/${conditionChild.post_id}`;

  return (
    <table className="w-full table-fixed border-separate overflow-hidden rounded border border-gray-300 bg-gray-0 dark:border-gray-300-dark dark:bg-gray-0-dark">
      <thead>
        <tr>
          <th className="px-2 py-3 text-left align-top">
            <h4 className="m-0 text-base font-bold leading-5">
              <Link href={conditionHref} className="no-underline">
                {condition.title}
              </Link>
            </h4>
          </th>
          <th className="border-l py-3 pl-4 pr-2 text-left align-top">
            <h4 className="m-0 text-base font-bold leading-5">
              <Link href={childHref} className="no-underline">
                {conditionChild.title}
              </Link>
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
            className={cn(" text-xs uppercase leading-none ", {
              "bg-gray-100 dark:bg-gray-100-dark": option.id !== value,
              "bg-gray-0 dark:bg-gray-0-dark": option.id === value,
              "bg-orange-100 dark:bg-orange-100-dark": option.isDirty,
            })}
          >
            {({ checked, disabled }) => (
              <>
                <td className="border-t py-3 pl-2 pr-4 font-bold">
                  <RadioButton
                    checked={checked}
                    disabled={disabled}
                    size="small"
                  >
                    {option.name}
                  </RadioButton>
                </td>
                <td className="relative border-t py-3 pl-4 pr-2">
                  <FontAwesomeIcon
                    icon={faAnglesRight}
                    className="ConditionalPredictionRow-chevrons absolute -left-1.5"
                  />
                  {t.rich("myPredictionValue", {
                    forecast: (chunks) => (
                      <span className="font-bold text-orange-800 dark:text-orange-800-dark">
                        {chunks}
                      </span>
                    ),
                    forecastValue: formatForecastValue
                      ? formatForecastValue(
                          option.forecastInputMode ===
                            ContinuousForecastInputType.Quantile
                            ? option.quantileValue ?? null
                            : option.value,
                          option.forecastInputMode
                        )
                      : option.value,
                  })}{" "}
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
