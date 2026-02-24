import { NextRequest, NextResponse } from "next/server";

import { safeFetch, validateExternalUrl } from "@/utils/url_validation";

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  let validatedUrl: string;
  try {
    validatedUrl = await validateExternalUrl(url);
  } catch (error) {
    console.error("URL validation failed:", error);
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  try {
    const response = await safeFetch(validatedUrl, {
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

    const contentType = response.headers.get("content-type") || "image/x-icon";

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
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
