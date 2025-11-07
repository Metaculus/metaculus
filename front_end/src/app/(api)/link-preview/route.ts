import { extract } from "@extractus/article-extractor";
import { NextRequest, NextResponse } from "next/server";

import ServerProfileApi from "@/services/api/profile/profile.server";

const EXTRACT_TIMEOUT_MS = 5000;

export async function GET(request: NextRequest) {
  const user = await ServerProfileApi.getMyProfile();

  try {
    const url = request.nextUrl.searchParams.get("url");

    if (!url || !user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Article extraction timeout")),
        EXTRACT_TIMEOUT_MS
      )
    );

    // Race between extraction and timeout
    const articleData = await Promise.race([extract(url), timeoutPromise]);

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
