import { MarkdownBuilder, MarkdownBuildResult } from "@/agent_markdown/types";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { getPostLink } from "@/utils/navigation";

/** `slug` is decorative — the id identifies the post, as on the HTML page. */
type Params = { id?: string; slug?: string };

export const builder: MarkdownBuilder<Params> = {
  async build({ id }): Promise<MarkdownBuildResult> {
    if (!id) return { status: "not_found" };

    let post;
    try {
      post = await ServerPostsApi.getPost(Number(id), false);
    } catch {
      return { status: "not_found" };
    }

    if (!post?.notebook) return { status: "not_found" };

    // Always the slugged URL, so the canonical link is right even when the
    // request omitted the slug — no redirect needed to correct the caller.
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
