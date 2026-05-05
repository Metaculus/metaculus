"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FC, Fragment } from "react";

import BinaryCompactForecastText from "@/app/(main)/questions/components/binary_compact_forecast_text";
import ContinuousCompactForecastText from "@/app/(main)/questions/components/continuous_compact_forecast_text";
import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import { QuestionResolutionChipFacade } from "@/components/consumer_post_card/question_resolution_chip";
import PostStatusRail from "@/components/post_card/basic_post_card/status_rail";
import ContinuousCPBar from "@/components/post_card/question_tile/continuous_cp_bar";
import { POST_TEXT_SEARCH_FILTER } from "@/constants/posts_feed";
import HideCPProvider, { useHideCP } from "@/contexts/cp_context";
import { PostWithForecasts, QuestionStatus } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import cn from "@/utils/core/cn";
import { getPostLink } from "@/utils/navigation";
import { isNotebookPost, isQuestionPost } from "@/utils/questions/helpers";

type Props = {
  post: PostWithForecasts;
};

const CompactSearchPostCard: FC<Props> = ({ post }) => {
  const postUrl = getPostLink(post);
  const isNotebook = isNotebookPost(post);
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get(POST_TEXT_SEARCH_FILTER)?.trim() ?? "";

  return (
    <article
      className={cn(
        "overflow-hidden rounded border bg-gray-0 @container dark:bg-gray-0-dark",
        isNotebook
          ? "border-l-4 border-purple-500 dark:border-purple-500-dark"
          : "border-blue-400 dark:border-blue-400-dark"
      )}
    >
      <HideCPProvider post={post}>
        <div className="flex items-start gap-4 p-3 sm:items-center sm:px-4">
          <div className="min-w-0 flex-1">
            <Link href={postUrl} className="block no-underline">
              <h4 className="m-0 text-pretty text-sm font-medium leading-5 text-gray-800 transition-colors hover:text-blue-700 dark:text-gray-800-dark dark:hover:text-blue-700-dark sm:text-base sm:leading-6">
                <HighlightedTitle title={post.title} query={searchQuery} />
              </h4>
            </Link>
            <CompactMobileCPHint post={post} />
            <div className="mt-2 min-w-0 overflow-hidden sm:mt-1.5 sm:overflow-visible">
              <PostStatusRail post={post} />
            </div>
          </div>
          <CompactCPSection post={post} />
        </div>
      </HideCPProvider>
    </article>
  );
};

const HighlightedTitle: FC<{ title: string; query: string }> = ({
  title,
  query,
}) => {
  if (!query) {
    return title;
  }

  const tokens = query
    .split(/\s+/)
    .map((token) => token.trim().toLocaleLowerCase())
    .filter(Boolean);

  if (!tokens.length) {
    return title;
  }

  const titleLower = title.toLocaleLowerCase();
  const parts: Array<{ text: string; isMatch: boolean }> = [];
  let startIndex = 0;
  let nextMatch = findNextTokenMatch(titleLower, tokens, startIndex);

  if (!nextMatch) {
    return title;
  }

  while (nextMatch) {
    const { index: matchIndex, token } = nextMatch;

    if (matchIndex > startIndex) {
      const textBetweenMatches = title.slice(startIndex, matchIndex);
      const previousPart = parts.at(-1);

      if (previousPart?.isMatch && textBetweenMatches.trim() === "") {
        previousPart.text += textBetweenMatches;
      } else {
        parts.push({
          text: textBetweenMatches,
          isMatch: false,
        });
      }
    }
    const matchText = title.slice(matchIndex, matchIndex + token.length);
    const previousPart = parts.at(-1);

    if (previousPart?.isMatch) {
      previousPart.text += matchText;
    } else {
      parts.push({
        text: matchText,
        isMatch: true,
      });
    }
    startIndex = matchIndex + token.length;
    nextMatch = findNextTokenMatch(titleLower, tokens, startIndex);
  }

  if (startIndex < title.length) {
    parts.push({
      text: title.slice(startIndex),
      isMatch: false,
    });
  }

  return (
    <>
      {parts.map(({ text, isMatch }, index) =>
        isMatch ? (
          <mark
            key={`${text}-${index}`}
            className="rounded-sm bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-700/50"
          >
            {text}
          </mark>
        ) : (
          <Fragment key={`${text}-${index}`}>{text}</Fragment>
        )
      )}
    </>
  );
};

function findNextTokenMatch(
  haystack: string,
  tokens: string[],
  fromIndex: number
) {
  return tokens.reduce<{ index: number; token: string } | null>(
    (bestMatch, token) => {
      const index = haystack.indexOf(token, fromIndex);

      if (index === -1) {
        return bestMatch;
      }

      if (
        !bestMatch ||
        index < bestMatch.index ||
        (index === bestMatch.index && token.length > bestMatch.token.length)
      ) {
        return { index, token };
      }

      return bestMatch;
    },
    null
  );
}

const CompactMobileCPHint: FC<{ post: PostWithForecasts }> = ({ post }) => {
  const { hideCP } = useHideCP();

  if (!isQuestionPost(post)) {
    return null;
  }

  const { question } = post;

  if (question.type === QuestionType.Binary) {
    if (question.status !== QuestionStatus.RESOLVED && hideCP) {
      return null;
    }

    return (
      <p className="m-0 mt-1 leading-4 sm:hidden">
        <BinaryCompactForecastText question={question} />
      </p>
    );
  }

  if (isContinuousQuestion(question)) {
    if (hideCP) {
      return null;
    }

    return (
      <p className="m-0 mt-1 leading-4 sm:hidden">
        <ContinuousCompactForecastText question={question} />
      </p>
    );
  }

  return null;
};

const CompactCPSection: FC<{ post: PostWithForecasts }> = ({ post }) => {
  const { hideCP } = useHideCP();

  if (!isQuestionPost(post)) {
    return null;
  }

  const { question } = post;

  if (question.type === QuestionType.Binary) {
    if (question.status === QuestionStatus.RESOLVED && question.resolution) {
      return (
        <div className="hidden min-w-[84px] shrink-0 items-center justify-center sm:flex">
          <QuestionResolutionChipFacade question={question} size="sm" />
        </div>
      );
    }

    if (hideCP) {
      return null;
    }

    return (
      <div className="relative hidden h-14 w-20 shrink-0 items-center justify-center overflow-visible sm:flex">
        <BinaryCPBar
          question={question}
          size="md"
          className="origin-center scale-[0.7]"
        />
      </div>
    );
  }

  if (isContinuousQuestion(question)) {
    if (hideCP) {
      return null;
    }

    return (
      <div className="hidden min-w-[96px] shrink-0 justify-end sm:flex">
        <ContinuousCPBar question={question} size="sm" variant="question" />
      </div>
    );
  }

  return null;
};

function isContinuousQuestion(
  question: QuestionWithForecasts
): question is QuestionWithNumericForecasts {
  return (
    question.type === QuestionType.Numeric ||
    question.type === QuestionType.Discrete ||
    question.type === QuestionType.Date
  );
}

export default CompactSearchPostCard;
