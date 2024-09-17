import { useLocale, useTranslations } from "next-intl";
import React, { FC, useMemo } from "react";

import PostStatusIcon from "@/components/post_status/status_icon";
import { Post, PostStatus as PostStatusEnum, Resolution } from "@/types/post";
import { formatRelativeDate } from "@/utils/date_formatters";

type Props = {
  resolution: Resolution | null;
  post: Post;
};

// TODO: revisit this component once BE provide all data, required for status definition
const PostStatus: FC<Props> = ({ resolution, post }) => {
  const t = useTranslations();
  const locale = useLocale();
  const { status, scheduled_close_time, actual_close_time, open_time } = post;

  const statusInfo = useMemo(() => {
    if (status === PostStatusEnum.CLOSED) {
      return [t("resolutionPending")];
    }

    if (status === PostStatusEnum.APPROVED) {
      if (new Date(open_time).getTime() > Date.now()) {
        return [
          t("opens"),
          formatRelativeDate(locale, new Date(open_time), {
            short: true,
          }),
        ];
      }
      return [
        t("closes"),
        formatRelativeDate(locale, new Date(scheduled_close_time), {
          short: true,
        }),
      ];
    }

    if (status === PostStatusEnum.RESOLVED) {
      return [
        t("resolved"),
        formatRelativeDate(locale, new Date(actual_close_time), {
          short: true,
        }),
      ];
    }

    return [];
  }, [locale, scheduled_close_time, actual_close_time, status, t]);

  if (!post.scheduled_close_time || !post.actual_close_time) {
    return null;
  }

  return (
    <div className="flex flex-row items-center gap-1.5 truncate text-gray-900 dark:text-gray-900-dark">
      <PostStatusIcon
        status={status}
        published_at={post.published_at}
        actual_close_time={scheduled_close_time}
        resolution={resolution}
      />
      <span className="whitespace-nowrap text-sm" suppressHydrationWarning>
        {statusInfo.map((part) => (
          <React.Fragment key={`${post.id}-status-${part}`}>
            {part + " "}
          </React.Fragment>
        ))}
      </span>
    </div>
  );
};

export default PostStatus;
