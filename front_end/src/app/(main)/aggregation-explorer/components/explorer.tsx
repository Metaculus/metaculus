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
import { FC, FormEvent, useEffect, useState } from "react";

import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { AggregationExplorerParams } from "@/services/aggregation_explorer";
import { SearchParams } from "@/types/navigation";
import { AggregationQuestion, AggregationMethod } from "@/types/question";

import AggregationsTab from "./aggregation_tab";
import AggregationsDrawer from "./aggregations_drawer";
import AggregationMethodsPicker, {
  aggregationMethodsArray,
} from "./aggregations_picker";
import { fetchAggregations } from "../actions";

type Props = { searchParams: SearchParams };

const Explorer: FC<Props> = ({ searchParams }) => {
  const { include_bots, question_id, aggregation_methods } = searchParams;
  const router = useRouter();
  const t = useTranslations();
  const [data, setData] = useState<AggregationQuestion | null>(null);
  const [activeTab, setActiveTab] = useState<AggregationMethod | null>(null);
  const [questionId, setQuestionId] = useState<string>(
    question_id?.toString() || ""
  );
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

  useEffect(() => {
    const { question_id, include_bots, aggregation_methods } = searchParams;
    if (question_id) {
      setQuestionId(question_id as string);
    }
    if (include_bots) {
      setIncludeBots(include_bots === "true");
    }

    if (!!question_id && !!include_bots) {
      const parsedQuestionId = parseQuestionId(question_id as string);
      if (parsedQuestionId === false) {
        setError("Invalid question url or id");
        return;
      }
      
      fetchData({
        questionId: parsedQuestionId as string,
        includeBots: include_bots === "true",
        aggregationMethods: aggregation_methods as string,
      });
    }
  }, [searchParams]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedQuestionId = parseQuestionId(questionId as string);
    if (parsedQuestionId === false) {
      setError("Invalid question url or id");
      return;
    }
    const params = new URLSearchParams({
      question_id: parsedQuestionId,
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
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
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
        <div className="m-auto w-full max-w-[500px]">
          <div className="relative m-auto flex w-full rounded-full text-sm text-gray-900 dark:text-gray-900-dark">
            <Input
              name="search"
              type="search"
              value={questionId}
              onChange={(e) => setQuestionId(e.target.value)}
              className="w-full cursor-default overflow-hidden rounded border border-gray-500 bg-white p-3 pr-10 text-left text-sm leading-5 text-gray-900 focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 dark:bg-blue-950 dark:text-gray-200 sm:text-sm"
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

function parseQuestionId(questionUrlOrId: string) {
  const id = Number(questionUrlOrId);
  if (!isNaN(id)) {
    return id.toString();
  }
  const urlPattern = /\/questions\/(\d+)\//;
  const match = questionUrlOrId.match(urlPattern);
  if (match && match[1]) {
    return match[1];
  }
  return false;
}

export default Explorer;
