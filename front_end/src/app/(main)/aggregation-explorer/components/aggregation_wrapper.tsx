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
  questionId?: number | string | null;
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

  const handleFetchAggregations = useCallback(
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
        // TODO: adjust for MC questions after backend is updated
        const adjustedQuestionId =
          questionId && !isNaN(Number(questionId))
            ? Number(questionId)
            : undefined;
        const response = await fetchAggregations({
          postId,
          questionId: adjustedQuestionId,
          includeBots,
          aggregationMethods: aggregationMethod,
        });

        const fetchedAggregationData = response.aggregations[aggregationMethod];
        if (fetchedAggregationData !== undefined) {
          setAggregationData((prev) =>
            prev
              ? ({
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
                } as AggregationQuestionWithBots)
              : ({
                  ...response,
                  ...(includeBots
                    ? {
                        bot_aggregations: {
                          [aggregationMethod]: fetchedAggregationData,
                        },
                        aggregations: {},
                      }
                    : {
                        aggregations: {
                          [aggregationMethod]: fetchedAggregationData,
                        },
                      }),
                } as AggregationQuestionWithBots)
          );
        }
        setSelectedAggregationMethods((prev) => [...prev, aggregationOptionId]);
      } catch (err) {
        logError(err);
      }
    },
    [postId, questionId, selectedAggregationMethods]
  );

  return activeTab ? (
    <AggregationsTab
      activeTab={activeTab}
      aggregationData={aggregationData}
      onFetchData={handleFetchAggregations}
    />
  ) : (
    <AggregationsDrawer
      onTabChange={onTabChange}
      onFetchData={handleFetchAggregations}
      aggregationData={aggregationData}
    />
  );
};
