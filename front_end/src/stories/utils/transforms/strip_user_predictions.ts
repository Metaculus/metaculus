import { PostWithForecasts } from "@/types/post";

export const stripUserPredictions = (
  post: PostWithForecasts
): PostWithForecasts => {
  if (post.group_of_questions) {
    return {
      ...post,
      group_of_questions: {
        ...post.group_of_questions,
        questions: post.group_of_questions.questions.map((q) => ({
          ...q,
          my_forecasts: { history: [] },
        })),
      },
    };
  }

  if (post.question) {
    return {
      ...post,
      question: {
        ...post.question,
        my_forecasts: { history: [] },
      },
    };
  }

  return post;
};
