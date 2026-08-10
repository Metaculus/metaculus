import { logError } from "@/utils/core/errors";
import { getPublicSettings } from "@/utils/public_settings.server";

import { serializeFrontmatter } from "./frontmatter";
import { getMarkdownRoute, toRouteParams } from "./routes.mjs";
import { MarkdownDocument } from "./types";

const NEGOTIATED_HEADERS = {
  // Set here rather than on the HTML response: on Next 16.2 the router owns
  // Vary for HTML renders and overwrites next.config headers() and proxy.ts.
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

/**
 * `/md` routes are excluded from `proxy.ts`, so the gate it enforces for HTML
 * is re-checked here, before any data is fetched.
 *
 * Alpha access is deliberately not checked: the proxy's alpha branch only runs
 * for requests that already have a session and merely redirects them to
 * /alpha-auth, so anonymous callers are not alpha-gated on the HTML side
 * either. Gating here would 404 all markdown on every alpha deployment.
 */
function isGated(): boolean {
  return getPublicSettings().PUBLIC_AUTHENTICATION_REQUIRED;
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
    logError(error, {
      message: "Markdown rendering failed",
      payload: { type, params },
    });
    return plain(500, "Internal server error");
  }
}
