"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import { ContinuousQuestionTypes } from "@/constants/questions";
import { GroupOfQuestionsGraphType, PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";
import {
  isConditionalPost,
  isGroupOfQuestionsPost,
} from "@/utils/questions/helpers";

import EmbedQuestionCard from "./embed_question_card";
import { EmbedTheme } from "../constants/embed_theme";
import { EmbedSize } from "../helpers/embed_chart_height";

type Props = {
  post: PostWithForecasts;
  targetWidth?: number;
  targetHeight?: number;
  theme?: EmbedTheme;
  titleOverride?: string;
  customWidth?: number;
  customHeight?: number;
};

const MIN_EMBED_WIDTH = 360;
const DYNAMIC_BELOW_WIDTH = 440;
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

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
  customWidth,
  customHeight,
}) => {
  const frameRef = useRef<HTMLDivElement | null>(null);

  const [containerWidth, setContainerWidth] = useState(MIN_EMBED_WIDTH);

  useEffect(() => {
    if (!frameRef.current) return;

    const el = frameRef.current;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const rawWidth = entry?.contentRect.width ?? MIN_EMBED_WIDTH;
      setContainerWidth(Math.round(rawWidth));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [post]);

  const ogMode =
    typeof targetWidth === "number" || typeof targetHeight === "number";
  const ogViewportWidth = targetWidth ?? OG_WIDTH;
  const ogViewportHeight = targetHeight ?? OG_HEIGHT;

  // Check if custom dimensions are provided
  const hasCustomDimensions =
    typeof customWidth === "number" && typeof customHeight === "number";

  // Disable dynamic mode when custom dimensions are set
  const isDynamic =
    !ogMode && !hasCustomDimensions && containerWidth < DYNAMIC_BELOW_WIDTH;

  const effectiveWidthForSizing = isDynamic
    ? containerWidth
    : Math.max(containerWidth, MIN_EMBED_WIDTH);

  const shouldScaleByHeightInOg = useMemo(() => {
    const isBinaryOrContinuous =
      !!post.question &&
      (post.question.type === QuestionType.Binary ||
        ContinuousQuestionTypes.some((t) => t === post.question?.type));

    const isFanChart =
      isGroupOfQuestionsPost(post) &&
      post.group_of_questions?.graph_type ===
        GroupOfQuestionsGraphType.FanGraph;

    return isBinaryOrContinuous || isFanChart;
  }, [post]);

  // Use custom dimensions if both are provided, otherwise use default sizing logic
  const snapped = hasCustomDimensions
    ? { width: customWidth, height: customHeight }
    : getSizeForPost(post, ogMode ? OG_WIDTH : effectiveWidthForSizing);

  const baseWidth = hasCustomDimensions
    ? customWidth
    : isDynamic
      ? effectiveWidthForSizing
      : snapped.width || MIN_EMBED_WIDTH;

  const baseHeight = hasCustomDimensions
    ? customHeight
    : snapped.height || MIN_EMBED_WIDTH;

  const scale = ogMode
    ? shouldScaleByHeightInOg
      ? ogViewportHeight / baseHeight
      : ogViewportWidth / baseWidth
    : 1;

  const contentWidth =
    ogMode && shouldScaleByHeightInOg
      ? Math.max(baseWidth, ogViewportWidth / scale)
      : baseWidth;

  const isBinary = post.question?.type === QuestionType.Binary;
  const isContinuous =
    post.question &&
    ContinuousQuestionTypes.some((t) => t === post.question?.type);

  const frameStyle: React.CSSProperties = ogMode
    ? {
        width: ogViewportWidth,
        height: ogViewportHeight,
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

  const effectiveSize = ogMode ? { ...snapped, width: contentWidth } : snapped;

  const hasContainerBackground = !!theme?.container?.backgroundColor;
  const hasCardBackground = !!theme?.card?.backgroundColor;

  return (
    <div
      ref={frameRef}
      className={cn(
        "flex size-full min-h-[inherit] items-center justify-center [container-type:inline-size]",
        !hasContainerBackground && "bg-blue-100 dark:bg-blue-100-dark"
      )}
      style={{
        minWidth: isDynamic ? undefined : MIN_EMBED_WIDTH,
        ...theme?.container,
      }}
    >
      <div
        id="id-used-by-screenshot-donot-change"
        className={cn(
          "text-gray-900 dark:text-gray-900-dark",
          !hasCardBackground && "bg-blue-100 dark:bg-blue-100-dark"
        )}
        style={{
          ...frameStyle,
          ...theme?.card,
        }}
      >
        <div
          className={cn(
            "EmbedQuestionCard flex flex-col p-5 pb-4",
            isConditionalPost(post) && "justify-between",
            isBinary || isContinuous ? "gap-5" : "gap-4 pb-5"
          )}
          style={{
            width: isDynamic ? "100%" : contentWidth,
            ...(isDynamic ? {} : { minWidth: MIN_EMBED_WIDTH }),
            ...(isDynamic
              ? { minHeight: 270, justifyContent: "space-between" }
              : { height: baseHeight, minHeight: baseHeight }),
            ...(ogMode ? { justifyContent: "space-between" } : {}),
            boxSizing: "border-box",
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            transformOrigin: "center center",
          }}
        >
          <EmbedQuestionCard
            size={effectiveSize}
            ogMode={ogMode}
            post={post}
            theme={theme}
            titleOverride={titleOverride}
            containerWidth={ogMode ? contentWidth : containerWidth}
          />
        </div>
      </div>
    </div>
  );
};

export default EmbedScreen;
