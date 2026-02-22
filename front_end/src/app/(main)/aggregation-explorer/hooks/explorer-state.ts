"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";

import {
  buildBaseLabel,
  buildChips,
  buildConfigId,
  useAggregationData,
} from "./aggregation-data";
import { useSelectedConfigsState, useSubQuestionState } from "./query-state";
import { AGGREGATION_OPTION_BY_ID } from "../constants";
import { AggregationMethod } from "../types";
import {
  deriveQuestion,
  deriveQuestionId,
  parseSubQuestionOptions,
} from "../utils/sub-questions";

export function useExplorerState(postData: PostWithForecasts) {
  const t = useTranslations();
  const subQuestionOptions = useMemo(
    () => parseSubQuestionOptions(t, postData),
    [t, postData]
  );
  const needsSubSelection = subQuestionOptions.length > 0;
  const isMultipleChoice =
    "question" in postData &&
    postData.question?.type === QuestionType.MultipleChoice;

  const [selectedSubQuestionOption, setSelectedSubQuestionOption] =
    useSubQuestionState();

  const question = deriveQuestion(postData, selectedSubQuestionOption);
  const questionId = deriveQuestionId(postData, selectedSubQuestionOption);

  const optionIndex = useMemo(() => {
    if (
      typeof selectedSubQuestionOption === "string" &&
      "question" in postData &&
      postData.question?.options
    ) {
      const idx = postData.question.options.findIndex(
        (o) => o === selectedSubQuestionOption
      );
      return idx === -1 ? 0 : idx;
    }
    return 0;
  }, [selectedSubQuestionOption, postData]);

  const defaultConfigs = useMemo(() => {
    if (!question) {
      return [
        {
          id: buildConfigId(AggregationMethod.recency_weighted, false),
          optionId: AggregationMethod.recency_weighted,
        },
      ];
    }
    const methodId =
      question.default_aggregation_method as unknown as AggregationMethod;
    const includeBots = question.include_bots_in_aggregates;
    return [
      {
        id: buildConfigId(methodId, includeBots),
        optionId: methodId,
        includeBots: includeBots || undefined,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  const [selectedConfigs, setSelectedConfigs] =
    useSelectedConfigsState(defaultConfigs);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const shouldFetchData =
    !needsSubSelection || selectedSubQuestionOption !== null;

  const { methods, mergedData, isAnyPending, hasAnyError } = useAggregationData(
    {
      postId: postData.id,
      questionId: shouldFetchData ? questionId : undefined,
      selectedConfigs: shouldFetchData ? selectedConfigs : [],
    }
  );

  const activeColorById = useMemo(() => {
    const result = new Map<
      string,
      (typeof MULTIPLE_CHOICE_COLOR_SCALE)[number]
    >();
    selectedConfigs.forEach((config, index) => {
      const color = MULTIPLE_CHOICE_COLOR_SCALE[index];
      if (color) {
        result.set(config.id, color);
      }
    });
    return result;
  }, [selectedConfigs]);

  const listItems = useMemo(
    () =>
      selectedConfigs.flatMap((config) => {
        const option = AGGREGATION_OPTION_BY_ID.get(config.optionId);
        if (!option) return [];

        const method = methods.find((m) => m.id === config.id);
        return {
          id: config.id,
          label: buildBaseLabel(t, option),
          chips: buildChips(t, config),
          enabled: config.enabled !== false,
          activeColor: activeColorById.get(config.id)?.DEFAULT,
          isLoading: method?.isPending ?? false,
          isError: method?.isError ?? false,
          isNoData: method?.isNoData ?? false,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedConfigs, activeColorById, methods, t]
  );

  const handleToggle = (id: string) => {
    void setSelectedConfigs((prev) =>
      prev.map((config) =>
        config.id === id
          ? { ...config, enabled: config.enabled === false }
          : config
      )
    );
  };

  const handleAddConfigured = (payload: {
    optionId: AggregationMethod;
    joinedBeforeDate?: string;
    userIds?: number[];
    includeBots?: boolean;
  }) => {
    const configId = buildConfigId(
      payload.optionId,
      payload.includeBots ?? false,
      payload.joinedBeforeDate,
      payload.userIds
    );
    void setSelectedConfigs((prev) => {
      if (prev.some((c) => c.id === configId)) return prev;
      return [
        ...prev,
        {
          id: configId,
          optionId: payload.optionId,
          joinedBeforeDate: payload.joinedBeforeDate,
          userIds: payload.userIds,
          includeBots: payload.includeBots,
          enabled: true,
        },
      ];
    });
  };

  const handleRemoveSelected = (id: string) => {
    void setSelectedConfigs((prev) =>
      prev.filter((config) => config.id !== id)
    );
  };

  return {
    subQuestionOptions,
    needsSubSelection,
    isMultipleChoice,
    selectedSubQuestionOption,
    setSelectedSubQuestionOption,
    question,
    optionIndex,
    shouldFetchData,
    methods,
    mergedData,
    isAnyPending,
    hasAnyError,
    hoveredId,
    setHoveredId,
    activeColorById,
    listItems,
    handleToggle,
    handleAddConfigured,
    handleRemoveSelected,
  };
}
