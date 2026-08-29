import { isNil, uniq } from "lodash";
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
import { ContinuousForecastInputType } from "@/types/charts";
import {
  Bounds,
  DistributionQuantileComponent,
  Quantile,
  QuantileValue,
  Quartiles,
  QuestionType,
  QuestionWithNumericForecasts,
} from "@/types/question";
import cn from "@/utils/core/cn";
import { getQuantileNumericForecastDataset } from "@/utils/forecasts/dataset";
import { isAllQuantileComponentsDirty } from "@/utils/forecasts/helpers";
import {
  getDiscreteValueOptions,
  getTableDisplayValue,
} from "@/utils/formatters/prediction";

import ContinuousTableInput from "./continuous_table_input";
import {
  validateAllQuantileInputs,
  validateUserQuantileData,
} from "../helpers";

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
  forecastInputMode?: ContinuousForecastInputType;
  quantileComponents?: DistributionQuantileComponent;
  onQuantileChange?: (quantileComponents: QuantileValue[]) => void;
  disableQuantileInput?: boolean;
  userPreviousLabel?: string;
  userPreviousRowClassName?: string;
  hideCurrentUserRow?: boolean;
};

const ContinuousTable: FC<Props> = ({
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
  forecastInputMode = ContinuousForecastInputType.Slider,
  quantileComponents,
  onQuantileChange,
  disableQuantileInput = false,
  userPreviousLabel,
  userPreviousRowClassName,
  hideCurrentUserRow = false,
}) => {
  const t = useTranslations();
  // initial state is a safety measure to avoid errors when we already have slider forecast
  // and we switch to quantile forecast with transformed values
  const [errors, setErrors] = useState<
    {
      quantile?: Quantile;
      message?: string;
    }[]
  >(
    quantileComponents && isAllQuantileComponentsDirty(quantileComponents)
      ? validateAllQuantileInputs({
          question,
          components: quantileComponents,
          t,
        })
      : []
  );

  useEffect(() => {
    // clear errors on discard click
    if (
      Object.values(quantileComponents ?? []).every((value) => !value?.isDirty)
    ) {
      setErrors([]);
    }
    // revalidate when we populate the table with slider forecast data
    if (
      quantileComponents &&
      isAllQuantileComponentsDirty(quantileComponents)
    ) {
      setErrors(
        validateAllQuantileInputs({
          question,
          components: quantileComponents,
          t,
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forecastInputMode, quantileComponents]);

  const handleQuantileChange = useCallback(
    (quantile: Quantile, newValue: Partial<QuantileValue>) => {
      if (!quantileComponents || !onQuantileChange) return;
      setErrors([]);
      const localQuantileComponents = [...quantileComponents];
      const quantileIndex = localQuantileComponents.findIndex(
        (q) => q.quantile === quantile
      );
      if (quantileIndex !== -1) {
        localQuantileComponents[quantileIndex] = {
          quantile: quantile,
          value: newValue.value,
          isDirty: newValue.isDirty,
        };
      }
      onQuantileChange(localQuantileComponents);

      const errors = validateAllQuantileInputs({
        question,
        components: localQuantileComponents,
        t,
      });

      if (errors.length !== 0) {
        setErrors(errors);
      } else {
        const dataset = getQuantileNumericForecastDataset(
          localQuantileComponents as DistributionQuantileComponent,
          question
        );
        const cdfValidation = validateUserQuantileData({
          question,
          components: localQuantileComponents,
          cdf: dataset.cdf,
          t,
          checkInputData: false,
        });
        if (cdfValidation.length !== 0) {
          setErrors(
            cdfValidation.map((error) => ({
              quantile: undefined,
              message: error,
            }))
          );
        }
      }
    },
    [quantileComponents, onQuantileChange, question, t]
  );

  const discreteValueOptions = getDiscreteValueOptions(question);

  const getDisplayValue = (value: number | null | undefined) => {
    return getTableDisplayValue(value, {
      questionType: question.type,
      scaling: question.scaling,
      precision: 4,
      unit: question.unit,
      actual_resolve_time: question.actual_resolve_time ?? null,
      discreteValueOptions,
    });
  };

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
                    {getDisplayValue(-0.1)}
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
                    {getDisplayValue(1.1)}
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
                {getDisplayValue(communityQuartiles?.lower25)}
              </Td>
              <Td className="tabular-nums tracking-tight">
                {getDisplayValue(communityQuartiles?.median)}
              </Td>
              <Td className="tabular-nums tracking-tight">
                {getDisplayValue(communityQuartiles?.upper75)}
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
          {withUserQuartiles &&
            forecastInputMode === ContinuousForecastInputType.Slider && (
              <tr className="text-orange-800 dark:text-orange-800-dark">
                <Td>{t("myPrediction")}</Td>
                {!hideCurrentUserRow && (isDirty || hasUserForecast) ? (
                  <>
                    {question.open_lower_bound && (
                      <Td>
                        {userBounds && (userBounds.belowLower * 100).toFixed(1)}
                        %
                      </Td>
                    )}
                    <Td className="tabular-nums tracking-tight">
                      {getDisplayValue(userQuartiles?.lower25)}
                    </Td>
                    <Td className="tabular-nums tracking-tight">
                      {getDisplayValue(userQuartiles?.median)}
                    </Td>
                    <Td className="tabular-nums tracking-tight">
                      {getDisplayValue(userQuartiles?.upper75)}
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
            forecastInputMode === ContinuousForecastInputType.Quantile && (
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
                        <ContinuousTableInput
                          type="number"
                          quantileValue={quantileComponents?.[0]}
                          error={
                            errors.find(
                              (e) =>
                                isNil(e.quantile) ||
                                e.quantile === Quantile.lower
                            )?.message
                          }
                          onQuantileChange={(
                            quantileValue: Partial<QuantileValue>
                          ) => {
                            handleQuantileChange(Quantile.lower, quantileValue);
                          }}
                          disabled={disableQuantileInput}
                          showPercentSign={true}
                        />
                      </Td>
                    )}
                    <Td>
                      <ContinuousTableInput
                        type={
                          question.type === QuestionType.Numeric ||
                          question.type === QuestionType.Discrete
                            ? "number"
                            : "date"
                        }
                        quantileValue={quantileComponents?.[1]}
                        error={
                          errors.find(
                            (e) =>
                              isNil(e.quantile) || e.quantile === Quantile.q1
                          )?.message
                        }
                        onQuantileChange={(
                          quantileValue: Partial<QuantileValue>
                        ) => {
                          handleQuantileChange(Quantile.q1, quantileValue);
                        }}
                        disabled={disableQuantileInput}
                      />
                    </Td>
                    <Td>
                      <ContinuousTableInput
                        type={
                          question.type === QuestionType.Numeric ||
                          question.type === QuestionType.Discrete
                            ? "number"
                            : "date"
                        }
                        quantileValue={quantileComponents?.[2]}
                        error={
                          errors.find(
                            (e) =>
                              isNil(e.quantile) || e.quantile === Quantile.q2
                          )?.message
                        }
                        onQuantileChange={(
                          quantileValue: Partial<QuantileValue>
                        ) => {
                          handleQuantileChange(Quantile.q2, quantileValue);
                        }}
                        disabled={disableQuantileInput}
                      />
                    </Td>
                    <Td>
                      <ContinuousTableInput
                        type={
                          question.type === QuestionType.Numeric ||
                          question.type === QuestionType.Discrete
                            ? "number"
                            : "date"
                        }
                        quantileValue={quantileComponents?.[3]}
                        error={
                          errors.find(
                            (e) =>
                              isNil(e.quantile) || e.quantile === Quantile.q3
                          )?.message
                        }
                        onQuantileChange={(
                          quantileValue: Partial<QuantileValue>
                        ) => {
                          handleQuantileChange(Quantile.q3, quantileValue);
                        }}
                        disabled={disableQuantileInput}
                      />
                    </Td>
                    {question.open_upper_bound && (
                      <Td>
                        <ContinuousTableInput
                          type="number"
                          quantileValue={quantileComponents?.[4]}
                          error={
                            errors.find(
                              (e) =>
                                isNil(e.quantile) ||
                                e.quantile === Quantile.upper
                            )?.message
                          }
                          onQuantileChange={(
                            quantileValue: Partial<QuantileValue>
                          ) => {
                            handleQuantileChange(Quantile.upper, quantileValue);
                          }}
                          disabled={disableQuantileInput}
                          showPercentSign={true}
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
                    {uniq(errors.map((e) => e.message)).map((message) => {
                      return (
                        <FormErrorMessage
                          errors={[message]}
                          key={`${message}-desktop`}
                        />
                      );
                    })}
                  </Td>
                </tr>
              </>
            )}

          {withUserQuartiles && userPreviousQuartiles && (
            <tr
              className={cn(
                "text-orange-800 dark:text-orange-800-dark",
                userPreviousRowClassName
              )}
            >
              <Td>{userPreviousLabel ?? t("myPredictionPrevious")}</Td>
              <>
                {question.open_lower_bound && (
                  <Td>
                    {userPreviousBounds &&
                      (userPreviousBounds.belowLower * 100).toFixed(1)}
                    %
                  </Td>
                )}
                <Td className="tabular-nums tracking-tight">
                  {getDisplayValue(userPreviousQuartiles?.lower25)}
                </Td>
                <Td className="tabular-nums tracking-tight">
                  {getDisplayValue(userPreviousQuartiles?.median)}
                </Td>
                <Td className="tabular-nums tracking-tight">
                  {getDisplayValue(userPreviousQuartiles?.upper75)}
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
              <Td
                className={cn(
                  "text-orange-800 dark:text-orange-800-dark",
                  userPreviousRowClassName
                )}
              >
                {userPreviousLabel ?? t("myPredictionPrevious")}
              </Td>
            )}
          </tr>
        </thead>
        <tbody>
          {question.open_lower_bound && (
            <>
              <tr>
                <Td className="rounded bg-blue-400/60 px-1 py-3 font-bold text-blue-700 dark:bg-blue-600/20 dark:text-blue-800-dark">
                  {getDisplayValue(0)}
                </Td>
                {withCommunityQuartiles && (
                  <Td className="text-olive-800 dark:text-olive-800-dark">
                    {communityBounds
                      ? (communityBounds.belowLower * 100).toFixed(1) + "%"
                      : "—"}
                  </Td>
                )}
                {withUserQuartiles &&
                forecastInputMode === ContinuousForecastInputType.Quantile ? (
                  <Td>
                    <ContinuousTableInput
                      type="number"
                      quantileValue={quantileComponents?.[0]}
                      error={
                        errors.find((e) => e.quantile === Quantile.lower)
                          ?.message
                      }
                      onQuantileChange={(
                        quantileValue: Partial<QuantileValue>
                      ) => {
                        handleQuantileChange(Quantile.lower, quantileValue);
                      }}
                      disabled={disableQuantileInput}
                    />
                  </Td>
                ) : (
                  <Td className="text-orange-800 dark:text-orange-800-dark">
                    {!hideCurrentUserRow &&
                    (isDirty || hasUserForecast) &&
                    userBounds
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
                {getDisplayValue(communityQuartiles?.lower25)}
              </Td>
            )}
            {withUserQuartiles &&
            forecastInputMode === ContinuousForecastInputType.Quantile ? (
              <Td className="tabular-nums tracking-tight text-orange-800 dark:text-orange-800-dark">
                <ContinuousTableInput
                  type={
                    question.type === QuestionType.Numeric ||
                    question.type === QuestionType.Discrete
                      ? "number"
                      : "date"
                  }
                  quantileValue={quantileComponents?.[1]}
                  error={
                    errors.find((e) => e.quantile === Quantile.q1)?.message
                  }
                  onQuantileChange={(quantileValue: Partial<QuantileValue>) => {
                    handleQuantileChange(Quantile.q1, quantileValue);
                  }}
                  disabled={disableQuantileInput}
                />
              </Td>
            ) : (
              <Td className="text-orange-800 dark:text-orange-800-dark">
                {!hideCurrentUserRow && (isDirty || hasUserForecast) ? (
                  <>{getDisplayValue(userQuartiles?.lower25)}</>
                ) : (
                  "—"
                )}
              </Td>
            )}
            {withUserQuartiles && userPreviousQuartiles && (
              <Td className="tabular-nums tracking-tight text-orange-800 dark:text-orange-800-dark">
                {getDisplayValue(userPreviousQuartiles?.lower25)}
              </Td>
            )}
          </tr>
          <tr>
            <Td className="rounded bg-blue-400/60 px-1 py-3 font-bold text-blue-700 dark:bg-blue-600/20 dark:text-blue-800-dark">
              {t("secondQuartile")}
            </Td>
            {withCommunityQuartiles && (
              <Td className="tabular-nums tracking-tight text-olive-800 dark:text-olive-800-dark">
                {getDisplayValue(communityQuartiles?.median)}
              </Td>
            )}
            {withUserQuartiles &&
            forecastInputMode === ContinuousForecastInputType.Quantile ? (
              <Td className="tabular-nums tracking-tight text-orange-800 dark:text-orange-800-dark">
                <ContinuousTableInput
                  type={
                    question.type === QuestionType.Numeric ||
                    question.type === QuestionType.Discrete
                      ? "number"
                      : "date"
                  }
                  quantileValue={quantileComponents?.[2]}
                  error={
                    errors.find((e) => e.quantile === Quantile.q2)?.message
                  }
                  onQuantileChange={(quantileValue: Partial<QuantileValue>) => {
                    handleQuantileChange(Quantile.q2, quantileValue);
                  }}
                  disabled={disableQuantileInput}
                />
              </Td>
            ) : (
              <Td className="text-orange-800 dark:text-orange-800-dark">
                {!hideCurrentUserRow && (isDirty || hasUserForecast) ? (
                  <>{getDisplayValue(userQuartiles?.median)}</>
                ) : (
                  "—"
                )}
              </Td>
            )}
            {withUserQuartiles && userPreviousQuartiles && (
              <Td className="tabular-nums tracking-tight text-orange-800 dark:text-orange-800-dark">
                {getDisplayValue(userPreviousQuartiles?.median)}
              </Td>
            )}
          </tr>
          <tr>
            <Td className="rounded bg-blue-400/60 px-1 py-3 font-bold text-blue-700 dark:bg-blue-600/20 dark:text-blue-800-dark">
              {t("thirdQuartile")}
            </Td>
            {withCommunityQuartiles && (
              <Td className="tabular-nums tracking-tight text-olive-800 dark:text-olive-800-dark">
                {getDisplayValue(communityQuartiles?.upper75)}
              </Td>
            )}
            {withUserQuartiles &&
            forecastInputMode === ContinuousForecastInputType.Quantile ? (
              <Td className="tabular-nums tracking-tight text-orange-800 dark:text-orange-800-dark">
                <ContinuousTableInput
                  type={
                    question.type === QuestionType.Numeric ||
                    question.type === QuestionType.Discrete
                      ? "number"
                      : "date"
                  }
                  quantileValue={quantileComponents?.[3]}
                  error={
                    errors.find((e) => e.quantile === Quantile.q3)?.message
                  }
                  onQuantileChange={(quantileValue: Partial<QuantileValue>) => {
                    handleQuantileChange(Quantile.q3, quantileValue);
                  }}
                  disabled={disableQuantileInput}
                />
              </Td>
            ) : (
              <Td className="text-orange-800 dark:text-orange-800-dark">
                {!hideCurrentUserRow && (isDirty || hasUserForecast) ? (
                  <>{getDisplayValue(userQuartiles?.upper75)}</>
                ) : (
                  "—"
                )}
              </Td>
            )}
            {withUserQuartiles && userPreviousQuartiles && (
              <Td className="tabular-nums tracking-tight text-orange-800 dark:text-orange-800-dark">
                {getDisplayValue(userPreviousQuartiles?.upper75)}
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
                  {getDisplayValue(1)}
                </Td>
                {withCommunityQuartiles && (
                  <Td className="text-olive-800 dark:text-olive-800-dark">
                    {communityBounds
                      ? `${(communityBounds.aboveUpper * 100).toFixed(1)}%`
                      : "—"}
                  </Td>
                )}
                {withUserQuartiles &&
                forecastInputMode === ContinuousForecastInputType.Quantile ? (
                  <Td>
                    <ContinuousTableInput
                      type="number"
                      quantileValue={quantileComponents?.[4]}
                      error={
                        errors.find((e) => e.quantile === Quantile.upper)
                          ?.message
                      }
                      onQuantileChange={(
                        quantileValue: Partial<QuantileValue>
                      ) => {
                        handleQuantileChange(Quantile.upper, quantileValue);
                      }}
                      disabled={disableQuantileInput}
                    />
                  </Td>
                ) : (
                  <Td className="text-orange-800 dark:text-orange-800-dark">
                    {!hideCurrentUserRow && userBounds
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
                forecastInputMode === ContinuousForecastInputType.Quantile && (
                  <tr>
                    <Td
                      colSpan={
                        4 +
                        (question.open_lower_bound ? 1 : 0) +
                        (question.open_upper_bound ? 1 : 0)
                      }
                    >
                      {uniq(errors.map((e) => e.message)).map((message) => {
                        return (
                          <FormErrorMessage
                            errors={[message]}
                            key={`${message}-mobile`}
                          />
                        );
                      })}
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

export default ContinuousTable;
