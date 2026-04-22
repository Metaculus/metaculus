import { NextRequest, NextResponse } from "next/server";

import { getPublicSettings } from "@/utils/public_settings.server";

export async function GET(req: NextRequest) {
  const theme = req.nextUrl.searchParams.get("theme") ?? "dark";

  const { PUBLIC_APP_URL } = getPublicSettings();

  const pageUrl = `${PUBLIC_APP_URL}/og/labor-hub?theme=${theme}&non-interactive=true`;

  const screenshotEndpoint = new URL(
    "/api/screenshot/",
    process.env.SCREENSHOT_SERVICE_API_URL
  ).toString();

  const payload = {
    url: pageUrl,
    selector: "#id-used-by-screenshot-donot-change",
    selector_to_wait: "#id-logo-used-by-screenshot-donot-change",
    width: 1200,
    height: 630,
  };

  try {
    const r = await fetch(screenshotEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: process.env.SCREENSHOT_SERVICE_API_KEY || "",
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json({ error: text }, { status: r.status });
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
  } catch {
    return NextResponse.json({ error: "screenshot failed" }, { status: 500 });
  }
}
