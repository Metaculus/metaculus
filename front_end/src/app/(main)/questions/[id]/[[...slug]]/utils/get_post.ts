import { permanentRedirect } from "next/navigation";
import { cache } from "react";

import PostsApi from "@/services/posts";
import questions from "@/services/questions";
import { getPostLink } from "@/utils/navigation";

import { SLUG_POST_SUB_QUESTION_ID } from "../../search_params";

/**
 * A backward compatibility util
 */
async function getPost(id: number, with_cp = true) {
  try {
    return await PostsApi.getPost(id, with_cp);
  } catch (e) {
    const lastLegacyQuestionId = parseInt(
      process.env.LAST_LEGACY_QUESTION_ID || ""
    );
    const nextError = e as Error & { digest?: string };

    // A backward compatibility workaround.
    // Initially, all group question links were generated as /questions/<child_question_id>,
    // which redirected to /questions/<post_id>/?sub-question=<child_question_id>.
    // Now that posts and questions are differentiated, these redirects are no longer supported.
    //
    // This workaround tracks the last known legacy question ID.
    // If a 404 lookup contains an ID lower than the last legacy question ID,
    // we assume it may refer to a child question in a group.
    // If so, we attempt to replace its ID with the original post_id when possible.
    if (
      lastLegacyQuestionId &&
      id <= lastLegacyQuestionId &&
      nextError?.digest === "NEXT_NOT_FOUND"
    ) {
      const { post_id, post_slug } = await questions.legacyGetPostId(id);

      // Permanently redirecting to the correct endpoint
      return permanentRedirect(
        `${getPostLink({ id: post_id, slug: post_slug })}?${SLUG_POST_SUB_QUESTION_ID}=${id}`
      );
    }

    throw e;
  }
}

export const cachedGetPost = cache(getPost);
