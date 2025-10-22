"use client";

import {
  faArrowLeft,
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Input } from "@headlessui/react";
import { isNil } from "lodash";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, FormEvent, useCallback, useEffect, useState } from "react";

import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import SectionToggle from "@/components/ui/section_toggle";
import Select from "@/components/ui/select";
import { useAuth } from "@/contexts/auth_context";
import useSearchParams from "@/hooks/use_search_params";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { SearchParams } from "@/types/navigation";
import { Post, PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { logError } from "@/utils/core/errors";
import { parseQuestionId } from "@/utils/questions/helpers";

import { AggregationWrapper } from "./aggregation_wrapper";
import { AggregationExtraMethod } from "../types";

function sanitizeUserIds(input: string): number[] {
  if (!input) return [];
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && isFinite(n));
}

type Props = { searchParams: SearchParams };

const Explorer: FC<Props> = ({ searchParams }) => {
  const { post_id, question_id, option } = searchParams;
  const { setParam, deleteParam, shallowNavigateToSearchParams } =
    useSearchParams();
  const router = useRouter();
  const t = useTranslations();
  const [data, setData] = useState<
    QuestionWithForecasts | PostWithForecasts | null
  >(null);

  // number for group or conditional
  // string for MC
  const [subQuestionOptions, setSubQuestionOptions] = useState<
    { value: string | number; label: string }[]
  >([]);
  const [selectedSubQuestionOption, setSelectedSubQuestionOption] = useState<
    string | number | null
  >(parseSubQuestionOption(question_id, option));

  const [activeTab, setActiveTab] = useState<AggregationExtraMethod | null>(
    null
  );
  const [postInputText, setPostInputText] = useState<string>(
    post_id?.toString() ?? ""
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [userIdsText, setUserIdsText] = useState<string>(
    (Array.isArray(searchParams.user_ids)
      ? searchParams.user_ids[0]
      : searchParams.user_ids
    )?.toString() || ""
  );
  const [joinedBeforeDate, setJoinedBeforeDate] = useState<string>(
    (Array.isArray(searchParams.joined_before_date)
      ? searchParams.joined_before_date[0]
      : searchParams.joined_before_date) || ""
  );

  // clear subquestion options when post id input changes
  useEffect(() => {
    if (subQuestionOptions.length > 0) {
      setSubQuestionOptions([]);
      setSelectedSubQuestionOption(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postInputText]);

  useEffect(() => {
    if (!!post_id) {
      setError(null);
      setActiveTab(null);
      const parsedInput = parseQuestionId(postInputText);
      if (parsedInput.postId === null) {
        setError("Invalid question url or id");
        return;
      }

      const fetchPostData = async (
        postId: number,
        questionId?: number,
        option?: string
      ) => {
        setData(null);
        setError(null);
        setLoading(true);

        // fetch post data, subquestion options and question data if needed
        try {
          const postData = await ClientPostsApi.getPost(postId, false);
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
              const questionData = await ClientPostsApi.getQuestion(
                questionId,
                false
              );
              setData(questionData);
              return;
            } else if (
              option &&
              postData.question?.type === QuestionType.MultipleChoice
            ) {
              setData(postData);
              return;
            }
          }
          setData(postData);
        } catch (err) {
          logError(err);
          setError("Failed to fetch data. Please provide a valid post id");
        } finally {
          setLoading(false);
        }
      };
      fetchPostData(
        parsedInput.postId,
        !!question_id ? Number(question_id) : undefined,
        !!option ? option.toString() : undefined
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedInput = parseQuestionId(postInputText);
    if (parsedInput.postId === null) {
      setError("Invalid question url or id");
      return;
    }
    const params = new URLSearchParams({
      post_id: parsedInput.postId.toString(),
      ...(typeof selectedSubQuestionOption === "number"
        ? { question_id: selectedSubQuestionOption?.toString() }
        : {}),
      ...(typeof selectedSubQuestionOption === "string"
        ? { option: selectedSubQuestionOption.replaceAll(" ", "_") }
        : {}),
    });

    const cleanedIds = sanitizeUserIds(userIdsText);
    if (cleanedIds.length) {
      params.set("user_ids", cleanedIds.join(","));
    }

    if (joinedBeforeDate.trim()) {
      params.set("joined_before_date", joinedBeforeDate);
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

    if (
      data &&
      shouldRenderAggregation(data, parseSubQuestionOption(question_id, option))
    ) {
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
                {isMultipleChoiceQuestion(data) && (
                  <span> ({selectedSubQuestionOption})</span>
                )}
              </h1>
            </div>
          </div>

          <AggregationWrapper
            activeTab={activeTab}
            onTabChange={setActiveTab}
            data={data}
            selectedSubQuestionOption={selectedSubQuestionOption}
            joinedBeforeDate={joinedBeforeDate || undefined}
            additionalParams={{ userIds: sanitizeUserIds(userIdsText) }}
          />
        </>
      );
    }

    return null;
  };

  const handleSubQuestionSelectChange = useCallback(
    (value: string) => {
      if (value === "") {
        setSelectedSubQuestionOption(null);
        return;
      }

      const questionIdValue = Number(value);
      if (!isNaN(questionIdValue) && data && !("question" in data)) {
        setSelectedSubQuestionOption(questionIdValue);
        return;
      }
      setSelectedSubQuestionOption(value);
      if (
        shouldRenderAggregation(
          data,
          parseSubQuestionOption(question_id, option)
        )
      ) {
        deleteParam("question_id", false);
        setParam("option", value.replaceAll(" ", "_"), false);
        shallowNavigateToSearchParams();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, question_id, option]
  );

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
              value={postInputText}
              onChange={(e) => {
                setPostInputText(e.target.value);
                setSubQuestionOptions([]);
                setSelectedSubQuestionOption(null);
              }}
              className="w-full cursor-default overflow-hidden rounded border border-gray-500 bg-white p-3 pr-10 text-left text-sm leading-5 text-gray-900 focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 dark:bg-blue-950 dark:text-gray-200 sm:text-sm"
            />
            <span className="absolute inset-y-0 right-0 inline-flex h-full justify-center">
              {!!postInputText && (
                <Button
                  variant="text"
                  onClick={() => setPostInputText("")}
                  type="button"
                  className="-mr-1.5"
                  aria-label="Clear"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </Button>
              )}
            </span>
          </div>
          <div>{!!postInputText && data?.title}</div>
          <SubQuestionSelect
            options={subQuestionOptions}
            value={selectedSubQuestionOption}
            onChange={handleSubQuestionSelectChange}
          />
          {
            // TODO: move "include bots" to here instead of in each tab
            // user ids should only be avilable to staff or whitelisted users
            // copy logic and parameters from the download data modal
            <div className="mt-3">
              <SectionToggle
                title="Advanced options"
                variant="light"
                defaultOpen={!!userIdsText || !!joinedBeforeDate}
              >
                <div className="space-y-3">
                  {user?.is_staff && (
                    <div>
                      <label className="mb-1 block text-sm">
                        User Ids (comma-separated integers). Will act as if
                        these are the only participants.
                      </label>
                      <Input
                        name="user_ids"
                        type="text"
                        value={userIdsText}
                        onChange={(e) => setUserIdsText(e.target.value)}
                        className="w-full cursor-default overflow-hidden rounded border border-gray-500 bg-white p-2 text-left text-sm leading-5 text-gray-900 focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 dark:bg-blue-950 dark:text-gray-200 sm:text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-sm">
                      Filter for users who joined before date. Only effects
                      Joined Before aggregation.
                    </label>
                    <Input
                      name="joined_before_date"
                      type="date"
                      value={joinedBeforeDate}
                      onChange={(e) => setJoinedBeforeDate(e.target.value)}
                      className="w-full cursor-default overflow-hidden rounded border border-gray-500 bg-white p-2 text-left text-sm leading-5 text-gray-900 focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 dark:bg-blue-950 dark:text-gray-200 sm:text-sm"
                    />
                  </div>
                </div>
              </SectionToggle>
            </div>
          }
          <Button
            variant="primary"
            type="submit"
            aria-label="Search"
            className="m-auto mt-4 w-full rounded border-gray-500 bg-blue-200 text-black hover:bg-blue-700 hover:text-white dark:border-gray-500-dark dark:bg-blue-200-dark dark:text-white dark:hover:bg-blue-300-dark"
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

const SubQuestionSelect: FC<{
  options: { value: string | number; label: string }[];
  value: string | number | null;
  onChange: (value: string) => void;
}> = ({ options, value, onChange }) => {
  if (!options.length) {
    return null;
  }

  const isMultipleChoicePost = options.some((o) => typeof o.value === "string");
  return (
    <div>
      <p>{isMultipleChoicePost ? "Select a choice" : "Select a subquestion"}</p>
      <Select
        className="w-full rounded p-3 text-sm leading-5"
        defaultValue={value?.toString() || ""}
        options={[
          {
            value: "",
            label: isMultipleChoicePost
              ? "Select a choice"
              : "Select subquestion",
            disabled: true,
          },
          ...options.map((option) => ({
            value: option.value,
            label: option.label,
          })),
        ]}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

function parseSubQuestions(
  data: Post
): { value: string | number; label: string }[] {
  if (data.group_of_questions) {
    return data.group_of_questions.questions.map((question) => ({
      value: question.id,
      label: question.label,
    }));
  } else if (data.conditional) {
    return [
      {
        value: data.conditional.question_yes.id,
        label: "if yes",
      },
      {
        value: data.conditional.question_no.id,
        label: "if no",
      },
    ];
  } else if (data.question?.type === QuestionType.MultipleChoice) {
    return (
      data.question.options?.map((option) => ({
        value: option,
        label: option,
      })) || []
    );
  }
  return [];
}

function isMultipleChoiceQuestion(
  data: QuestionWithForecasts | PostWithForecasts | null
) {
  return (
    data &&
    "question" in data &&
    data.question?.type === QuestionType.MultipleChoice
  );
}

function parseSubQuestionOption(
  question_id: string | string[] | undefined,
  option: string | string[] | undefined
) {
  return !isNaN(Number(question_id?.toString()))
    ? Number(question_id?.toString())
    : option?.toString().replaceAll("_", " ") ?? null;
}

function shouldRenderAggregation(
  data: QuestionWithForecasts | PostWithForecasts | null,
  subQuestionOption: string | number | null
) {
  if (!data) {
    return false;
  }

  if (
    (isMultipleChoiceQuestion(data) ||
      "group_of_questions" in data ||
      "conditional" in data) &&
    isNil(subQuestionOption)
  ) {
    return false;
  }

  return true;
}

export default Explorer;
