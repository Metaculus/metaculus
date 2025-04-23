"use client";

import { useLocale, useTranslations } from "next-intl";
import React, { FC, useMemo } from "react";

import PostStatusIcon from "@/components/post_status/status_icon";
import { PostStatus, QuestionStatus, Resolution } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { formatRelativeDate } from "@/utils/formatters/date";

type Props = {
  resolution: Resolution | null;
  question: QuestionWithNumericForecasts;
};

const GroupQuestionResolution: FC<Props> = ({ resolution, question }) => {
  const t = useTranslations();
  const locale = useLocale();
  const { status, scheduled_close_time, actual_close_time } = question;

  const statusInfo = useMemo(() => {
    if (status === QuestionStatus.RESOLVED && actual_close_time) {
      return [
        t("resolved"),
        formatRelativeDate(locale, new Date(actual_close_time), {
          short: true,
        }),
      ];
    }

    return [];
  }, [actual_close_time, t, locale, status]);

  if (!scheduled_close_time && !actual_close_time) {
    return null;
  }

  return (
    <div className="flex flex-row items-center gap-1.5 truncate text-gray-900 dark:text-gray-900-dark">
      <PostStatusIcon
        status={PostStatus.RESOLVED}
        published_at={""}
        scheduled_close_time={scheduled_close_time}
        resolution={resolution}
      />
      <span className="whitespace-nowrap text-sm" suppressHydrationWarning>
        {statusInfo.map((part) => (
          <React.Fragment key={`${question.id}-status-${part}`}>
            {part + " "}
          </React.Fragment>
        ))}
      </span>
    </div>
  );
};

export default GroupQuestionResolution;
