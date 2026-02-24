import { extractFromHtml } from "@extractus/article-extractor";
import { NextRequest, NextResponse } from "next/server";

import ServerProfileApi from "@/services/api/profile/profile.server";
import { safeValidatedFetch } from "@/utils/url_validation";

const MAX_HTML_BYTES = 5 * 1024 * 1024; // 5 MB

export async function GET(request: NextRequest) {
  const user = await ServerProfileApi.getMyProfile();

  try {
    const url = request.nextUrl.searchParams.get("url");

    if (!url || !user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const response = await safeValidatedFetch(url);
    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream fetch failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const finalUrl = response.url;
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_HTML_BYTES) {
      return NextResponse.json(
        { error: "Response too large" },
        { status: 413 }
      );
    }
    const html = new TextDecoder().decode(buffer);
    const articleData = await extractFromHtml(html, finalUrl);

    if (!articleData) {
      return NextResponse.json(
        { error: "Failed to extract article data" },
        { status: 400 }
      );
    }

    return NextResponse.json(articleData);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
