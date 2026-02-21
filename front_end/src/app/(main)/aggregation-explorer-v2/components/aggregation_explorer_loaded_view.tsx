"use client";

import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useMemo, useState } from "react";

import Button from "@/components/ui/button";
import { MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";

import AggregationGraphPanel from "./aggregation_graph_panel";
import AggregationMethodSelector from "./aggregation_method_selector";
import QuestionMetadata from "./question_metadata";
import SubQuestionSelector from "./sub_question_selector";
import {
  V2_AGGREGATION_OPTIONS,
  buildBaseLabel,
  buildChips,
  buildConfigId,
  useAggregationData,
} from "../hooks/aggregation-data";
import {
  useSelectedConfigsState,
  useSubQuestionState,
} from "../hooks/query-state";
import { AggregationExtraMethod } from "../types";
import {
  deriveQuestion,
  deriveQuestionId,
  parseSubQuestionOptions,
} from "../utils/sub-questions";

type Props = {
  postData: PostWithForecasts;
};

export default function AggregationExplorerLoadedView({ postData }: Props) {
  const subQuestionOptions = useMemo(
    () => parseSubQuestionOptions(postData),
    [postData]
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
          id: buildConfigId(AggregationExtraMethod.recency_weighted, false),
          optionId: AggregationExtraMethod.recency_weighted,
        },
      ];
    }
    const methodId =
      question.default_aggregation_method as unknown as AggregationExtraMethod;
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
        const option = V2_AGGREGATION_OPTIONS.find(
          (item) => item.id === config.optionId
        );
        if (!option) {
          return [];
        }

        const method = methods.find((m) => m.id === config.id);
        const baseLabel = buildBaseLabel(option);
        const chips = buildChips(config);
        return {
          id: config.id,
          label: baseLabel,
          chips,
          enabled: config.enabled !== false,
          activeColor: activeColorById.get(config.id)?.DEFAULT,
          isLoading: method?.isPending ?? false,
          isError: method?.isError ?? false,
          isNoData: method?.isNoData ?? false,
        };
      }),
    [selectedConfigs, activeColorById, methods]
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
    optionId: AggregationExtraMethod;
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

  return (
    <main className="mx-auto min-h-[calc(90vh-120px)] w-full px-4 py-8 lg:px-20">
      <section className="mx-auto w-full max-w-[1352px]">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-1">
          <Button
            href="/aggregation-explorer-v2"
            variant="text"
            className="px-0"
          >
            {"<- Aggregation Explorer"}
          </Button>
          <QuestionMetadata postData={postData} question={question} />
        </div>
        <h1 className="mt-1 text-balance text-2xl font-semibold text-blue-900 dark:text-blue-900-dark sm:text-3xl">
          {postData.title}
          <Link
            href={`/questions/${postData.id}`}
            className="ml-2 inline-flex align-baseline text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400"
          >
            <FontAwesomeIcon
              icon={faArrowUpRightFromSquare}
              className="text-sm"
            />
          </Link>
        </h1>

        {needsSubSelection && (
          <SubQuestionSelector
            options={subQuestionOptions}
            value={selectedSubQuestionOption}
            onChange={setSelectedSubQuestionOption}
          />
        )}

        {shouldFetchData ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside>
              <AggregationMethodSelector
                listItems={listItems}
                onToggleEnabled={handleToggle}
                onRemoveSelected={handleRemoveSelected}
                onHoverOption={setHoveredId}
                onAddConfigured={handleAddConfigured}
                defaultIncludeBots={
                  question?.include_bots_in_aggregates ?? false
                }
              />
            </aside>
            <section>
              <AggregationGraphPanel
                methods={methods}
                mergedData={mergedData}
                isAnyPending={isAnyPending}
                hasAnyError={hasAnyError}
                hoveredId={hoveredId}
                onHoverOption={setHoveredId}
                colorById={activeColorById}
                selectedSubQuestionOption={selectedSubQuestionOption}
                optionIndex={optionIndex}
              />
            </section>
          </div>
        ) : (
          <p className="mt-6 text-sm text-gray-600 dark:text-gray-600-dark">
            {isMultipleChoice
              ? "Select a choice above to view aggregations."
              : "Select a subquestion above to view aggregations."}
          </p>
        )}
      </section>
    </main>
  );
}
