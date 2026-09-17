import { logError } from "@/utils/core/errors";
import { getPublicSettings } from "@/utils/public_settings.server";

import { serializeFrontmatter } from "./frontmatter";
import { getMarkdownRoute, toRouteParams } from "./routes.mjs";
import { MarkdownDocument } from "./types";

// Can't also go on the HTML response: Next 16.2 overwrites Vary on the render
// path, from both next.config headers() and proxy.ts.
const NEGOTIATED_HEADERS = {
  Vary: "Accept, Accept-Language",
};

const MARKDOWN_HEADERS = {
  ...NEGOTIATED_HEADERS,
  "Content-Type": "text/markdown; charset=utf-8",
};

function plain(status: number, message: string): Response {
  return new Response(message, {
    status,
    headers: {
      ...NEGOTIATED_HEADERS,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

function absolute(path: string): string {
  const { PUBLIC_APP_URL } = getPublicSettings();
  return new URL(path, PUBLIC_APP_URL).toString();
}

// `/md` is excluded from proxy.ts, so its gate is re-checked here. Alpha access
// is not: the proxy only alpha-gates requests that already have a session, so
// gating here would 404 all markdown on every alpha deployment.
function isGated(): boolean {
  return getPublicSettings().PUBLIC_AUTHENTICATION_REQUIRED;
}

// notFound()/redirect() throw with a `NEXT_`-prefixed digest; ApiError uses
// `[API_ERROR]`, so the two never collide.
function isNextControlFlow(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_");
}

function serialize(document: MarkdownDocument): string {
  return `${serializeFrontmatter(document.frontmatter)}\n\n${document.body}`;
}

export async function renderMarkdownResponse(
  type: string,
  args: readonly string[]
): Promise<Response> {
  if (isGated()) return plain(404, "Not found");

  const route = getMarkdownRoute(type);
  if (!route) return plain(404, "Not found");

  const params = toRouteParams(route, args);

  try {
    const { builder } = await route.load();
    const result = await builder.build(params);

    if (result.status === "not_found") return plain(404, "Not found");

    return new Response(serialize(result.document), {
      status: 200,
      headers: {
        ...MARKDOWN_HEADERS,
        Link: `<${absolute(result.document.canonicalPath)}>; rel="canonical"`,
      },
    });
  } catch (error) {
    // Let Next render its own 404 instead of logging a 500. Inlined rather
    // than next/navigation's unstable_rethrow, which next/jest stubs out.
    if (isNextControlFlow(error)) throw error;

    logError(error, {
      message: "Markdown rendering failed",
      payload: { type, params },
    });
    return plain(500, "Internal server error");
  }
}
