"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import React, { FC, useMemo } from "react";

import PostStatusIcon from "@/components/post_status/status_icon";
import { Post, PostStatus as PostStatusEnum, Resolution } from "@/types/post";
import cn from "@/utils/core/cn";

import LocalDaytime from "../ui/local_daytime";

type Props = {
  resolution: Resolution | null;
  post: Post;
  compact?: boolean;
  className?: string;
};

// TODO: revisit this component once BE provide all data, required for status definition
const PostStatus: FC<Props> = ({
  resolution,
  post,
  compact = false,
  className,
}) => {
  const t = useTranslations();
  const {
    status,
    scheduled_close_time,
    actual_resolve_time,
    scheduled_resolve_time,
    open_time,
  } = post;

  const statusText = useMemo(() => {
    if (status === PostStatusEnum.PENDING) {
      return t("inReview");
    }
    if (status === PostStatusEnum.CLOSED) {
      if (new Date(scheduled_resolve_time).getTime() < Date.now()) {
        return t("resolutionPending");
      }
      return t("closed");
    }
    if ([PostStatusEnum.APPROVED, PostStatusEnum.OPEN].includes(status)) {
      if (new Date(open_time).getTime() > Date.now()) {
        return (
          <>
            {t("opens")}{" "}
            <span className="font-medium tabular-nums">
              <LocalDaytime date={open_time} />
            </span>
          </>
        );
      }
      return (
        <>
          {t("closes")}{" "}
          <span className="font-medium tabular-nums">
            <LocalDaytime date={scheduled_close_time} />
          </span>
        </>
      );
    }
    if (status === PostStatusEnum.RESOLVED && actual_resolve_time) {
      return (
        <>
          {t("resolved")}{" "}
          <span className="font-medium tabular-nums">
            <LocalDaytime date={actual_resolve_time} />
          </span>
        </>
      );
    }
    return null;
  }, [
    status,
    t,
    scheduled_resolve_time,
    open_time,
    scheduled_close_time,
    actual_resolve_time,
  ]);

  if (!post.scheduled_close_time && !post.actual_close_time) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex h-6 flex-row items-center gap-2 truncate rounded-xs bg-gray-200 px-1.5 text-gray-700 dark:bg-gray-200-dark dark:text-gray-700-dark md:bg-transparent dark:md:bg-transparent",
        className
      )}
    >
      <PostStatusIcon
        status={status}
        scheduled_close_time={scheduled_close_time}
        open_time={open_time}
        published_at={post.published_at}
        resolution={resolution}
      />
      {/* Show text only in non-compact mode */}
      {!compact && (
        <span
          className="whitespace-nowrap text-xs font-normal"
          suppressHydrationWarning
        >
          {statusText}
        </span>
      )}
    </div>
  );
};

export default dynamic(() => Promise.resolve(PostStatus), {
  ssr: false,
});
