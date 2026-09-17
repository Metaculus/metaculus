import { FrontmatterValue } from "./frontmatter";

export type MarkdownDocument = {
  /** Serialized in insertion order; absent values are dropped. */
  frontmatter: Record<string, FrontmatterValue>;
  body: string;
  /** Site-relative path of the HTML page this mirrors; `respond` absolutizes it. */
  canonicalPath: string;
};

// A result, not notFound(), so a miss can't render HTML into a markdown response
export type MarkdownBuildResult =
  | { status: "ok"; document: MarkdownDocument }
  | { status: "not_found" };

export type MarkdownRouteParams = Record<string, string | undefined>;

export type MarkdownBuilder<
  P extends MarkdownRouteParams = MarkdownRouteParams,
> = {
  build(params: P): Promise<MarkdownBuildResult>;
};
