"use client";

import { faUser, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useLocale } from "next-intl";
import { FC } from "react";

import PostStatusBadge from "@/components/post_status";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { formatResolution } from "@/utils/formatters/resolution";
import { isSuccessfullyResolved } from "@/utils/questions/resolution";

type Props = {
  postData: PostWithForecasts;
};

const QuestionMetadata: FC<Props> = ({ postData }) => {
  const locale = useLocale();

  const question =
    "question" in postData && postData.question ? postData.question : null;

  const isResolved = postData.status === PostStatus.RESOLVED;

  const formattedResolution =
    question?.resolution != null && isResolved
      ? formatResolution({
          resolution: question.resolution,
          questionType: question.type,
          locale,
          actual_resolve_time: question.actual_resolve_time ?? null,
          scaling: question.scaling,
          unit: question.unit,
        })
      : null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {question && (
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:bg-blue-900/30 dark:text-gray-400">
          {question.type}
        </span>
      )}

      <PostStatusBadge
        post={postData}
        resolution={question?.resolution ?? null}
      />

      {formattedResolution !== null && question && (
        <span
          className={
            isSuccessfullyResolved(question.resolution)
              ? "text-xs font-semibold text-purple-800 dark:text-purple-800-dark"
              : "text-xs font-semibold text-gray-700 dark:text-gray-700-dark"
          }
        >
          {formattedResolution}
        </span>
      )}

      {!!postData.nr_forecasters && (
        <span className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-700-dark">
          <FontAwesomeIcon
            icon={faUsers}
            className="text-gray-400 dark:text-gray-400-dark"
          />
          <span className="font-medium tabular-nums">
            {postData.nr_forecasters}
          </span>{" "}
          forecasters
        </span>
      )}

      <span className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-700-dark">
        <FontAwesomeIcon
          icon={faUser}
          className="text-gray-400 dark:text-gray-400-dark"
        />
        <Link
          href={`/accounts/profile/${postData.author_id}`}
          className="font-medium text-blue-700 hover:underline dark:text-blue-700-dark"
        >
          {postData.author_username}
        </Link>
      </span>
    </div>
  );
};

export default QuestionMetadata;
