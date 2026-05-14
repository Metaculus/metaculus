import { NextRequest, NextResponse } from "next/server";

import { getPublicSettings } from "@/utils/public_settings.server";

export async function GET(req: NextRequest) {
  const theme = req.nextUrl.searchParams.get("theme") ?? "dark";
  const { PUBLIC_APP_URL } = getPublicSettings();
  const pageUrl = `${PUBLIC_APP_URL}/og/midterms-2026?theme=${theme}&non-interactive=true`;

  const screenshotServiceUrl = process.env.SCREENSHOT_SERVICE_API_URL;
  const screenshotApiKey = process.env.SCREENSHOT_SERVICE_API_KEY;

  if (!screenshotServiceUrl) {
    return NextResponse.json(
      { error: "screenshot service is not configured" },
      { status: 503 }
    );
  }

  const payload = {
    url: pageUrl,
    selector: "#id-used-by-screenshot-donot-change",
    selector_to_wait: "#id-logo-used-by-screenshot-donot-change",
    width: 1200,
    height: 630,
  };

  const screenshotEndpoint = new URL(
    "/api/screenshot/",
    screenshotServiceUrl
  ).toString();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (screenshotApiKey) {
    headers.api_key = screenshotApiKey;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    const r = await fetch(screenshotEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!r.ok) {
      // Do not leak upstream screenshot service status codes/bodies.
      return NextResponse.json(
        { error: "Upstream service error" },
        { status: 502 }
      );
    }

    const buf = await r.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control":
          process.env.NODE_ENV === "production"
            ? "public, max-age=0, s-maxage=86400, stale-while-revalidate=3600"
            : "no-store",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { error: "screenshot request timed out" },
        { status: 504 }
      );
    }
    return NextResponse.json({ error: "screenshot failed" }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}
