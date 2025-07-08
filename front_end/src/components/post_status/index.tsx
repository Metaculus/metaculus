"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import React, { FC, useMemo } from "react";

import PostStatusIcon from "@/components/post_status/status_icon";
import { Post, PostStatus as PostStatusEnum, Resolution } from "@/types/post";

import LocalDaytime from "../ui/local_daytime";

type Props = {
  resolution: Resolution | null;
  post: Post;
};

// TODO: revisit this component once BE provide all data, required for status definition
const PostStatus: FC<Props> = ({ resolution, post }) => {
  const t = useTranslations();
  const {
    status,
    scheduled_close_time,
    actual_close_time,
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
            {t("opens")} <LocalDaytime date={open_time} />
          </>
        );
      }
      return (
        <>
          {t("closes")} <LocalDaytime date={scheduled_close_time} />
        </>
      );
    }
    if (status === PostStatusEnum.RESOLVED) {
      return (
        <>
          {t("resolved")} <LocalDaytime date={actual_close_time} />
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
    actual_close_time,
  ]);

  if (!post.scheduled_close_time && !post.actual_close_time) {
    return null;
  }

  return (
    <div className="flex flex-row items-center gap-2 truncate px-1.5 text-gray-700 dark:text-gray-700-dark">
      <PostStatusIcon
        status={status}
        published_at={post.published_at}
        scheduled_close_time={scheduled_close_time}
        resolution={resolution}
      />
      <span
        className="whitespace-nowrap text-xs font-normal"
        suppressHydrationWarning
      >
        {statusText}
      </span>
    </div>
  );
};

export default dynamic(() => Promise.resolve(PostStatus), {
  ssr: false,
});
