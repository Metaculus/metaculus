import ClientPostsApi from "@/services/api/posts/posts.client";
import { ALLOWED_COHERENCE_LINK_QUESTION_TYPES } from "@/types/coherence";
import { Question } from "@/types/question";
import { ApiError } from "@/utils/core/errors";

export function extractQuestionNumbersFromText(text: string): number[] {
  const regex = /(?:\/questions\/|<EmbeddedQuestion id=")(\d+)/g;
  const array = Array.from(text.matchAll(regex), (match) => {
    return parseInt(match[1] ?? "-1", 10);
  });

  return [...new Set(array.filter((it) => it !== -1))];
}

export async function fetchQuestionsForIds(
  newPostIDs: number[]
): Promise<Question[]> {
  const newQuestions: Question[] = [];
  const values = await Promise.allSettled(
    Array.from(newPostIDs, (id) => ClientPostsApi.getPost(id))
  );

  for (const value of values) {
    if (value.status === "fulfilled") {
      const newPost = value.value;
      const newQuestion = newPost.question;
      if (
        newQuestion &&
        ALLOWED_COHERENCE_LINK_QUESTION_TYPES.includes(newQuestion.type)
      ) {
        newQuestions.push(newQuestion);
      }
    } else {
      const e = value.reason;
      const error = ApiError.isApiError(e) ? e.data : undefined;
      if (error) {
        console.log("API Error retrieving post.", error);
      } else {
        console.log(e);
      }
    }
  }

  return newQuestions;
}
