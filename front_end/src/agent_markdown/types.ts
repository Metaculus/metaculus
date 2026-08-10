import { FrontmatterValue } from "./frontmatter";

export type MarkdownDocument = {
  /** Serialized in insertion order; absent values are dropped. */
  frontmatter: Record<string, FrontmatterValue>;
  body: string;
  /**
   * Site-relative path of the HTML page this document mirrors. `respond` makes
   * it absolute, so builders need no knowledge of the deployment's origin.
   */
  canonicalPath: string;
};

/**
 * Builders return a result rather than calling `notFound()` or throwing, so a
 * miss can never render Next's HTML error page into a text/markdown response.
 */
export type MarkdownBuildResult =
  | { status: "ok"; document: MarkdownDocument }
  | { status: "not_found" };

export type MarkdownRouteParams = Record<string, string | undefined>;

export type MarkdownBuilder<
  P extends MarkdownRouteParams = MarkdownRouteParams,
> = {
  build(params: P): Promise<MarkdownBuildResult>;
};
