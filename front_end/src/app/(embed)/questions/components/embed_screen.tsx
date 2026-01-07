"use client";

import React, { useEffect, useRef, useState } from "react";

import { ContinuousQuestionTypes } from "@/constants/questions";
import { GroupOfQuestionsGraphType, PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";
import { isGroupOfQuestionsPost } from "@/utils/questions/helpers";

import EmbedQuestionCard from "./embed_question_card";
import { EmbedTheme } from "../constants/embed_theme";
import { EmbedSize } from "../helpers/embed_chart_height";

type Props = {
  post: PostWithForecasts;
  targetWidth?: number;
  targetHeight?: number;
  theme?: EmbedTheme;
  titleOverride?: string;
};

const MIN_EMBED_WIDTH = 360;
const DYNAMIC_BELOW_WIDTH = 440;

function getBinaryContinuousSize(containerWidth: number): EmbedSize {
  if (containerWidth >= 550) return { width: 550, height: 360 };
  if (containerWidth >= 440) return { width: 440, height: 360 };
  return { width: 360, height: 360 };
}

function getOtherSize(containerWidth: number): EmbedSize {
  if (containerWidth >= 550) return { width: 550, height: 270 };
  if (containerWidth >= 440) return { width: 440, height: 270 };
  if (containerWidth >= 400) return { width: 400, height: 360 };
  return { width: 360, height: 360 };
}

function getSizeForPost(post: PostWithForecasts, containerWidth: number) {
  const isBinaryOrContinuous =
    !!post.question &&
    (post.question.type === QuestionType.Binary ||
      ContinuousQuestionTypes.some((t) => t === post.question?.type));

  const isFanChart =
    isGroupOfQuestionsPost(post) &&
    post.group_of_questions?.graph_type === GroupOfQuestionsGraphType.FanGraph;

  return isBinaryOrContinuous || isFanChart
    ? getBinaryContinuousSize(containerWidth)
    : getOtherSize(containerWidth);
}

const EmbedScreen: React.FC<Props> = ({
  post,
  targetWidth,
  targetHeight,
  theme,
  titleOverride,
}) => {
  const frameRef = useRef<HTMLDivElement | null>(null);

  const [containerWidth, setContainerWidth] = useState(MIN_EMBED_WIDTH);

  useEffect(() => {
    if (!frameRef.current) return;

    const el = frameRef.current;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const rawWidth = entry?.contentRect.width ?? MIN_EMBED_WIDTH;
      setContainerWidth(rawWidth);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [post]);

  const ogMode =
    typeof targetWidth === "number" && typeof targetHeight === "number";

  const isDynamic = !ogMode && containerWidth < DYNAMIC_BELOW_WIDTH;

  const effectiveWidthForSizing = isDynamic
    ? containerWidth
    : Math.max(containerWidth, MIN_EMBED_WIDTH);

  const snapped = getSizeForPost(post, effectiveWidthForSizing);

  const baseWidth = isDynamic
    ? effectiveWidthForSizing
    : snapped.width || MIN_EMBED_WIDTH;

  const baseHeight = snapped.height || MIN_EMBED_WIDTH;

  const scale = ogMode
    ? Math.min(targetWidth / baseWidth, targetHeight / baseHeight)
    : 1;

  const isBinary = post.question?.type === QuestionType.Binary;
  const isContinuous =
    post.question &&
    ContinuousQuestionTypes.some((t) => t === post.question?.type);

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
        width: isDynamic ? "100%" : baseWidth,
        ...(isDynamic ? {} : { minWidth: MIN_EMBED_WIDTH }),
        ...(isDynamic ? {} : { height: baseHeight, minHeight: baseHeight }),

        boxSizing: "border-box",
      };

  return (
    <div
      ref={frameRef}
      className="flex size-full min-h-[inherit] items-center justify-center bg-blue-100 [container-type:inline-size] dark:bg-blue-100-dark"
      style={{ minWidth: isDynamic ? undefined : MIN_EMBED_WIDTH }}
    >
      <div
        id="id-used-by-screenshot-donot-change"
        className={cn(
          "bg-blue-100 text-gray-900",
          "dark:bg-blue-100-dark dark:text-gray-900-dark"
        )}
        style={{
          ...frameStyle,
          ...theme?.card,
        }}
      >
        <div
          className={cn(
            "EmbedQuestionCard flex flex-col p-5 pb-4",
            isBinary || isContinuous ? "gap-5" : "gap-4 pb-5"
          )}
          style={{
            width: isDynamic ? "100%" : baseWidth,
            ...(isDynamic ? {} : { minWidth: MIN_EMBED_WIDTH }),
            ...(isDynamic ? {} : { height: baseHeight, minHeight: baseHeight }),
            boxSizing: "border-box",
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            transformOrigin: "center center",
          }}
        >
          <EmbedQuestionCard
            size={snapped}
            ogMode={ogMode}
            post={post}
            theme={theme}
            titleOverride={titleOverride}
            isDynamicMcHeight={isDynamic}
          />
        </div>
      </div>
    </div>
  );
};

export default EmbedScreen;
