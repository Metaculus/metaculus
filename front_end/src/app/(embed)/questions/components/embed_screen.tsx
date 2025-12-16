"use client";

import React, { useEffect, useRef, useState } from "react";

import { ContinuousQuestionTypes } from "@/constants/questions";
import { TimelineChartZoomOption } from "@/types/charts";
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
  defaultZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
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
  defaultZoom,
  withZoomPicker,
}) => {
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
            width: baseWidth,
            height: baseHeight,
            minWidth: MIN_EMBED_WIDTH,
            minHeight: baseHeight,
            boxSizing: "border-box",
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            transformOrigin: "center center",
          }}
        >
          <EmbedQuestionCard
            size={size}
            ogMode={ogMode}
            post={post}
            theme={theme}
            titleOverride={titleOverride}
            defaultZoom={defaultZoom}
            withZoomPicker={withZoomPicker}
          />
        </div>
      </div>
    </div>
  );
};

export default EmbedScreen;
