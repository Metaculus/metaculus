"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import LocalDaytime from "@/components/ui/local_daytime";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { AggregationMethod } from "@/types/question";

import IncludeBotsInfo from "./question_info/include_bots_info";
import QuestionWeightInfo from "./question_info/question_weight_info";

type Props = {
  postData: PostWithForecasts;
};

const SidebarQuestionInfo: FC<Props> = ({ postData }) => {
  const t = useTranslations();

  const isUpcoming = new Date(postData.open_time).getTime() > Date.now();
  return (
    <div className="flex flex-col items-start gap-4 self-stretch @container">
      <div className="flex flex-col justify-between gap-3 self-stretch @lg:grid @lg:grid-cols-4 @lg:gap-1 @lg:gap-y-5">
        <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
          <span className="text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
            {t("authorWithCount", { count: postData.coauthors.length > 0 })}:
          </span>
          <div className="text-metac-blue-700 dark:text-metac-blue-700-dark flex min-w-0 shrink flex-col items-end gap-1 font-medium @lg:items-start">
            <Link
              className="flex min-w-0 shrink flex-col items-end gap-1 text-sm font-medium leading-4 text-blue-700 @lg:items-start dark:text-blue-700-dark"
              href={`/accounts/profile/${postData.author_id}`}
            >
              {postData.author_username}
            </Link>

            {postData.coauthors.map((coauthor) => (
              <Link
                className="flex min-w-0 shrink flex-col items-end gap-1 text-sm font-medium leading-4 text-blue-700 @lg:items-start dark:text-blue-700-dark"
                href={`/accounts/profile/${coauthor.id}`}
                key={`coauthor-${coauthor.id}`}
              >
                {coauthor.username}
              </Link>
            ))}
          </div>
        </div>

        {postData.status === PostStatus.PENDING && (
          <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
            <span className="text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
              {t("inReview")}:
            </span>
            <span className="text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
              {postData.curation_status_updated_at ? (
                <LocalDaytime date={postData.curation_status_updated_at} />
              ) : (
                "-"
              )}
            </span>
          </div>
        )}

        {(postData.open_time || postData.published_at) && (
          <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
            <span className="text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
              {t(isUpcoming ? "opens" : "opened")}:
            </span>
            <span className="text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
              <LocalDaytime date={postData.open_time} />
            </span>
          </div>
        )}

        <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
          <span className="text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
            {postData.status === PostStatus.CLOSED ? t("closed") : t("closes")}:
          </span>
          <span className="text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
            {postData.scheduled_close_time && (
              <LocalDaytime date={postData.scheduled_close_time} />
            )}
          </span>
        </div>

        <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
          <span className="text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
            {postData.status === PostStatus.RESOLVED
              ? t("resolved")
              : t("scheduledResolution")}
            :
          </span>
          <span className="text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
            <LocalDaytime
              date={
                (postData.status === PostStatus.RESOLVED &&
                  postData.actual_resolve_time) ||
                postData.scheduled_resolve_time
              }
            />
          </span>
        </div>

        {!!postData.question?.spot_scoring_time && (
          <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
            <span className="text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
              {t("spotScoingTime")}:
            </span>
            <span className="text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
              {<LocalDaytime date={postData.question?.spot_scoring_time} />}
            </span>
          </div>
        )}

        {postData.question &&
          postData.question?.default_aggregation_method !==
            AggregationMethod.recency_weighted && (
            <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
              <span className="text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
                {t("cpAggregationMethod")}:
              </span>
              <span className="text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
                {t(postData.question.default_aggregation_method)}
              </span>
            </div>
          )}

        <QuestionWeightInfo
          questionWeight={postData.question?.question_weight}
        />
        <IncludeBotsInfo
          includeBotsInAggregate={postData.question?.include_bots_in_aggregates}
        />
      </div>
    </div>
  );
};

export default SidebarQuestionInfo;
