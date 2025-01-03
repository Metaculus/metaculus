import { useTranslations } from "next-intl";
import React, { FC } from "react";

import {
  Bounds,
  Quartiles,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getDisplayValue, displayValue } from "@/utils/charts";

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
      <div className="mb-4 flex justify-between text-center">
        <div className="w-full" />
        {withUserQuartiles && (
          <>
            <div className="w-full text-orange-800 dark:text-orange-800-dark">
              {t("myPrediction")}
            </div>
          </>
        )}
        {withUserQuartiles && userPreviousQuartiles && (
          <>
            <div className="w-full text-orange-800 dark:text-orange-800-dark">
              {t("myPredictionPrevious")}
            </div>
          </>
        )}
        {withCommunityQuartiles && (
          <>
            <a className="w-full text-olive-700 dark:text-olive-700-dark">
              {t("community")}
            </a>
          </>
        )}
      </div>
      <div className="mb-4 flex justify-between">
        {(withUserQuartiles || withCommunityQuartiles) && (
          <div className="w-full text-center">
            {question.open_lower_bound && (
              <div className="w-full">
                {"<"}
                {displayValue(question.scaling.range_min, question.type)}
              </div>
            )}
            <div className="w-full">{t("firstQuartile")}</div>
            <div className="w-full">{t("secondQuartile")}</div>
            <div className="w-full">{t("thirdQuartile")}</div>
            {question.open_upper_bound && (
              <div className="w-full">
                {">"}
                {displayValue(question.scaling.range_max, question.type)}
              </div>
            )}
          </div>
        )}
        {withUserQuartiles && (
          <div className="w-full text-center">
            {isDirty || hasUserForecast ? (
              <>
                {question.open_lower_bound && (
                  <div>
                    {userBounds && (userBounds.belowLower * 100).toFixed(1)}%
                  </div>
                )}
                <div>
                  {checkQuartilesOutOfBorders(userQuartiles?.lower25)}
                  {getDisplayValue({
                    value: userQuartiles?.lower25,
                    questionType: question.type,
                    scaling: question.scaling,
                    precision: 4,
                  })}
                </div>
                <div>
                  {checkQuartilesOutOfBorders(userQuartiles?.median)}
                  {getDisplayValue({
                    value: userQuartiles?.median,
                    questionType: question.type,
                    scaling: question.scaling,
                    precision: 4,
                  })}
                </div>
                <div>
                  {checkQuartilesOutOfBorders(userQuartiles?.upper75)}
                  {getDisplayValue({
                    value: userQuartiles?.upper75,
                    questionType: question.type,
                    scaling: question.scaling,
                    precision: 4,
                  })}
                </div>
                {question.open_upper_bound && userBounds && (
                  <div>{(userBounds.aboveUpper * 100).toFixed(1)}%</div>
                )}
              </>
            ) : (
              <>
                {question.open_lower_bound && <div>...</div>}
                {[...Array(3)].map((_, i) => {
                  return <div key={i}>...</div>;
                })}
                {question.open_upper_bound && <div>...</div>}
              </>
            )}
          </div>
        )}
        {withUserQuartiles && userPreviousQuartiles && (
          <div className="w-full text-center">
            <>
              {question.open_lower_bound && (
                <div>
                  {userPreviousBounds &&
                    (userPreviousBounds.belowLower * 100).toFixed(1)}
                  %
                </div>
              )}
              <div>
                {checkQuartilesOutOfBorders(userPreviousQuartiles?.lower25)}
                {getDisplayValue({
                  value: userPreviousQuartiles?.lower25,
                  questionType: question.type,
                  scaling: question.scaling,
                  precision: 4,
                })}
              </div>
              <div>
                {checkQuartilesOutOfBorders(userPreviousQuartiles?.median)}
                {getDisplayValue({
                  value: userPreviousQuartiles?.median,
                  questionType: question.type,
                  scaling: question.scaling,
                  precision: 4,
                })}
              </div>
              <div>
                {checkQuartilesOutOfBorders(userPreviousQuartiles?.upper75)}
                {getDisplayValue({
                  value: userPreviousQuartiles?.upper75,
                  questionType: question.type,
                  scaling: question.scaling,
                  precision: 4,
                })}
              </div>
              {question.open_upper_bound && userPreviousBounds && (
                <div>{(userPreviousBounds.aboveUpper * 100).toFixed(1)}%</div>
              )}
            </>
          </div>
        )}

        {withCommunityQuartiles && (
          <div className="w-full text-center">
            {question.open_lower_bound && (
              <div>
                {communityBounds
                  ? (communityBounds.belowLower * 100).toFixed(1) + "%"
                  : "..."}
              </div>
            )}
            <div>
              {checkQuartilesOutOfBorders(communityQuartiles?.lower25)}
              {getDisplayValue({
                value: communityQuartiles?.lower25,
                questionType: question.type,
                scaling: question.scaling,
                precision: 4,
              })}
            </div>
            <div>
              {checkQuartilesOutOfBorders(communityQuartiles?.median)}
              {getDisplayValue({
                value: communityQuartiles?.median,
                questionType: question.type,
                scaling: question.scaling,
                precision: 4,
              })}
            </div>
            <div>
              {checkQuartilesOutOfBorders(communityQuartiles?.upper75)}
              {getDisplayValue({
                value: communityQuartiles?.upper75,
                questionType: question.type,
                scaling: question.scaling,
                precision: 4,
              })}
            </div>
            {question.open_upper_bound && (
              <div>
                {communityBounds
                  ? (communityBounds.aboveUpper * 100).toFixed(1) + "%"
                  : "..."}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

function checkQuartilesOutOfBorders(quartile: number | undefined) {
  return quartile === 0 ? "<" : quartile === 1 ? ">" : null;
}

export default NumericForecastTable;
