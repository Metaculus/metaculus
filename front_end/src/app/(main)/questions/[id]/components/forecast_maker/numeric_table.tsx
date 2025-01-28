import { useTranslations } from "next-intl";
import React, { DetailedHTMLProps, FC, TdHTMLAttributes } from "react";

import {
  Bounds,
  Quartiles,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getDisplayValue, displayValue } from "@/utils/charts";
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

  const props = {
    question,
    userBounds,
    userQuartiles,
    userPreviousBounds,
    userPreviousQuartiles,
    withUserQuartiles,
    communityBounds,
    communityQuartiles,
    withCommunityQuartiles,
    hasUserForecast,
    isDirty,
  };

  console.log("TABLEPROPS");
  console.log(props);

  return (
    <div className="w-full overflow-y-scroll sm:overflow-y-hidden">
      <table className="table w-[640px] table-fixed border-separate border-spacing-1 sm:w-full">
        <thead>
          <tr className="text-xs font-bold text-blue-700 dark:text-blue-800-dark">
            {(withUserQuartiles || withCommunityQuartiles) && (
              <>
                <Td></Td>
                {question.open_lower_bound && (
                  <Td className="rounded-[4px] bg-[#D7E4F299] p-1">
                    {"<"}
                    {displayValue(question.scaling.range_min, question.type)}
                  </Td>
                )}
                <Td className="rounded-[4px] bg-[#D7E4F299] p-1">
                  {t("firstQuartile")}
                </Td>
                <Td className="rounded-[4px] bg-[#D7E4F299] p-1">
                  {t("secondQuartile")}
                </Td>
                <Td className="rounded-[4px] bg-[#D7E4F299] p-1">
                  {t("thirdQuartile")}
                </Td>
                {question.open_upper_bound && (
                  <Td className="rounded-[4px] bg-[#D7E4F299] p-1">
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
              <Td>{t("community")}</Td>

              {question.open_lower_bound && (
                <Td>
                  {communityBounds
                    ? (communityBounds.belowLower * 100).toFixed(1) + "%"
                    : "..."}
                </Td>
              )}
              <Td>
                {checkQuartilesOutOfBorders(communityQuartiles?.lower25)}
                {getDisplayValue({
                  value: communityQuartiles?.lower25,
                  questionType: question.type,
                  scaling: question.scaling,
                  precision: 4,
                })}
              </Td>
              <Td>
                {checkQuartilesOutOfBorders(communityQuartiles?.median)}
                {getDisplayValue({
                  value: communityQuartiles?.median,
                  questionType: question.type,
                  scaling: question.scaling,
                  precision: 4,
                })}
              </Td>
              <Td>
                {checkQuartilesOutOfBorders(communityQuartiles?.upper75)}
                {getDisplayValue({
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
                    : "..."}
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
                  <Td>
                    {checkQuartilesOutOfBorders(userQuartiles?.lower25)}
                    {getDisplayValue({
                      value: userQuartiles?.lower25,
                      questionType: question.type,
                      scaling: question.scaling,
                      precision: 4,
                    })}
                  </Td>
                  <Td>
                    {checkQuartilesOutOfBorders(userQuartiles?.median)}
                    {getDisplayValue({
                      value: userQuartiles?.median,
                      questionType: question.type,
                      scaling: question.scaling,
                      precision: 4,
                    })}
                  </Td>
                  <Td>
                    {checkQuartilesOutOfBorders(userQuartiles?.upper75)}
                    {getDisplayValue({
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
                <Td>
                  {checkQuartilesOutOfBorders(userPreviousQuartiles?.lower25)}
                  {getDisplayValue({
                    value: userPreviousQuartiles?.lower25,
                    questionType: question.type,
                    scaling: question.scaling,
                    precision: 4,
                  })}
                </Td>
                <Td>
                  {checkQuartilesOutOfBorders(userPreviousQuartiles?.median)}
                  {getDisplayValue({
                    value: userPreviousQuartiles?.median,
                    questionType: question.type,
                    scaling: question.scaling,
                    precision: 4,
                  })}
                </Td>
                <Td>
                  {checkQuartilesOutOfBorders(userPreviousQuartiles?.upper75)}
                  {getDisplayValue({
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
    </div>
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
