import { renderMarkdownResponse } from "@/agent_markdown/respond";

/**
 * Single entry point for markdown requests: `/md/<type>/<...params>`.
 *
 * Params travel as path segments because a rewrite's destination query string
 * is not visible here — `request.nextUrl` still reports the original URL.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ type: string; args?: string[] }> }
) {
  const { type, args } = await context.params;

  return renderMarkdownResponse(type, args ?? []);
}
