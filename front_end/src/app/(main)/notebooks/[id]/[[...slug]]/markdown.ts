import { MarkdownBuilder, MarkdownBuildResult } from "@/agent_markdown/types";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { ApiError } from "@/utils/core/errors";
import { getPostLink } from "@/utils/navigation";

/** `slug` is decorative — the id identifies the post, as on the HTML page. */
type Params = { id?: string; slug?: string };

// 403 answers 404 so a private notebook's existence isn't leaked. Everything
// else propagates: faults become a logged 500, and an API 404 arrives as Next's
// notFound(), which respond hands back to the framework.
function isMissing(error: unknown): boolean {
  return ApiError.isApiError(error) && error.response.status === 403;
}

export const builder: MarkdownBuilder<Params> = {
  async build({ id }): Promise<MarkdownBuildResult> {
    if (!id) return { status: "not_found" };

    let post;
    try {
      post = await ServerPostsApi.getPost(Number(id), false);
    } catch (error) {
      if (isMissing(error)) return { status: "not_found" };
      throw error;
    }

    if (!post?.notebook) return { status: "not_found" };

    // Always the slugged URL, so this is right even when the request omitted it
    const canonicalPath = getPostLink(post);

    return {
      status: "ok",
      document: {
        canonicalPath,
        frontmatter: {
          title: post.title,
          type: "notebook",
          published: post.published_at,
          updated: post.notebook.edited_at,
          authors: [
            post.author_username,
            ...(post.coauthors ?? []).map((coauthor) => coauthor.username),
          ].filter(Boolean),
          image: post.notebook.image_url,
        },
        body: post.notebook.markdown,
      },
    };
  },
};
