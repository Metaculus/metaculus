import { FC, useCallback, useState } from "react";

import ClientAggregationExplorerApi from "@/services/api/aggregation_explorer/aggregation_explorer.client";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import { logError } from "@/utils/core/errors";

import AggregationsTab from "./aggregation_tab";
import AggregationsDrawer from "./aggregations_drawer";
import { AGGREGATION_EXPLORER_OPTIONS } from "../constants";
import { AggregationExtraMethod, AggregationExtraQuestion } from "../types";

type Props = {
  activeTab: AggregationExtraMethod | null;
  onTabChange: (activeTab: AggregationExtraMethod) => void;
  data: QuestionWithForecasts | PostWithForecasts;
  selectedSubQuestionOption: number | string | null;
  joinedBeforeDate?: string;
  additionalParams?: {
    userIds?: number[]; // Array of user IDs as a comma-separated string
  };
};

export const AggregationWrapper: FC<Props> = ({
  activeTab,
  onTabChange,
  selectedSubQuestionOption,
  data,
  joinedBeforeDate,
  additionalParams = {},
}) => {
  const postId = "post_id" in data ? data.post_id : data.id;
  const [selectedAggregationMethods, setSelectedAggregationMethods] = useState<
    AggregationExtraMethod[]
  >([]);
  const [aggregationData, setAggregationData] =
    useState<AggregationExtraQuestion | null>(null);

  const handleFetchAggregations = useCallback(
    async (aggregationOptionId: AggregationExtraMethod) => {
      const aggregationOption =
        AGGREGATION_EXPLORER_OPTIONS.find(
          (option) => option.id === aggregationOptionId
        ) ?? AGGREGATION_EXPLORER_OPTIONS[0];
      const {
        value: methodName,
        id: methodID,
        includeBots,
      } = aggregationOption;

      if (selectedAggregationMethods.includes(aggregationOptionId)) {
        return;
      }

      try {
        const adjustedQuestionId =
          selectedSubQuestionOption &&
          typeof selectedSubQuestionOption === "number" &&
          !isNaN(Number(selectedSubQuestionOption))
            ? Number(selectedSubQuestionOption)
            : undefined;
        const response = await ClientAggregationExplorerApi.getAggregations({
          postId,
          questionId: adjustedQuestionId,
          includeBots,
          aggregationMethods: methodName,
          joinedBeforeDate,
          ...additionalParams,
        });

        const fetchedAggregationData = response.aggregations[methodName];
        if (fetchedAggregationData !== undefined) {
          setAggregationData((prev) => {
            const base = prev ?? response;
            return {
              ...base,
              aggregations: {
                ...base.aggregations,
                [methodID]: fetchedAggregationData,
              },
            } as AggregationExtraQuestion;
          });
        }
        setSelectedAggregationMethods((prev) => [...prev, aggregationOptionId]);
      } catch (err) {
        logError(err);
      }
    },
    [
      selectedAggregationMethods,
      selectedSubQuestionOption,
      postId,
      joinedBeforeDate,
      additionalParams,
    ]
  );

  return activeTab ? (
    <AggregationsTab
      activeTab={activeTab}
      aggregationData={aggregationData}
      selectedSubQuestionOption={selectedSubQuestionOption}
      postId={postId}
      questionTitle={data.title}
      userIds={additionalParams.userIds}
    />
  ) : (
    <AggregationsDrawer
      onTabChange={onTabChange}
      onFetchData={handleFetchAggregations}
      aggregationData={aggregationData}
      selectedSubQuestionOption={selectedSubQuestionOption}
      joinedBeforeDate={joinedBeforeDate}
    />
  );
};
