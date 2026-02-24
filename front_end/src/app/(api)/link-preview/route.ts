import { extractFromHtml } from "@extractus/article-extractor";
import { NextRequest, NextResponse } from "next/server";

import { safeValidatedFetch } from "@/utils/url_validation";

export async function GET(request: NextRequest) {
  const user = true;

  try {
    const url = request.nextUrl.searchParams.get("url");

    if (!url || !user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const response = await safeValidatedFetch(url);
    const finalUrl = response.url;
    const html = await response.text();
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
