import { PostWithForecasts } from "@/types/post";
import { MovementDirection } from "@/types/question";

export type CpMovementState = "up" | "down" | "none";

export const withCpMovement = (
  post: PostWithForecasts,
  state: CpMovementState
): PostWithForecasts => {
  const movementValue =
    state === "none"
      ? null
      : {
          divergence: 1,
          direction:
            state === "up" ? MovementDirection.UP : MovementDirection.DOWN,
          movement: state === "up" ? 0.058 : -0.058,
          period: "604800.0",
        };

  const applyToQuestion = (q: any) => ({
    ...q,
    aggregations: {
      ...q.aggregations,
      recency_weighted: {
        ...q.aggregations?.recency_weighted,
        movement: movementValue,
      },
    },
  });

  if (post.group_of_questions) {
    return {
      ...post,
      group_of_questions: {
        ...post.group_of_questions,
        questions: post.group_of_questions.questions.map((q) =>
          applyToQuestion(q)
        ),
      },
    };
  }
  if (post.question) {
    return {
      ...post,
      question: applyToQuestion(post.question),
    };
  }
  return post;
};
