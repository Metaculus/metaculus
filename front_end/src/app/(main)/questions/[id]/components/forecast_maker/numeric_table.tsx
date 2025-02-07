import { useTranslations } from "next-intl";
import React, {
  DetailedHTMLProps,
  FC,
  TdHTMLAttributes,
  useCallback,
  useEffect,
  useState,
} from "react";

import { FormErrorMessage } from "@/components/ui/form_field";
import { ForecastInputType } from "@/types/charts";
import {
  Bounds,
  DistributionQuantileComponent,
  DistributionQuantileComponentWithState,
  DistributionQuantileValue,
  Quartiles,
  QuestionType,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { displayValue, getTableDisplayValue } from "@/utils/charts";
import cn from "@/utils/cn";

import { validateQuantileInput } from "./helpers";
import NumericTableInput from "./numeric_table_input";

type Props = {
  question: QuestionWithNumericForecasts;
  userBounds?: Bounds;
  userQuartiles?: Quartiles;
  userPreviousBounds?: Bounds;
  userPreviousQuartiles?: Quartiles;
  communityBounds?: Bounds;
  communityQuartiles?: Quartiles;
  withUserQuartiles?: boolean;
  withCommunityQuartiles?: boolean;
  hasUserForecast?: boolean;
  isDirty?: boolean;
  forecastInputMode?: ForecastInputType;
  quantileComponents?: DistributionQuantileComponentWithState[];
  onQuantileChange?: React.Dispatch<
    React.SetStateAction<DistributionQuantileComponentWithState[]>
  >;
};

const NumericForecastTable: FC<Props> = ({
  question,
  userBounds,
  userQuartiles,
  userPreviousBounds,
  userPreviousQuartiles,
  withUserQuartiles = true,
  communityBounds,
  communityQuartiles,
  withCommunityQuartiles = true,
  hasUserForecast,
  isDirty,
  forecastInputMode = "slider",
  quantileComponents,
  onQuantileChange,
}) => {
  const t = useTranslations();
  const quantilesToValidate = [
    question.open_lower_bound ? "p0" : undefined,
    "q1",
    "q2",
    "q3",
    question.open_upper_bound ? "p4" : undefined,
  ].filter(
    (quantile) => quantile !== undefined
  ) as (keyof DistributionQuantileComponent)[];
  // initial state is a safety measure to avoid errors when we already have slider forecast
  // and we switch to quantile forecast with transformed values
  const [errors, setErrors] = useState<
    {
      quantile: keyof DistributionQuantileComponent;
      message?: string;
    }[]
  >(
    quantileComponents
      ? quantilesToValidate
          .map((quantileKey) => {
            return {
              quantile: quantileKey,
              message: validateQuantileInput({
                question,
                components: quantileComponents,
                newValue: quantileComponents[0]?.[quantileKey]?.value,
                quantile: quantileKey,
                t,
              }),
            };
          })
          .filter((error) => error.message !== undefined)
      : []
  );

  useEffect(() => {
    // clear errors on discard click
    if (
      Object.values(quantileComponents?.[0] ?? {}).every(
        (value) => !value?.isDirty
      )
    ) {
      setErrors([]);
    }
    // revalidate when we make a new forecast with slider and tranform it to quantile data
    if (
      forecastInputMode === ForecastInputType.Slider &&
      quantileComponents &&
      Object.values(quantileComponents?.[0] ?? {}).every(
        (value) => value?.isDirty
      )
    ) {
      setErrors(
        quantilesToValidate
          .map((quantileKey) => {
            return {
              quantile: quantileKey,
              message: validateQuantileInput({
                question,
                components: quantileComponents,
                newValue: quantileComponents[0]?.[quantileKey]?.value,
                quantile: quantileKey,
                t,
              }),
            };
          })
          .filter((error) => error.message !== undefined)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantileComponents]);

  const handleQuantileChange = useCallback(
    (
      quantile: keyof DistributionQuantileComponent,
      newValue: DistributionQuantileValue
    ) => {
      if (!quantileComponents || !onQuantileChange) return;
      setErrors([]);
      onQuantileChange((prev) => [
        {
          ...prev[0],
          [quantile]: {
            value: newValue.value,
            isDirty: newValue.isDirty,
          },
        } as DistributionQuantileComponentWithState,
      ]);
      const localQuantileComponents = [
        {
          ...quantileComponents[0],
          [quantile]: {
            value: newValue?.value,
            isDirty: newValue?.isDirty,
          },
        } as DistributionQuantileComponentWithState,
      ];

      const errors = quantilesToValidate
        .map((quantileKey) => {
          return {
            quantile: quantileKey,
            message: validateQuantileInput({
              question,
              components: localQuantileComponents,
              newValue:
                quantileKey === quantile
                  ? newValue?.value
                  : localQuantileComponents[0]?.[quantileKey]?.value,
              quantile: quantileKey,
              t,
            }),
          };
        })
        .filter((error) => error.message !== undefined);
      if (errors) {
        setErrors(errors);
      }
    },
    [quantileComponents, onQuantileChange, question, quantilesToValidate, t]
  );

  return (
    <>
      <table className="mb-4 hidden w-full table-fixed border-separate border-spacing-1 sm:table">
        <thead>
          <tr className="text-xs font-bold text-blue-700 dark:text-blue-800-dark">
            {(withUserQuartiles || withCommunityQuartiles) && (
              <>
                <Td></Td>
                {question.open_lower_bound && (
                  <Td className="rounded bg-blue-400/60 p-1 dark:bg-blue-600/20 ">
                    {"<"}
                    {getTableDisplayValue({
                      value: 0,
                      questionType: question.type,
                      scaling: question.scaling,
                      precision: 4,
                    })}
                  </Td>
                )}
                <Td className="rounded bg-blue-400/60 p-1 dark:bg-blue-600/20">
                  {t("firstQuartile")}
                </Td>
                <Td className="rounded bg-blue-400/60 p-1 dark:bg-blue-600/20">
                  {t("secondQuartile")}
                </Td>
                <Td className="rounded bg-blue-400/60 p-1 dark:bg-blue-600/20">
                  {t("thirdQuartile")}
                </Td>
                {question.open_upper_bound && (
                  <Td className="rounded bg-blue-400/60 p-1 dark:bg-blue-600/20">
                    {">"}
                    {getTableDisplayValue({
                      value: 1,
                      questionType: question.type,
                      scaling: question.scaling,
                      precision: 4,
                    })}
                  </Td>
                )}
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {withCommunityQuartiles && (
            <tr className="text-olive-800 dark:text-olive-800-dark">
              <Td className="capitalize">{t("community")}</Td>

              {question.open_lower_bound && (
                <Td>
                  {communityBounds
                    ? (communityBounds.belowLower * 100).toFixed(1) + "%"
                    : "—"}
                </Td>
              )}
              <Td className="tabular-nums tracking-tight">
                {checkQuartilesOutOfBorders(communityQuartiles?.lower25)}
                {getTableDisplayValue({
                  value: communityQuartiles?.lower25,
                  questionType: question.type,
                  scaling: question.scaling,
                  precision: 4,
                })}
              </Td>
              <Td className="tabular-nums tracking-tight">
                {checkQuartilesOutOfBorders(communityQuartiles?.median)}
                {getTableDisplayValue({
                  value: communityQuartiles?.median,
                  questionType: question.type,
                  scaling: question.scaling,
                  precision: 4,
                })}
              </Td>
              <Td className="tabular-nums tracking-tight">
                {checkQuartilesOutOfBorders(communityQuartiles?.upper75)}
                {getTableDisplayValue({
                  value: communityQuartiles?.upper75,
                  questionType: question.type,
                  scaling: question.scaling,
                  precision: 4,
                })}
              </Td>
              {question.open_upper_bound && (
                <Td>
                  {communityBounds
                    ? (communityBounds.aboveUpper * 100).toFixed(1) + "%"
                    : "—"}
                </Td>
              )}
            </tr>
          )}
          {withUserQuartiles && forecastInputMode === "slider" && (
            <tr className="text-orange-800 dark:text-orange-800-dark">
              <Td>{t("myPrediction")}</Td>
              {isDirty || hasUserForecast ? (
                <>
                  {question.open_lower_bound && (
                    <Td>
                      {userBounds && (userBounds.belowLower * 100).toFixed(1)}%
                    </Td>
                  )}
                  <Td className="tabular-nums tracking-tight">
                    {checkQuartilesOutOfBorders(userQuartiles?.lower25)}
                    {getTableDisplayValue({
                      value: userQuartiles?.lower25,
                      questionType: question.type,
                      scaling: question.scaling,
                      precision: 4,
                    })}
                  </Td>
                  <Td className="tabular-nums tracking-tight">
                    {checkQuartilesOutOfBorders(userQuartiles?.median)}
                    {getTableDisplayValue({
                      value: userQuartiles?.median,
                      questionType: question.type,
                      scaling: question.scaling,
                      precision: 4,
                    })}
                  </Td>
                  <Td className="tabular-nums tracking-tight">
                    {checkQuartilesOutOfBorders(userQuartiles?.upper75)}
                    {getTableDisplayValue({
                      value: userQuartiles?.upper75,
                      questionType: question.type,
                      scaling: question.scaling,
                      precision: 4,
                    })}
                  </Td>
                  {question.open_upper_bound && userBounds && (
                    <Td>{(userBounds.aboveUpper * 100).toFixed(1)}%</Td>
                  )}
                </>
              ) : (
                <>
                  {question.open_lower_bound && <Td>—</Td>}
                  {[...Array(3)].map((_, i) => {
                    return <Td key={i}>—</Td>;
                  })}
                  {question.open_upper_bound && <Td>—</Td>}
                </>
              )}
            </tr>
          )}

          {withUserQuartiles &&
            forecastInputMode === ForecastInputType.Quantile && (
              <>
                <tr className="text-orange-800 dark:text-orange-800-dark">
                  <Td>
                    <p className="mx-auto my-0 h-8 w-20 whitespace-pre-line text-center leading-4">
                      {t("myPrediction")}
                    </p>
                  </Td>
                  <>
                    {question.open_lower_bound && (
                      <Td>
                        <NumericTableInput
                          type="number"
                          quantileValue={quantileComponents?.[0]?.p0}
                          error={
                            errors.find((e) => e.quantile === "p0")?.message
                          }
                          onQuantileChange={(
                            quantileValue: DistributionQuantileValue
                          ) => {
                            handleQuantileChange("p0", quantileValue);
                          }}
                        />
                      </Td>
                    )}
                    <Td>
                      <NumericTableInput
                        type={
                          question.type === QuestionType.Numeric
                            ? "number"
                            : "date"
                        }
                        quantileValue={quantileComponents?.[0]?.q1}
                        error={errors.find((e) => e.quantile === "q1")?.message}
                        onQuantileChange={(
                          quantileValue: DistributionQuantileValue
                        ) => {
                          handleQuantileChange("q1", quantileValue);
                        }}
                      />
                    </Td>
                    <Td>
                      <NumericTableInput
                        type={
                          question.type === QuestionType.Numeric
                            ? "number"
                            : "date"
                        }
                        quantileValue={quantileComponents?.[0]?.q2}
                        error={errors.find((e) => e.quantile === "q2")?.message}
                        onQuantileChange={(
                          quantileValue: DistributionQuantileValue
                        ) => {
                          handleQuantileChange("q2", quantileValue);
                        }}
                      />
                    </Td>
                    <Td>
                      <NumericTableInput
                        type={
                          question.type === QuestionType.Numeric
                            ? "number"
                            : "date"
                        }
                        quantileValue={quantileComponents?.[0]?.q3}
                        error={errors.find((e) => e.quantile === "q3")?.message}
                        onQuantileChange={(
                          quantileValue: DistributionQuantileValue
                        ) => {
                          handleQuantileChange("q3", quantileValue);
                        }}
                      />
                    </Td>
                    {question.open_upper_bound && (
                      <Td>
                        <NumericTableInput
                          type="number"
                          quantileValue={quantileComponents?.[0]?.p4}
                          error={
                            errors.find((e) => e.quantile === "p4")?.message
                          }
                          onQuantileChange={(
                            quantileValue: DistributionQuantileValue
                          ) => {
                            handleQuantileChange("p4", quantileValue);
                          }}
                        />
                      </Td>
                    )}
                  </>
                </tr>
                <tr>
                  <Td
                    colSpan={
                      4 +
                      (question.open_lower_bound ? 1 : 0) +
                      (question.open_upper_bound ? 1 : 0)
                    }
                  >
                    <FormErrorMessage errors={errors.map((e) => e.message)} />
                  </Td>
                </tr>
              </>
            )}

          {withUserQuartiles && userPreviousQuartiles && (
            <tr className="text-orange-800 dark:text-orange-800-dark">
              <Td>{t("myPredictionPrevious")}</Td>
              <>
                {question.open_lower_bound && (
                  <Td>
                    {userPreviousBounds &&
                      (userPreviousBounds.belowLower * 100).toFixed(1)}
                    %
                  </Td>
                )}
                <Td className="tabular-nums tracking-tight">
                  {checkQuartilesOutOfBorders(userPreviousQuartiles?.lower25)}
                  {getTableDisplayValue({
                    value: userPreviousQuartiles?.lower25,
                    questionType: question.type,
                    scaling: question.scaling,
                    precision: 4,
                  })}
                </Td>
                <Td className="tabular-nums tracking-tight">
                  {checkQuartilesOutOfBorders(userPreviousQuartiles?.median)}
                  {getTableDisplayValue({
                    value: userPreviousQuartiles?.median,
                    questionType: question.type,
                    scaling: question.scaling,
                    precision: 4,
                  })}
                </Td>
                <Td className="tabular-nums tracking-tight">
                  {checkQuartilesOutOfBorders(userPreviousQuartiles?.upper75)}
                  {getTableDisplayValue({
                    value: userPreviousQuartiles?.upper75,
                    questionType: question.type,
                    scaling: question.scaling,
                    precision: 4,
                  })}
                </Td>
                {question.open_upper_bound && userPreviousBounds && (
                  <Td>{(userPreviousBounds.aboveUpper * 100).toFixed(1)}%</Td>
                )}
              </>
            </tr>
          )}
        </tbody>
      </table>
      {/* Mobile table */}
      <table className="mb-4 table w-full table-fixed border-separate border-spacing-1 text-xs font-medium sm:hidden">
        <thead>
          <tr className="align-top">
            <Td className="font-medium text-gray-600 dark:text-gray-600-dark">
              {question.open_lower_bound ? t("lowerBound") : t("quartiles")}
            </Td>
            {withCommunityQuartiles && (
              <Td className="capitalize text-olive-800 dark:text-olive-800-dark">
                {t("community")}
              </Td>
            )}
            {withUserQuartiles && (
              <Td className="text-orange-800 dark:text-orange-800-dark">
                {t("myPrediction")}
              </Td>
            )}
            {withUserQuartiles && userPreviousQuartiles && (
              <Td className="text-orange-800 dark:text-orange-800-dark">
                {t("myPredictionPrevious")}
              </Td>
            )}
          </tr>
        </thead>
        <tbody>
          {question.open_lower_bound && (
            <>
              <tr>
                <Td className="rounded bg-blue-400/60 px-1 py-3 font-bold text-blue-700 dark:bg-blue-600/20 dark:text-blue-800-dark">
                  {"<"}
                  {displayValue({
                    value: question.scaling.range_min,
                    questionType: question.type,
                  })}
                </Td>
                {withCommunityQuartiles && (
                  <Td className="text-olive-800 dark:text-olive-800-dark">
                    {communityBounds
                      ? (communityBounds.belowLower * 100).toFixed(1) + "%"
                      : "—"}
                  </Td>
                )}
                {withUserQuartiles &&
                forecastInputMode === ForecastInputType.Quantile ? (
                  <Td>
                    <NumericTableInput
                      type="number"
                      quantileValue={quantileComponents?.[0]?.p0}
                      error={errors.find((e) => e.quantile === "p0")?.message}
                      onQuantileChange={(
                        quantileValue: DistributionQuantileValue
                      ) => {
                        handleQuantileChange("p0", quantileValue);
                      }}
                    />
                  </Td>
                ) : (
                  <Td className="text-orange-800 dark:text-orange-800-dark">
                    {(isDirty || hasUserForecast) && userBounds
                      ? `${(userBounds.belowLower * 100).toFixed(1)}%`
                      : "—"}
                  </Td>
                )}
                {withUserQuartiles && userPreviousQuartiles && (
                  <Td className="text-orange-800 dark:text-orange-800-dark">
                    {userPreviousBounds
                      ? `${(userPreviousBounds.belowLower * 100).toFixed(1)}%`
                      : "—"}
                  </Td>
                )}
              </tr>
              <tr>
                <Td className="pt-3 text-gray-600 dark:text-gray-600-dark">
                  {t("quartiles")}
                </Td>
                {withUserQuartiles && <Td></Td>}
                {withUserQuartiles && userPreviousQuartiles && <Td></Td>}
                {withCommunityQuartiles && <Td></Td>}
              </tr>
            </>
          )}
          <tr>
            <Td className="rounded bg-blue-400/60 px-1 py-3 text-xs font-bold text-blue-700 dark:bg-blue-600/20 dark:text-blue-800-dark">
              {t("firstQuartile")}
            </Td>
            {withCommunityQuartiles && (
              <Td className="tabular-nums tracking-tight text-olive-800 dark:text-olive-800-dark">
                {checkQuartilesOutOfBorders(communityQuartiles?.lower25)}
                {getTableDisplayValue({
                  value: communityQuartiles?.lower25,
                  questionType: question.type,
                  scaling: question.scaling,
                  precision: 4,
                })}
              </Td>
            )}
            {withUserQuartiles &&
            forecastInputMode === ForecastInputType.Quantile ? (
              <Td className="tabular-nums tracking-tight text-orange-800 dark:text-orange-800-dark">
                <NumericTableInput
                  type={
                    question.type === QuestionType.Numeric ? "number" : "date"
                  }
                  quantileValue={quantileComponents?.[0]?.q1}
                  error={errors.find((e) => e.quantile === "q1")?.message}
                  onQuantileChange={(
                    quantileValue: DistributionQuantileValue
                  ) => {
                    handleQuantileChange("q1", quantileValue);
                  }}
                />
              </Td>
            ) : (
              <Td className="text-orange-800 dark:text-orange-800-dark">
                {isDirty || hasUserForecast ? (
                  <>
                    {checkQuartilesOutOfBorders(userQuartiles?.lower25)}
                    {getTableDisplayValue({
                      value: userQuartiles?.lower25,
                      questionType: question.type,
                      scaling: question.scaling,
                      precision: 4,
                    })}
                  </>
                ) : (
                  "—"
                )}
              </Td>
            )}
            {withUserQuartiles && userPreviousQuartiles && (
              <Td className="tabular-nums tracking-tight text-orange-800 dark:text-orange-800-dark">
                {checkQuartilesOutOfBorders(userPreviousQuartiles?.lower25)}
                {getTableDisplayValue({
                  value: userPreviousQuartiles?.lower25,
                  questionType: question.type,
                  scaling: question.scaling,
                  precision: 4,
                })}
              </Td>
            )}
          </tr>
          <tr>
            <Td className="rounded bg-blue-400/60 px-1 py-3 font-bold text-blue-700 dark:bg-blue-600/20 dark:text-blue-800-dark">
              {t("secondQuartile")}
            </Td>
            {withCommunityQuartiles && (
              <Td className="tabular-nums tracking-tight text-olive-800 dark:text-olive-800-dark">
                {checkQuartilesOutOfBorders(communityQuartiles?.median)}
                {getTableDisplayValue({
                  value: communityQuartiles?.median,
                  questionType: question.type,
                  scaling: question.scaling,
                  precision: 4,
                })}
              </Td>
            )}
            {withUserQuartiles &&
            forecastInputMode === ForecastInputType.Quantile ? (
              <Td className="tabular-nums tracking-tight text-orange-800 dark:text-orange-800-dark">
                <NumericTableInput
                  type={
                    question.type === QuestionType.Numeric ? "number" : "date"
                  }
                  quantileValue={quantileComponents?.[0]?.q2}
                  error={errors.find((e) => e.quantile === "q2")?.message}
                  onQuantileChange={(
                    quantileValue: DistributionQuantileValue
                  ) => {
                    handleQuantileChange("q2", quantileValue);
                  }}
                />
              </Td>
            ) : (
              <Td className="text-orange-800 dark:text-orange-800-dark">
                {isDirty || hasUserForecast ? (
                  <>
                    {checkQuartilesOutOfBorders(userQuartiles?.median)}
                    {getTableDisplayValue({
                      value: userQuartiles?.median,
                      questionType: question.type,
                      scaling: question.scaling,
                      precision: 4,
                    })}
                  </>
                ) : (
                  "—"
                )}
              </Td>
            )}
            {withUserQuartiles && userPreviousQuartiles && (
              <Td className="tabular-nums tracking-tight text-orange-800 dark:text-orange-800-dark">
                {checkQuartilesOutOfBorders(userPreviousQuartiles?.median)}
                {getTableDisplayValue({
                  value: userPreviousQuartiles?.median,
                  questionType: question.type,
                  scaling: question.scaling,
                  precision: 4,
                })}
              </Td>
            )}
          </tr>
          <tr>
            <Td className="rounded bg-blue-400/60 px-1 py-3 font-bold text-blue-700 dark:bg-blue-600/20 dark:text-blue-800-dark">
              {t("thirdQuartile")}
            </Td>
            {withCommunityQuartiles && (
              <Td className="tabular-nums tracking-tight text-olive-800 dark:text-olive-800-dark">
                {checkQuartilesOutOfBorders(communityQuartiles?.upper75)}
                {getTableDisplayValue({
                  value: communityQuartiles?.upper75,
                  questionType: question.type,
                  scaling: question.scaling,
                  precision: 4,
                })}
              </Td>
            )}
            {withUserQuartiles &&
            forecastInputMode === ForecastInputType.Quantile ? (
              <Td className="tabular-nums tracking-tight text-orange-800 dark:text-orange-800-dark">
                <NumericTableInput
                  type={
                    question.type === QuestionType.Numeric ? "number" : "date"
                  }
                  quantileValue={quantileComponents?.[0]?.q3}
                  error={errors.find((e) => e.quantile === "q3")?.message}
                  onQuantileChange={(
                    quantileValue: DistributionQuantileValue
                  ) => {
                    handleQuantileChange("q3", quantileValue);
                  }}
                />
              </Td>
            ) : (
              <Td className="text-orange-800 dark:text-orange-800-dark">
                {isDirty || hasUserForecast ? (
                  <>
                    {checkQuartilesOutOfBorders(userQuartiles?.upper75)}
                    {getTableDisplayValue({
                      value: userQuartiles?.upper75,
                      questionType: question.type,
                      scaling: question.scaling,
                      precision: 4,
                    })}
                  </>
                ) : (
                  "—"
                )}
              </Td>
            )}
            {withUserQuartiles && userPreviousQuartiles && (
              <Td className="tabular-nums tracking-tight text-orange-800 dark:text-orange-800-dark">
                {checkQuartilesOutOfBorders(userPreviousQuartiles?.upper75)}
                {getTableDisplayValue({
                  value: userPreviousQuartiles?.upper75,
                  questionType: question.type,
                  scaling: question.scaling,
                  precision: 4,
                })}
              </Td>
            )}
          </tr>
          {question.open_upper_bound && (
            <>
              <tr>
                <Td className="pt-3 text-gray-600 dark:text-gray-600-dark">
                  {t("upperBound")}
                </Td>
                {withUserQuartiles && <Td></Td>}
                {withUserQuartiles && userPreviousQuartiles && <Td></Td>}
                {withCommunityQuartiles && <Td></Td>}
              </tr>
              <tr>
                <Td className="rounded bg-blue-400/60 px-1 py-3 font-bold text-blue-700 dark:bg-blue-600/20 dark:text-blue-800-dark">
                  {">"}
                  {displayValue({
                    value: question.scaling.range_max,
                    questionType: question.type,
                  })}
                </Td>
                {withCommunityQuartiles && (
                  <Td className="text-olive-800 dark:text-olive-800-dark">
                    {communityBounds
                      ? `${(communityBounds.aboveUpper * 100).toFixed(1)}%`
                      : "—"}
                  </Td>
                )}
                {withUserQuartiles &&
                forecastInputMode === ForecastInputType.Quantile ? (
                  <Td>
                    <NumericTableInput
                      type="number"
                      quantileValue={quantileComponents?.[0]?.p4}
                      error={errors.find((e) => e.quantile === "p4")?.message}
                      onQuantileChange={(
                        quantileValue: DistributionQuantileValue
                      ) => {
                        handleQuantileChange("p4", quantileValue);
                      }}
                    />
                  </Td>
                ) : (
                  <Td className="text-orange-800 dark:text-orange-800-dark">
                    {(isDirty || hasUserForecast) && userBounds
                      ? `${(userBounds.aboveUpper * 100).toFixed(1)}%`
                      : "—"}
                  </Td>
                )}
                {withUserQuartiles && userPreviousQuartiles && (
                  <Td className="text-orange-800 dark:text-orange-800-dark">
                    {userPreviousBounds
                      ? `${(userPreviousBounds.aboveUpper * 100).toFixed(1)}%`
                      : "—"}
                  </Td>
                )}
              </tr>
              {withUserQuartiles &&
                forecastInputMode === ForecastInputType.Quantile && (
                  <tr>
                    <Td
                      colSpan={
                        4 +
                        (question.open_lower_bound ? 1 : 0) +
                        (question.open_upper_bound ? 1 : 0)
                      }
                    >
                      <FormErrorMessage errors={errors.map((e) => e.message)} />
                    </Td>
                  </tr>
                )}
            </>
          )}
        </tbody>
      </table>
    </>
  );
};

const Td: FC<
  DetailedHTMLProps<
    TdHTMLAttributes<HTMLTableCellElement>,
    HTMLTableCellElement
  >
> = ({ className, children, ...props }) => (
  <td className={cn("w-full text-center", className)} {...props}>
    {children}
  </td>
);

function checkQuartilesOutOfBorders(quartile: number | undefined) {
  return quartile === 0 ? "<" : quartile === 1 ? ">" : null;
}

export default NumericForecastTable;
