"use client";

import {
  faMagnifyingGlass,
  faXmark,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Input } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, FormEvent, useCallback, useEffect, useState } from "react";

import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { AggregationExplorerParams } from "@/services/aggregation_explorer";
import { SearchParams } from "@/types/navigation";
import {
  AggregationQuestion,
  AggregationMethod,
  aggregationMethodsArray,
} from "@/types/question";
import { logError } from "@/utils/errors";
import { parseQuestionId } from "@/utils/questions";

import AggregationsTab from "./aggregation_tab";
import AggregationsDrawer from "./aggregations_drawer";
import AggregationMethodsPicker from "./aggregations_picker";
import { fetchAggregations } from "../actions";

type Props = { searchParams: SearchParams };

const Explorer: FC<Props> = ({ searchParams }) => {
  const { include_bots, post_id, question_id, aggregation_methods } =
    searchParams;
  const router = useRouter();
  const t = useTranslations();
  const [data, setData] = useState<AggregationQuestion | null>(null);
  const [activeTab, setActiveTab] = useState<AggregationMethod | null>(null);
  const initialInputText = question_id
    ? `/questions/${post_id}/?sub-question=${question_id}`
    : post_id
      ? `/questions/${post_id}/`
      : "";
  const [inputText, setInputText] = useState<string>(initialInputText);
  const [includeBots, setIncludeBots] = useState<boolean>(
    include_bots === "true"
  );
  const [aggregationMethods, setAggregationMethods] = useState<
    AggregationMethod[]
  >(
    typeof aggregation_methods === "string"
      ? ([...aggregation_methods?.split(",")] as [AggregationMethod])
      : []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async ({
      postId,
      questionId,
      includeBots,
      aggregationMethods,
    }: AggregationExplorerParams) => {
      setLoading(true);
      setError(null);
      try {
        console.log("fetching data", postId, questionId, includeBots);
        const response = await fetchAggregations({
          postId,
          questionId,
          includeBots,
          aggregationMethods,
        });
        setData(response);
      } catch (err) {
        logError(err);
        setError("Failed to fetch data. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (include_bots) {
      setIncludeBots(include_bots === "true");
    }
    console.log(question_id, include_bots);

    if (!!post_id && !!include_bots) {
      const parsedInput = parseQuestionId(inputText as string);
      if (parsedInput.postId === null) {
        setError("Invalid question url or id");
        return;
      }

      fetchData({
        postId: parsedInput.postId,
        questionId: parsedInput.questionId,
        includeBots: include_bots === "true",
        aggregationMethods: aggregation_methods as string,
      });
    }
  }, [aggregation_methods, fetchData, include_bots, question_id]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedInput = parseQuestionId(inputText as string);
    if (parsedInput.postId === null) {
      setError("Invalid question url or id");
      return;
    }
    const params = new URLSearchParams({
      post_id: parsedInput.postId.toString(),
      question_id: parsedInput.questionId?.toString() || "",
      include_bots: includeBots.toString(),
    });

    if (
      !!aggregationMethods.length &&
      aggregationMethods.length < aggregationMethodsArray.length
    ) {
      params.append("aggregation_methods", aggregationMethods.join(","));
    }

    router.push(`/aggregation-explorer?${params.toString()}`);
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingIndicator />;
    }
    if (error) {
      return <p className="text-center text-red-600">{error}</p>;
    }
    if (data) {
      return (
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
      );
    }

    return null;
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <p className="text-center text-xl"> Enter questions ID or URL </p>
        <p className="mt-2 text-center text-sm">
          {" "}
          If selecting a subquestion, please enter the full url e.g.
          /questions/123/?sub-question=456.{" "}
        </p>
        <div className="m-auto w-full max-w-[500px]">
          <div className="relative m-auto flex w-full rounded-full text-sm text-gray-900 dark:text-gray-900-dark">
            <Input
              name="search"
              type="search"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full cursor-default overflow-hidden rounded border border-gray-500 bg-white p-3 pr-10 text-left text-sm leading-5 text-gray-900 focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 dark:bg-blue-950 dark:text-gray-200 sm:text-sm"
            />
            <span className="absolute inset-y-0 right-0 inline-flex h-full justify-center">
              {!!inputText && (
                <Button
                  variant="text"
                  onClick={() => setInputText("")}
                  type="button"
                  className="-mr-1.5"
                  aria-label="Clear"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </Button>
              )}
            </span>
          </div>
          <Checkbox
            checked={includeBots}
            onChange={(checked) => setIncludeBots(checked)}
            label="Include bots"
            className="m-4 mr-0"
          />
          <AggregationMethodsPicker
            methods={aggregationMethods}
            onChange={setAggregationMethods}
          />
          <Button
            variant="primary"
            type="submit"
            aria-label="Search"
            className="m-auto mt-4 w-full !rounded border-gray-500 bg-blue-200 dark:!bg-blue-700 dark:text-white"
          >
            {t("search")}
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </Button>
        </div>
      </form>

      {renderContent()}
    </>
  );
};

export default Explorer;
