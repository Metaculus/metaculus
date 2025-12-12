import { ContinuousQuestionTypes } from "@/constants/questions";
import { GroupOfQuestionsGraphType, PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import { isGroupOfQuestionsPost } from "@/utils/questions/helpers";

export type EmbedSize = {
  width: number;
  height: number;
};

const HEADER = {
  MIN: 50,
  MAX: 100,
} as const;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function headerT(headerHeight: number) {
  if (!headerHeight) return null;
  const clamped = clamp(headerHeight, HEADER.MIN, HEADER.MAX);
  return (clamped - HEADER.MIN) / (HEADER.MAX - HEADER.MIN);
}

type ChartRange = {
  min: number;
  max: number;
  fudge: number;
};

function getChartRange(args: {
  post: PostWithForecasts;
  ogMode?: boolean;
  size: EmbedSize;
  legendHeight?: number;
}): ChartRange {
  const { post, ogMode, size, legendHeight } = args;

  const isMC = post.question?.type === QuestionType.MultipleChoice;
  const isGroup = isGroupOfQuestionsPost(post);

  let min = 120;
  let max = 170;
  let fudge = 8;

  if (isMC) {
    min = ogMode ? 120 : 73;
    max = size.width <= 400 ? 202 - (legendHeight ?? 0) : 124;
    fudge = 0;
    return { min, max, fudge };
  }

  if (isGroup) {
    const firstType = post.group_of_questions.questions[0]?.type;
    const isBinaryGroup = firstType === QuestionType.Binary;
    const isContinuousGroup = ContinuousQuestionTypes.some(
      (t) => t === firstType
    );

    if (
      (isBinaryGroup || isContinuousGroup) &&
      post.group_of_questions.graph_type !== GroupOfQuestionsGraphType.FanGraph
    ) {
      min = ogMode ? 120 : 73;
      max = size.width <= 400 ? 202 - (legendHeight ?? 0) : 124;
      fudge = 0;
      return { min, max, fudge };
    }

    min = ogMode ? 120 : 73;
    max = 196 - (legendHeight ?? 0);
    return { min, max, fudge };
  }

  return { min, max, fudge };
}

export function getEmbedChartHeight(args: {
  post: PostWithForecasts;
  ogMode?: boolean;
  size: EmbedSize;
  headerHeight: number;
  legendHeight?: number;
}): number {
  const { headerHeight, post, ogMode, size, legendHeight } = args;

  const { min, max, fudge } = getChartRange({
    post,
    ogMode,
    size,
    legendHeight,
  });

  const t = headerT(headerHeight);
  if (t === null) return max;

  return Math.round(max + fudge - t * (max - min));
}
