import { FC, useCallback, useState } from "react";

import { AggregationMethod, AggregationMethodWithBots } from "@/types/question";
import { AggregationQuestionWithBots } from "@/types/question";
import { logError } from "@/utils/errors";

import AggregationsTab from "./aggregation_tab";
import AggregationsDrawer from "./aggregations_drawer";
import { AggregationMethodInfo } from "./explorer";
import { fetchAggregations } from "../actions";
type Props = {
  activeTab: AggregationMethodWithBots | null;
  onTabChange: (activeTab: AggregationMethodWithBots) => void;
  postId: number;
  questionId?: number | null;
};

export const AggregationWrapper: FC<Props> = ({
  activeTab,
  onTabChange,
  postId,
  questionId,
}) => {
  const [aggregationMethods, setAggregationMethods] = useState<
    AggregationMethodInfo[]
  >([]);
  const [aggregationData, setAggregationData] =
    useState<AggregationQuestionWithBots | null>(null);

  const onFetchAggregations = useCallback(
    async ({
      postId,
      questionId,
      includeBots,
      aggregationMethod,
    }: {
      postId: string | number | null;
      questionId?: string | number | null;
      includeBots?: boolean;
      aggregationMethod: AggregationMethod;
    }) => {
      // check if aggregation data was already fetched
      // this will always refetch if BE data is empty for the aggregation method
      const isAlreadyFetched = includeBots
        ? (aggregationData?.bot_aggregations?.[aggregationMethod]?.history
            ?.length ?? 0) > 0
        : (aggregationData?.aggregations?.[aggregationMethod]?.history
            ?.length ?? 0) > 0;
      if (!!isAlreadyFetched) {
        return;
      }
      try {
        const response = await fetchAggregations({
          postId,
          questionId,
          includeBots,
          aggregationMethods: aggregationMethod,
        });

        if (!aggregationData) {
          setAggregationData(() =>
            includeBots
              ? {
                  ...response,
                  // avoid bot aggragation data be saved in the main aggregation data
                  aggregations: {
                    recency_weighted: {
                      history: [],
                      latest: undefined,
                    },
                  },
                  bot_aggregations: {
                    ...response.aggregations,
                  },
                }
              : response
          );
        } else {
          const fetchedAggregationData =
            response.aggregations[aggregationMethod];
          if (fetchedAggregationData) {
            setAggregationData((prev) =>
              prev
                ? {
                    ...prev,
                    ...(includeBots
                      ? {
                          bot_aggregations: {
                            ...prev.bot_aggregations,
                            [aggregationMethod]: fetchedAggregationData,
                          },
                        }
                      : {
                          aggregations: {
                            ...prev.aggregations,
                            [aggregationMethod]: fetchedAggregationData,
                          },
                        }),
                  }
                : response
            );
          }
        }
      } catch (err) {
        logError(err);
      }
    },
    [aggregationData]
  );
  return activeTab ? (
    <AggregationsTab
      activeTab={activeTab}
      questionData={aggregationData}
      onFetchData={onFetchAggregations}
      postId={postId}
      questionId={questionId}
    />
  ) : (
    <AggregationsDrawer
      aggregationMethods={aggregationMethods}
      onTabChange={onTabChange}
      setAggregationMethods={setAggregationMethods}
      onFetchData={onFetchAggregations}
      aggregationData={aggregationData}
      postId={postId}
      questionId={questionId}
    />
  );
};
