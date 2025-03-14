import { Radio, RadioGroup } from "@headlessui/react";
import { useLocale, useTranslations } from "next-intl";
import {
  DetailedHTMLProps,
  FC,
  PropsWithChildren,
  ReactNode,
  ThHTMLAttributes,
  useMemo,
} from "react";

import ResolutionIcon from "@/components/icons/resolution";
import RadioButton from "@/components/ui/radio_button";
import { QuestionStatus, Resolution } from "@/types/post";
import {
  DistributionSliderComponent,
  Quartiles,
  Question,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getDisplayValue } from "@/utils/charts";
import cn from "@/utils/cn";
import { formatResolution } from "@/utils/questions";

export type ConditionalTableOption = {
  id: number;
  name: string;
  question: QuestionWithNumericForecasts;
  userForecast: DistributionSliderComponent[] | null;
  userQuartiles: Quartiles | null;
  communityQuartiles: Quartiles | null;
  isDirty: boolean;
  resolution: Resolution | null;
  menu?: ReactNode;
};

type Props = {
  value: number | null;
  groupVariable: string;
  options: ConditionalTableOption[];
  onChange: (id: number) => void;
  questions: QuestionWithNumericForecasts[];
  showCP?: boolean;
};

const GroupForecastTable: FC<Props> = ({
  options,
  value,
  onChange,
  questions,
  groupVariable,
  showCP = true,
}) => {
  const t = useTranslations();
  const locale = useLocale();

  const { resolvedOptions, pendingOptions } = useMemo(
    () => ({
      resolvedOptions: options.filter(
        (option) =>
          option.question.status &&
          [QuestionStatus.CLOSED, QuestionStatus.RESOLVED].includes(
            option.question.status
          )
      ),
      pendingOptions: options.filter(
        (option) =>
          !option.question.status ||
          ![QuestionStatus.CLOSED, QuestionStatus.RESOLVED].includes(
            option.question.status
          )
      ),
    }),
    [options]
  );

  return (
    <table className="max-h-[300px] w-full table-fixed border-separate overflow-auto border border-gray-400 dark:border-gray-400-dark">
      {!!resolvedOptions.length && (
        <thead>
          <tr className="h-4">
            <Th className="border-b border-r">{groupVariable}</Th>
            <Th className="border-b" colSpan={3}>
              {t("resolution")}
            </Th>
          </tr>
        </thead>
      )}
      <RadioGroup value={value} onChange={onChange} as="tbody">
        {resolvedOptions.map((option) => (
          <Radio
            as="tr"
            key={option.id}
            value={option.id}
            className={cn("h-8 cursor-pointer", {
              "bg-gray-100 dark:bg-gray-100-dark": option.id !== value,
              "bg-gray-0 dark:bg-gray-0-dark": option.id === value,
            })}
          >
            {({ checked, disabled }) => (
              <>
                <Td className="border-b border-r px-5">
                  <RadioButton
                    checked={checked}
                    disabled={disabled}
                    size="small"
                  >
                    {option.name}
                  </RadioButton>
                </Td>
                <Td className="border-b" colSpan={3}>
                  <div className="flex">
                    <div className="flex w-full items-center justify-center">
                      <ResolutionIcon />
                      <span
                        className="text-purple-800 dark:text-purple-800-dark"
                        suppressHydrationWarning
                      >
                        {formatResolution(
                          option.resolution,
                          option.question.type,
                          locale,
                          option.question.unit
                        )}
                      </span>
                    </div>
                    <div>{option.menu}</div>
                  </div>
                </Td>
              </>
            )}
          </Radio>
        ))}
      </RadioGroup>
      {!!pendingOptions.length && (
        <tbody>
          <tr className="h-4 cursor-pointer bg-gray-100 dark:bg-gray-1000-dark">
            <Th className="border-b border-r">{groupVariable}</Th>
            <Th className="border-b border-r">
              {t("questionGroupTableFirstQuartileLabel")}
            </Th>
            <Th className="border-b border-r">
              {t("questionGroupTableSecondQuartileLabel")}
            </Th>
            <Th className="border-b">
              {t("questionGroupTableThirdQuartileLabel")}
            </Th>
          </tr>
        </tbody>
      )}

      <RadioGroup value={value} onChange={onChange} as="tbody">
        {pendingOptions.map((option, optionIdx) => (
          <Radio
            as="tr"
            key={option.id}
            value={option.id}
            className={cn("h-8 cursor-pointer", {
              "bg-gray-100 dark:bg-gray-100-dark": option.id !== value,
              "bg-gray-0 dark:bg-gray-0-dark": option.id === value,
            })}
          >
            {({ checked, disabled }) => (
              <>
                <Td
                  className={cn("border-r px-5", {
                    "border-b": optionIdx !== pendingOptions.length - 1,
                  })}
                >
                  <RadioButton
                    checked={checked}
                    disabled={disabled}
                    size="small"
                  >
                    {option.name}
                  </RadioButton>
                </Td>
                <Td
                  className={cn("border-r", {
                    "border-b": optionIdx !== pendingOptions.length - 1,
                  })}
                >
                  <PredictionCell
                    communityValue={getDisplayValue({
                      value: showCP
                        ? option.communityQuartiles?.lower25
                        : undefined,
                      questionType: (
                        questions.find(
                          (question) => question.id === option.id
                        ) as Question
                      ).type,
                      scaling: (
                        questions.find(
                          (question) => question.id === option.id
                        ) as Question
                      ).scaling,
                    })}
                    userValue={getDisplayValue({
                      value: option.userQuartiles?.lower25,
                      questionType: (
                        questions.find(
                          (question) => question.id === option.id
                        ) as Question
                      ).type,
                      scaling: (
                        questions.find(
                          (question) => question.id === option.id
                        ) as Question
                      ).scaling,
                    })}
                    isDirty={option.isDirty}
                  />
                </Td>
                <Td
                  className={cn("border-r", {
                    "border-b": optionIdx !== pendingOptions.length - 1,
                  })}
                >
                  <PredictionCell
                    communityValue={getDisplayValue({
                      value: showCP
                        ? option.communityQuartiles?.median
                        : undefined,
                      questionType: (
                        questions.find(
                          (question) => question.id === option.id
                        ) as Question
                      ).type,
                      scaling: (
                        questions.find(
                          (question) => question.id === option.id
                        ) as Question
                      ).scaling,
                    })}
                    userValue={getDisplayValue({
                      value: option.userQuartiles?.median,
                      questionType: (
                        questions.find(
                          (question) => question.id === option.id
                        ) as Question
                      ).type,
                      scaling: (
                        questions.find(
                          (question) => question.id === option.id
                        ) as Question
                      ).scaling,
                    })}
                    isDirty={option.isDirty}
                  />
                </Td>
                <Td
                  className={cn({
                    "border-b": optionIdx !== pendingOptions.length - 1,
                  })}
                >
                  <div className="flex">
                    <div className="w-full">
                      <PredictionCell
                        communityValue={getDisplayValue({
                          value: showCP
                            ? option.communityQuartiles?.upper75
                            : undefined,
                          questionType: (
                            questions.find(
                              (question) => question.id === option.id
                            ) as Question
                          ).type,
                          scaling: (
                            questions.find(
                              (question) => question.id === option.id
                            ) as Question
                          ).scaling,
                        })}
                        userValue={getDisplayValue({
                          value: option.userQuartiles?.upper75,
                          questionType: (
                            questions.find(
                              (question) => question.id === option.id
                            ) as Question
                          ).type,
                          scaling: (
                            questions.find(
                              (question) => question.id === option.id
                            ) as Question
                          ).scaling,
                        })}
                        isDirty={option.isDirty}
                      />
                    </div>
                    <div>{option.menu}</div>
                  </div>
                </Td>
              </>
            )}
          </Radio>
        ))}
      </RadioGroup>
    </table>
  );
};

const PredictionCell: FC<{
  communityValue: number | string;
  isDirty: boolean;
  userValue?: number | string;
}> = ({ communityValue, isDirty, userValue }) => (
  <div className="grid grid-rows-2">
    <div className="flex justify-center whitespace-nowrap text-olive-700 dark:text-olive-700-dark">
      {communityValue}
    </div>
    <div
      className={cn(
        "flex justify-center text-orange-800 dark:text-orange-800-dark",
        {
          "bg-orange-100 font-semibold dark:bg-orange-100-dark": isDirty,
        }
      )}
    >
      {userValue ?? "—"}
    </div>
  </div>
);

const Th: FC<
  PropsWithChildren<
    DetailedHTMLProps<
      ThHTMLAttributes<HTMLTableCellElement>,
      HTMLTableCellElement
    >
  >
> = ({ className, children, ...props }) => (
  <th
    className={cn(
      "border-gray-400 bg-gray-200 text-xs font-semibold dark:border-gray-400-dark dark:bg-gray-200-dark",
      className
    )}
    {...props}
  >
    {children}
  </th>
);

const Td: FC<
  PropsWithChildren<
    DetailedHTMLProps<
      ThHTMLAttributes<HTMLTableCellElement>,
      HTMLTableCellElement
    >
  >
> = ({ className, children, ...props }) => (
  <td
    className={cn(
      "border-gray-400 p-0 text-left text-xs dark:border-gray-400-dark",
      className
    )}
    {...props}
  >
    {children}
  </td>
);

export default GroupForecastTable;
