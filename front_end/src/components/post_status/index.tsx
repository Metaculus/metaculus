import { useLocale, useTranslations } from "next-intl";
import React, { FC, useMemo } from "react";

import PostStatusIcon from "@/components/post_status/status_icon";
import {
  Post,
  PostStatus as PostStatusEnum,
  PostStatus as QuestionStatusEnum,
} from "@/types/post";
import { formatRelativeDate } from "@/utils/date_formatters";

type Props = {
  id: number;
  status: PostStatusEnum;
  closedAt: string;
  resolvedAt: string;
  post: Post;
};

// TODO: revisit this component once BE provide all data, required for status definition
const PostStatus: FC<Props> = ({ id, status, closedAt, resolvedAt, post }) => {
  const t = useTranslations();
  const locale = useLocale();

  const statusInfo = useMemo(() => {
    if (status === QuestionStatusEnum.Closed) {
      return [t("resolutionPending")];
    }

    if (status === QuestionStatusEnum.Active) {
      return [
        t("closes"),
        formatRelativeDate(locale, new Date(closedAt), {
          short: true,
        }),
      ];
    }

    if (status === QuestionStatusEnum.Resolved) {
      return [
        t("resolved"),
        formatRelativeDate(locale, new Date(resolvedAt), {
          short: true,
        }),
      ];
    }

    return [];
  }, [closedAt, locale, resolvedAt, status, t]);

  return (
    <div className="flex flex-row items-center gap-1.5 truncate text-gray-900 dark:text-gray-900-dark">
      <PostStatusIcon
        status={status}
        published_at={post.published_at}
        closed_at={closedAt}
      />
      <span className="whitespace-nowrap text-sm">
        {statusInfo.map((part) => (
          <React.Fragment key={`${id}-status-${part}`}>
            {part + " "}
          </React.Fragment>
        ))}
      </span>
    </div>
  );
};

export default PostStatus;
