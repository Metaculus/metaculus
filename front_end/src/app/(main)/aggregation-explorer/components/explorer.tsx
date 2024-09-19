"use client";

import {
  faMagnifyingGlass,
  faXmark,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { FC, useEffect, useState } from "react";
import { fetchAggregations } from "../actions";
import { SearchParams } from "@/types/navigation";
import { Input } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { AggregationExplorerParams } from "@/services/aggregation_explorer";
import AggregationsDrawer from "./aggregations";
import { AggregationQuestion, Aggregations } from "@/types/question";
import AggregationsTab from "./aggregation_tab";

type Props = { searchParams: SearchParams };

const Explorer: FC<Props> = ({ searchParams }) => {
  const [data, setData] = useState<AggregationQuestion | null>(null);
  const [activeTab, setActiveTab] = useState<keyof Aggregations | null>(null);
  const [questionId, setQuestionId] = useState<string>("");
  const [includeBots, setIncludeBots] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(searchParams);
    const { question_id, include_bots, aggregation_methods } = searchParams;
    if (question_id) {
      setQuestionId(question_id as string);
    }
    if (include_bots) {
      setIncludeBots(include_bots === "true");
    }
    console.log(aggregation_methods);
    // If parameters exist, trigger data fetch
    if (!!question_id && !!include_bots) {
      fetchData({
        questionId: question_id as string,
        includeBots: include_bots === "true",
        aggregationMethods: Array.isArray(aggregation_methods)
          ? [...aggregation_methods]
          : aggregation_methods
            ? [aggregation_methods]
            : undefined,
      });
    }
  }, []);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Construct the query params
    const params = new URLSearchParams({
      question_id: questionId,
      include_bots: includeBots.toString(),
    });

    // Update the URL without reloading the page
    window.history.pushState(
      {},
      "",
      `/aggregation-explorer?${params.toString()}`
    );
    // router.push(`/aggregation-explorer?${params.toString()}`);

    // Trigger data fetch with updated parameters
    fetchData({ questionId, includeBots });
  };

  // Fetch data function (updated to handle async and state)
  const fetchData = async ({
    questionId,
    includeBots,
    aggregationMethods,
  }: AggregationExplorerParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAggregations({
        questionId,
        includeBots,
        aggregationMethods,
      });
      setData(response);
      console.log("Fetched data:", response);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <p className="text-center text-xl"> Enter questions ID or URL </p>
        <div className="m-auto w-full max-w-[500px]">
          <div className="relative m-auto flex w-full rounded-full text-sm text-gray-900 dark:text-gray-900-dark">
            <Input
              name="search"
              type="search"
              value={questionId}
              onChange={(e) => setQuestionId(e.target.value)}
              className="mx-auto block size-full rounded-full border border-blue-500 bg-gray-0 py-2 pl-3 pr-16 font-medium placeholder:text-gray-700 dark:border-blue-500 dark:bg-gray-0-dark placeholder:dark:text-gray-700-dark"
            />
            <span className="absolute inset-y-0 right-0 inline-flex h-full justify-center">
              {!!questionId && (
                <Button
                  variant="text"
                  onClick={() => setQuestionId("")}
                  type="button"
                  className="-mr-1.5"
                  aria-label="Clear"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </Button>
              )}
              <Button variant="text" type="submit" aria-label="Search">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </Button>
            </span>
          </div>
          <Checkbox
            checked={includeBots}
            onChange={(checked) => setIncludeBots(checked)}
            label="Include bots"
            className="ml-4 mt-4"
          />
        </div>
      </form>

      <div className="h-10">{loading && <LoadingIndicator />}</div>
      {error && <p className="text-center text-red-600">{error}</p>}

      {data && (
        <>
          <hr className="mb-6 border-gray-400 dark:border-gray-400-dark" />
          <div className="relative">
            {activeTab && (
              <Button
                presentationType="icon"
                className="absolute left-0 top-0 h-10"
                onClick={() => setActiveTab(null)}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </Button>
            )}
            <h1 className="ml-10 text-xl leading-tight sm:text-2xl">
              {data.title}
            </h1>
          </div>
          {activeTab ? (
            <div>
              <p className="w-fit bg-gray-400 p-2 dark:bg-gray-400-dark">
                {activeTab}
              </p>
              <AggregationsTab activeTab={activeTab} questionData={data} />
            </div>
          ) : (
            <AggregationsDrawer
              questionData={data}
              onTabChange={setActiveTab}
            />
          )}
        </>
      )}
    </>
  );
};

export default Explorer;
