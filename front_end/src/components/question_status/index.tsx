import { useLocale, useTranslations } from "next-intl";
import React, { FC, useMemo } from "react";

import QuestionStatusIcon from "@/components/question_status/status_icon";
import { Post } from "@/types/post";
import {
  Question,
  QuestionStatus as QuestionStatusEnum,
} from "@/types/question";
import { formatRelativeDate } from "@/utils/date_formatters";

type Props = {
  question: Question;
  post: Post;
};

// TODO: revisit this component once BE provide all data, required for status definition
const QuestionStatus: FC<Props> = ({ question, post }) => {
  const t = useTranslations();
  const locale = useLocale();
  const status = question.status;

  const statusInfo = useMemo(() => {
    if (status === QuestionStatusEnum.Closed) {
      return [t("resolutionPending")];
    }

    if (status === QuestionStatusEnum.Active) {
      return [
        t("closes"),
        formatRelativeDate(locale, new Date(question.closed_at), {
          short: true,
        }),
      ];
    }

    if (status === QuestionStatusEnum.Resolved) {
      return [
        t("resolved"),
        formatRelativeDate(locale, new Date(question.resolved_at), {
          short: true,
        }),
      ];
    }

    return [];
  }, [locale, question.closed_at, question.resolved_at, status, t]);

  return (
    <div className="flex flex-row items-center gap-1.5 truncate text-gray-900 dark:text-gray-900-dark">
      <QuestionStatusIcon
        status={question.status}
        published_at={post.published_at}
        closed_at={question.closed_at}
      />
      <span className="whitespace-nowrap text-sm">
        {statusInfo.map((part) => (
          <React.Fragment key={`${question.id}-status-${part}`}>
            {part + " "}
          </React.Fragment>
        ))}
      </span>
    </div>
  );
};

export default QuestionStatus;
