"use client";

import {
  faMagnifyingGlass,
  faXmark,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Input } from "@headlessui/react";
import { saveAs } from "file-saver";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, FormEvent, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import Select from "@/components/ui/select";
import { SearchParams } from "@/types/navigation";
import { Post, PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { logError } from "@/utils/errors";
import { base64ToBlob } from "@/utils/files";
import { parseQuestionId } from "@/utils/questions";

import { AggregationWrapper } from "./aggregation_wrapper";
import { getPostZipData } from "../../questions/actions";
import { fetchPost, fetchQuestion } from "../actions";
import { AGGREGATION_EXPLORER_OPTIONS } from "../constants";
import { AggregationMethodWithBots } from "../types";
type Props = { searchParams: SearchParams };

const Explorer: FC<Props> = ({ searchParams }) => {
  const { post_id, question_id } = searchParams;
  const router = useRouter();
  const t = useTranslations();
  const [data, setData] = useState<
    QuestionWithForecasts | PostWithForecasts | null
  >(null);
  const [subQuestionOptions, setSubQuestionOptions] = useState<
    string[] | number[]
  >([]);
  const [activeTab, setActiveTab] = useState<AggregationMethodWithBots | null>(
    null
  );
  const initialInputText = post_id?.toString() ?? "";
  const [inputText, setInputText] = useState<string>(initialInputText);
  const [selectedSubQuestionId, setSelectedSubQuestionId] = useState<
    string | null
  >(question_id ? question_id.toString().replaceAll("_", " ") : null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPostData = useCallback(
    async (postId: number, questionId?: number) => {
      setData(null);
      setError(null);
      setLoading(true);
      try {
        const postData = await fetchPost(postId);
        // TODO: adjust for MC questions after backend is updated
        if (
          !!postData.group_of_questions ||
          !!postData.conditional ||
          postData.question?.type === QuestionType.MultipleChoice
        ) {
          setSubQuestionOptions(parseSubQuestions(postData));
          if (
            questionId &&
            postData.question?.type !== QuestionType.MultipleChoice
          ) {
            const questionData = await fetchQuestion(questionId);
            setData(questionData);
          } else if (
            questionId !== undefined &&
            postData.question?.type === QuestionType.MultipleChoice
          ) {
            setData(postData);
          }
        } else {
          setData(postData);
        }
      } catch (err) {
        logError(err);
        setError("Failed to fetch data. Please provide a valid post id");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (subQuestionOptions.length > 0) {
      setSubQuestionOptions([]);
      setSelectedSubQuestionId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText]);

  useEffect(() => {
    if (!!post_id) {
      setError(null);
      setActiveTab(null);
      const parsedInput = parseQuestionId(inputText as string);
      if (parsedInput.postId === null) {
        setError("Invalid question url or id");
        return;
      }
      // TODO: adjust for MC questions after backend is updated
      fetchPostData(
        Number(parsedInput.postId),
        !!question_id ? Number(question_id) : undefined
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post_id, question_id]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedInput = parseQuestionId(inputText as string);
    if (parsedInput.postId === null) {
      setError("Invalid question url or id");
      return;
    }
    const params = new URLSearchParams({
      post_id: parsedInput.postId.toString(),
      question_id: selectedSubQuestionId?.toString().replaceAll(" ", "_") || "",
    });

    router.push(`/aggregation-explorer?${params.toString()}`);
  };

  // API support load data only for post_id - it returns NOT_FOUND for specific question_id
  const handleDownloadQuestionData = async () => {
    try {
      if (!data) {
        return;
      }
      const postId = "post_id" in data ? data.post_id : data.id;
      const base64 = await getPostZipData(postId);
      const blob = base64ToBlob(base64);
      const filename = `${data.title.replaceAll(" ", "_")}.zip`;
      saveAs(blob, filename);
    } catch (error) {
      toast.error(t("downloadQuestionDataError") + error);
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
                className="absolute left-0 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full"
                onClick={() => setActiveTab(null)}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </Button>
            )}
            <div className="ml-12">
              <h1 className="text-xl leading-tight sm:text-2xl">
                {data.title}
              </h1>
              <Button
                variant="text"
                onClick={handleDownloadQuestionData}
                className="cursor-pointer p-0 text-sm text-gray-500 underline dark:text-gray-500-dark"
              >
                {t("downloadQuestionData")}
              </Button>
            </div>
          </div>
          {activeTab && (
            <p className="w-fit bg-gray-400 p-2 dark:bg-gray-400-dark">
              {
                AGGREGATION_EXPLORER_OPTIONS.find(
                  (option) => option.id === activeTab
                )?.label
              }
            </p>
          )}
          <AggregationWrapper
            activeTab={activeTab}
            onTabChange={setActiveTab}
            postId={data.id}
            questionId={selectedSubQuestionId}
          />
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
          If selecting a subquestion, firstly enter post id or url and then
          select subquestion ID
        </p>
        <div className="m-auto w-full max-w-[500px]">
          <div className="relative m-auto flex w-full rounded-full text-sm text-gray-900 dark:text-gray-900-dark">
            <Input
              name="search"
              type="search"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setSubQuestionOptions([]);
                setSelectedSubQuestionId(null);
              }}
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
          {subQuestionOptions.length > 0 && (
            <div>
              <p>Select a subquestion</p>
              <Select
                className="w-full rounded p-3 text-sm leading-5"
                defaultValue={selectedSubQuestionId?.toString() || ""}
                options={[
                  {
                    value: "",
                    label: "Select subquestion ID",
                    disabled: true,
                  },
                  ...subQuestionOptions.map((option) => ({
                    value: option,
                    label: option.toString(),
                  })),
                ]}
                onChange={(event) =>
                  setSelectedSubQuestionId(event.target.value)
                }
              />
            </div>
          )}
          <Button
            variant="primary"
            type="submit"
            aria-label="Search"
            className="m-auto mt-4 w-full !rounded border-gray-500 bg-blue-200 text-black hover:text-white dark:!bg-blue-700 dark:text-white"
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

function parseSubQuestions(data: Post) {
  if (data.group_of_questions) {
    return data.group_of_questions.questions.map((group) => group.id);
  } else if (data.conditional) {
    return [data.conditional.question_yes.id, data.conditional.question_no.id];
  } else if (data.question?.type === QuestionType.MultipleChoice) {
    return data.question.options ?? [];
  }
  return [];
}
export default Explorer;
