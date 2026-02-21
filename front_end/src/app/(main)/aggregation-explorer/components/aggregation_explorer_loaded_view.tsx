"use client";

import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

import Button from "@/components/ui/button";
import { PostWithForecasts } from "@/types/post";

import AggregationGraphPanel from "./aggregation_graph_panel";
import AggregationMethodSelector from "./aggregation_method_selector";
import QuestionMetadata from "./question_metadata";
import SubQuestionSelector from "./sub_question_selector";
import { useExplorerState } from "../hooks/explorer-state";

type Props = {
  postData: PostWithForecasts;
};

export default function AggregationExplorerLoadedView({ postData }: Props) {
  const {
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
  } = useExplorerState(postData);

  return (
    <main className="mx-auto min-h-[calc(90vh-120px)] w-full px-4 py-8 lg:px-20">
      <section className="mx-auto w-full max-w-[1352px]">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-1">
          <Button href="/aggregation-explorer" variant="text" className="px-0">
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

        {needsSubSelection ? (
          <SubQuestionSelector
            options={subQuestionOptions}
            value={selectedSubQuestionOption}
            onChange={setSelectedSubQuestionOption}
          />
        ) : null}

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
