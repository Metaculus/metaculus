"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import CommentStatus from "@/components/post_card/basic_post_card/comment_status";
import { ContinuousQuestionTypes } from "@/constants/questions";
import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";

import metaculusDarkLogo from "../assets/metaculus-dark.png";
import metaculusLightLogo from "../assets/metaculus-light.png";

type Props = {
  post: PostWithForecasts;
  targetWidth?: number;
  targetHeight?: number;
};

type EmbedSize = {
  width: number;
  height: number;
};

const MIN_EMBED_WIDTH = 360;

function getBinaryContinuousSize(containerWidth: number): EmbedSize {
  if (containerWidth >= 550) {
    return { width: 550, height: 360 };
  }
  if (containerWidth >= 440) {
    return { width: 440, height: 360 };
  }
  return { width: 360, height: 360 };
}

function getOtherSize(containerWidth: number): EmbedSize {
  if (containerWidth >= 550) {
    return { width: 550, height: 270 };
  }
  if (containerWidth >= 401) {
    return { width: 401, height: 270 };
  }
  if (containerWidth >= 360) {
    return { width: 400, height: 360 };
  }
  return { width: 360, height: 360 };
}

function getSizeForPost(post: PostWithForecasts, containerWidth: number) {
  const isBinaryOrContinuous =
    !!post.question &&
    (post.question.type === QuestionType.Binary ||
      ContinuousQuestionTypes.some((t) => t === post.question?.type));

  return isBinaryOrContinuous
    ? getBinaryContinuousSize(containerWidth)
    : getOtherSize(containerWidth);
}

const EmbedScreen: React.FC<Props> = ({ post, targetWidth, targetHeight }) => {
  const frameRef = useRef<HTMLDivElement | null>(null);

  const [size, setSize] = useState<EmbedSize>(() =>
    getSizeForPost(post, MIN_EMBED_WIDTH)
  );

  useEffect(() => {
    if (!frameRef.current) return;

    const el = frameRef.current;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const rawWidth = entry?.contentRect.width ?? MIN_EMBED_WIDTH;
      const effectiveWidth = Math.max(rawWidth, MIN_EMBED_WIDTH);

      setSize(getSizeForPost(post, effectiveWidth));
    });

    observer.observe(el);

    return () => observer.disconnect();
  }, [post]);

  const ogMode =
    typeof targetWidth === "number" && typeof targetHeight === "number";

  const baseWidth = size.width || MIN_EMBED_WIDTH;
  const baseHeight = size.height || MIN_EMBED_WIDTH;

  const scale = ogMode && baseHeight > 0 ? targetHeight / baseHeight : 1;

  const frameStyle: React.CSSProperties = ogMode
    ? {
        width: targetWidth,
        height: targetHeight,
        minWidth: MIN_EMBED_WIDTH,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }
    : {
        width: baseWidth,
        height: baseHeight,
        minWidth: MIN_EMBED_WIDTH,
        minHeight: baseHeight,
        boxSizing: "border-box",
      };

  return (
    <div
      ref={frameRef}
      className="flex size-full min-h-[inherit] items-center justify-center"
      style={{ minWidth: MIN_EMBED_WIDTH }}
    >
      <div
        id="id-used-by-screenshot-donot-change"
        className={cn(
          "bg-blue-100 text-gray-900",
          "dark:bg-blue-100-dark dark:text-gray-900-dark"
        )}
        style={frameStyle}
      >
        <div
          className="flex flex-col gap-8 p-5 pb-4"
          style={{
            width: baseWidth,
            height: baseHeight,
            minWidth: MIN_EMBED_WIDTH,
            minHeight: baseHeight,
            boxSizing: "border-box",
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            transformOrigin: "center center",
          }}
        >
          <div className="mb-auto" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ForecastersCounter
                className="px-1.5 py-1 [&_strong]:font-normal"
                forecasters={post.nr_forecasters}
              />
              <CommentStatus
                className="!px-1.5 py-1 [&_strong]:font-normal [&_svg]:text-gray-400 [&_svg]:dark:text-gray-400-dark"
                totalCount={post.comment_count ?? 0}
                unreadCount={post.unread_comment_count ?? 0}
                url={""}
              />
            </div>

            <div id="id-logo-used-by-screenshot-donot-change">
              <Image
                className="dark:hidden"
                src={metaculusDarkLogo}
                alt="Metaculus Logo"
                width={74}
                height={15}
              />
              <Image
                className="hidden dark:block"
                src={metaculusLightLogo}
                alt="Metaculus Logo"
                width={74}
                height={15}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbedScreen;
