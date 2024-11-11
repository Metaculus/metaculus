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
                {displayValue(question.scaling.range_min!, question.type)}
              </div>
            )}
            <div className="w-full">{t("firstQuartile")}</div>
            <div className="w-full">{t("secondQuartile")}</div>
            <div className="w-full">{t("thirdQuartile")}</div>
            {question.open_upper_bound && (
              <div className="w-full">
                {">"}
                {displayValue(question.scaling.range_max!, question.type)}
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
                  {userQuartiles?.lower25 === 0
                    ? "<"
                    : userQuartiles?.lower25 === 1
                      ? ">"
                      : null}
                  {getDisplayValue(
                    userQuartiles?.lower25,
                    question.type,
                    question.scaling,
                    4
                  )}
                </div>
                <div>
                  {userQuartiles?.median === 0
                    ? "<"
                    : userQuartiles?.median === 1
                      ? ">"
                      : null}
                  {getDisplayValue(
                    userQuartiles?.median,
                    question.type,
                    question.scaling,
                    4
                  )}
                </div>
                <div>
                  {userQuartiles?.upper75 === 0
                    ? "<"
                    : userQuartiles?.upper75 === 1
                      ? ">"
                      : null}
                  {getDisplayValue(
                    userQuartiles?.upper75,
                    question.type,
                    question.scaling,
                    4
                  )}
                </div>
                {question.open_upper_bound && (
                  <div>{(userBounds!.aboveUpper * 100).toFixed(1)}%</div>
                )}
              </>
            ) : (
              <>
                {question.open_lower_bound && <div>...</div>}
                {[...Array(3)].map((_, i) => {
                  return <div key={i}>...</div>;
                })}
                {question.open_lower_bound && <div>...</div>}
              </>
            )}
          </div>
        )}

        {withCommunityQuartiles && (
          <div className="w-full text-center">
            {question.open_lower_bound && (
              <div>
                {communityBounds &&
                  (communityBounds.belowLower * 100).toFixed(1)}
                %
              </div>
            )}
            <div>
              {communityQuartiles?.lower25 === 0
                ? "<"
                : communityQuartiles?.lower25 === 1
                  ? ">"
                  : null}
              {getDisplayValue(
                communityQuartiles?.lower25,
                question.type,
                question.scaling,
                4
              )}
            </div>
            <div>
              {communityQuartiles?.median === 0
                ? "<"
                : communityQuartiles?.median === 1
                  ? ">"
                  : null}
              {getDisplayValue(
                communityQuartiles?.median,
                question.type,
                question.scaling,
                4
              )}
            </div>
            <div>
              {communityQuartiles?.upper75 === 0
                ? "<"
                : communityQuartiles?.upper75 === 1
                  ? ">"
                  : null}
              {getDisplayValue(
                communityQuartiles?.upper75,
                question.type,
                question.scaling,
                4
              )}
            </div>
            {question.open_upper_bound && (
              <div>
                {communityBounds &&
                  (communityBounds!.aboveUpper * 100).toFixed(1)}
                %
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default NumericForecastTable;
