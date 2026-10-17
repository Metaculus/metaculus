import { renderMarkdownResponse } from "@/agent_markdown/respond";

// Params arrive as path segments: a rewrite's destination query string is not
// visible here, since request.nextUrl still reports the original URL.
export async function GET(
  _request: Request,
  context: { params: Promise<{ type: string; args?: string[] }> }
) {
  const { type, args } = await context.params;

  return renderMarkdownResponse(type, args ?? []);
}
