import { FC, useCallback, useState } from "react";

import { logError } from "@/utils/errors";

import AggregationsTab from "./aggregation_tab";
import AggregationsDrawer from "./aggregations_drawer";
import { fetchAggregations } from "../actions";
import { AGGREGATION_EXPLORER_OPTIONS } from "../constants";
import {
  AggregationMethodWithBots,
  AggregationQuestionWithBots,
} from "../types";

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
  const [selectedAggregationMethods, setSelectedAggregationMethods] = useState<
    AggregationMethodWithBots[]
  >([]);
  const [aggregationData, setAggregationData] =
    useState<AggregationQuestionWithBots | null>(null);

  const onFetchAggregations = useCallback(
    async (aggregationOptionId: AggregationMethodWithBots) => {
      const aggregationOption =
        AGGREGATION_EXPLORER_OPTIONS.find(
          (option) => option.id === aggregationOptionId
        ) ?? AGGREGATION_EXPLORER_OPTIONS[0];
      const { value: aggregationMethod, includeBots } = aggregationOption;

      if (selectedAggregationMethods.includes(aggregationOptionId)) {
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
        setSelectedAggregationMethods((prev) => [...prev, aggregationOptionId]);
      } catch (err) {
        logError(err);
      }
    },
    [aggregationData, postId, questionId, selectedAggregationMethods]
  );

  return activeTab ? (
    <AggregationsTab
      activeTab={activeTab}
      aggregationData={aggregationData}
      onFetchData={onFetchAggregations}
    />
  ) : (
    <AggregationsDrawer
      onTabChange={onTabChange}
      onFetchData={onFetchAggregations}
      aggregationData={aggregationData}
    />
  );
};
