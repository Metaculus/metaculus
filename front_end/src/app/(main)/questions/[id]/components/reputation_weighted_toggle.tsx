"use client";

// Staff-only and temporary, like the shadow aggregation banner: flips this
// page's charts and prediction inputs between the question's default
// aggregate and reputation_weighted with no request. Staff always receive both
// (posts/serializers.py). Remove this file and its use in question_page_shell.
import { ReactNode, useMemo, useState } from "react";

import Checkbox from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/auth_context";
import { PostWithForecasts } from "@/types/post";
import { AggregationMethod, QuestionWithForecasts } from "@/types/question";

const LABEL = "Display Reputation Weighted aggregate";
const REPUTATION_WEIGHTED = AggregationMethod.reputation_weighted;

function hasHistory(
  question: QuestionWithForecasts,
  method: AggregationMethod
): boolean {
  const aggregations = question.aggregations as Partial<
    Record<AggregationMethod, { history?: unknown[] }>
  >;
  return !!aggregations[method]?.history?.length;
}

function trueDefault(question: QuestionWithForecasts): AggregationMethod {
  if (question.default_aggregation_method !== REPUTATION_WEIGHTED) {
    return question.default_aggregation_method;
  }
  // The banner's setting replaced it. Builds only store a question's default
  // (and shadow) method, but some questions defaulting to unweighted kept old
  // recency_weighted rows, so unweighted wins when present.
  return hasHistory(question, AggregationMethod.unweighted)
    ? AggregationMethod.unweighted
    : AggregationMethod.recency_weighted;
}

function postQuestions(post: PostWithForecasts): QuestionWithForecasts[] {
  if (post.question) return [post.question];
  if (post.group_of_questions) return post.group_of_questions.questions;
  if (post.conditional) {
    const { condition, condition_child, question_yes, question_no } =
      post.conditional;
    return [condition, condition_child, question_yes, question_no];
  }
  return [];
}

function withDisplayedMethods(
  post: PostWithForecasts,
  showReputationWeighted: boolean
): PostWithForecasts {
  const display = <Q extends QuestionWithForecasts>(question: Q): Q => {
    const method =
      showReputationWeighted && hasHistory(question, REPUTATION_WEIGHTED)
        ? REPUTATION_WEIGHTED
        : trueDefault(question);
    return method === question.default_aggregation_method
      ? question
      : { ...question, default_aggregation_method: method };
  };
  if (post.question) return { ...post, question: display(post.question) };
  if (post.group_of_questions) {
    return {
      ...post,
      group_of_questions: {
        ...post.group_of_questions,
        questions: post.group_of_questions.questions.map(display),
      },
    } as PostWithForecasts;
  }
  if (post.conditional) {
    const { condition, condition_child, question_yes, question_no } =
      post.conditional;
    return {
      ...post,
      conditional: {
        ...post.conditional,
        condition: display(condition),
        condition_child: display(condition_child),
        question_yes: display(question_yes),
        question_no: display(question_no),
      },
    } as PostWithForecasts;
  }
  return post;
}

/**
 * The post with each question set to display the chosen aggregate, and the
 * toggle that chooses it (null unless staff and reputation_weighted exists).
 * Starts on whatever the server sent, so it follows the banner's setting.
 */
export function useReputationWeightedToggle(postData: PostWithForecasts): {
  post: PostWithForecasts;
  toggle: ReactNode;
} {
  const { user } = useAuth();
  const available = useMemo(
    () =>
      !!user?.is_staff &&
      postQuestions(postData).some((q) => hasHistory(q, REPUTATION_WEIGHTED)),
    [user?.is_staff, postData]
  );
  const [show, setShow] = useState(() =>
    postQuestions(postData).some(
      (q) => q.default_aggregation_method === REPUTATION_WEIGHTED
    )
  );
  const post = useMemo(
    () => (available ? withDisplayedMethods(postData, show) : postData),
    [available, postData, show]
  );
  const toggle = available ? (
    <Checkbox
      checked={show}
      onChange={setShow}
      label={LABEL}
      className="mb-2 text-xs font-medium"
    />
  ) : null;
  return { post, toggle };
}
