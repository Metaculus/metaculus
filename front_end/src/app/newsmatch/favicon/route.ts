import { NextRequest, NextResponse } from "next/server";

import { safeValidatedFetch } from "@/utils/url_validation";

const MAX_FAVICON_SIZE = 1024 * 1024; // 1 MB
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/svg+xml",
]);

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    const response = await safeValidatedFetch(url, {
      headers: {
        Cookie: "",
        Accept: "image/*",
      },
      credentials: "omit",
      redirect: "error",
      cache: "force-cache",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch favicon: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_FAVICON_SIZE) {
      return NextResponse.json({ error: "Favicon too large" }, { status: 413 });
    }

    const [rawType = "image/x-icon"] = (
      response.headers.get("content-type") || "image/x-icon"
    ).split(";");
    const normalizedType = rawType.trim().toLowerCase();
    const contentType = ALLOWED_IMAGE_TYPES.has(normalizedType)
      ? normalizedType
      : "application/octet-stream";

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_FAVICON_SIZE) {
      return NextResponse.json({ error: "Favicon too large" }, { status: 413 });
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Security-Policy": "sandbox",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Error proxying favicon:", error);
    return NextResponse.json(
      { error: "Failed to fetch favicon" },
      { status: 500 }
    );
  }
};
