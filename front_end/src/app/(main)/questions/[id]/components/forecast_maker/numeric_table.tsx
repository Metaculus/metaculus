import { useTranslations } from "next-intl";
import React, { DetailedHTMLProps, FC, TdHTMLAttributes } from "react";

import {
  Bounds,
  Quartiles,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { displayValue, getTableDisplayValue } from "@/utils/charts";
import cn from "@/utils/cn";

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
}) => {
  const t = useTranslations();

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
                    {displayValue(question.scaling.range_min, question.type)}
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
                    {displayValue(question.scaling.range_max, question.type)}
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
                  unit: question.unit,
                })}
              </Td>
              <Td className="tabular-nums tracking-tight">
                {checkQuartilesOutOfBorders(communityQuartiles?.median)}
                {getTableDisplayValue({
                  value: communityQuartiles?.median,
                  questionType: question.type,
                  scaling: question.scaling,
                  precision: 4,
                  unit: question.unit,
                })}
              </Td>
              <Td className="tabular-nums tracking-tight">
                {checkQuartilesOutOfBorders(communityQuartiles?.upper75)}
                {getTableDisplayValue({
                  value: communityQuartiles?.upper75,
                  questionType: question.type,
                  scaling: question.scaling,
                  precision: 4,
                  unit: question.unit,
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
          {withUserQuartiles && (
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
                      unit: question.unit,
                    })}
                  </Td>
                  <Td className="tabular-nums tracking-tight">
                    {checkQuartilesOutOfBorders(userQuartiles?.median)}
                    {getTableDisplayValue({
                      value: userQuartiles?.median,
                      questionType: question.type,
                      scaling: question.scaling,
                      precision: 4,
                      unit: question.unit,
                    })}
                  </Td>
                  <Td className="tabular-nums tracking-tight">
                    {checkQuartilesOutOfBorders(userQuartiles?.upper75)}
                    {getTableDisplayValue({
                      value: userQuartiles?.upper75,
                      questionType: question.type,
                      scaling: question.scaling,
                      precision: 4,
                      unit: question.unit,
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
                    unit: question.unit,
                  })}
                </Td>
                <Td className="tabular-nums tracking-tight">
                  {checkQuartilesOutOfBorders(userPreviousQuartiles?.median)}
                  {getTableDisplayValue({
                    value: userPreviousQuartiles?.median,
                    questionType: question.type,
                    scaling: question.scaling,
                    precision: 4,
                    unit: question.unit,
                  })}
                </Td>
                <Td className="tabular-nums tracking-tight">
                  {checkQuartilesOutOfBorders(userPreviousQuartiles?.upper75)}
                  {getTableDisplayValue({
                    value: userPreviousQuartiles?.upper75,
                    questionType: question.type,
                    scaling: question.scaling,
                    precision: 4,
                    unit: question.unit,
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
                  {displayValue(question.scaling.range_min, question.type)}
                </Td>
                {withCommunityQuartiles && (
                  <Td className="text-olive-800 dark:text-olive-800-dark">
                    {communityBounds
                      ? (communityBounds.belowLower * 100).toFixed(1) + "%"
                      : "—"}
                  </Td>
                )}
                {withUserQuartiles && (
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
                  unit: question.unit,
                })}
              </Td>
            )}
            {withUserQuartiles && (
              <Td className="tabular-nums tracking-tight text-orange-800 dark:text-orange-800-dark">
                {isDirty || hasUserForecast ? (
                  <>
                    {checkQuartilesOutOfBorders(userQuartiles?.lower25)}
                    {getTableDisplayValue({
                      value: userQuartiles?.lower25,
                      questionType: question.type,
                      scaling: question.scaling,
                      precision: 4,
                      unit: question.unit,
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
                  unit: question.unit,
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
                  unit: question.unit,
                })}
              </Td>
            )}
            {withUserQuartiles && (
              <Td className="tabular-nums tracking-tight text-orange-800 dark:text-orange-800-dark">
                {isDirty || hasUserForecast ? (
                  <>
                    {checkQuartilesOutOfBorders(userQuartiles?.median)}
                    {getTableDisplayValue({
                      value: userQuartiles?.median,
                      questionType: question.type,
                      scaling: question.scaling,
                      precision: 4,
                      unit: question.unit,
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
                  unit: question.unit,
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
                  unit: question.unit,
                })}
              </Td>
            )}
            {withUserQuartiles && (
              <Td className="tabular-nums tracking-tight text-orange-800 dark:text-orange-800-dark">
                {isDirty || hasUserForecast ? (
                  <>
                    {checkQuartilesOutOfBorders(userQuartiles?.upper75)}
                    {getTableDisplayValue({
                      value: userQuartiles?.upper75,
                      questionType: question.type,
                      scaling: question.scaling,
                      precision: 4,
                      unit: question.unit,
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
                  unit: question.unit,
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
                  {displayValue(question.scaling.range_max, question.type)}
                </Td>
                {withCommunityQuartiles && (
                  <Td className="text-olive-800 dark:text-olive-800-dark">
                    {communityBounds
                      ? `${(communityBounds.aboveUpper * 100).toFixed(1)}%`
                      : "—"}
                  </Td>
                )}
                {withUserQuartiles && (
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
