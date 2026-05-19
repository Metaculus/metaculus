import { NextRequest, NextResponse } from "next/server";

import { ALL_JOB_SLUGS } from "@/app/(main)/labor-hub/data";
import { getPublicSettings } from "@/utils/public_settings.server";

type Params = { slug: string };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { slug } = await params;
  if (!ALL_JOB_SLUGS.includes(slug)) {
    return NextResponse.json({ error: "unknown job" }, { status: 404 });
  }

  const year = req.nextUrl.searchParams.get("year") ?? "2035";
  const download = req.nextUrl.searchParams.get("download") === "1";

  const { PUBLIC_APP_URL } = getPublicSettings();
  const pageUrl = `${PUBLIC_APP_URL}/og/labor-hub/jobs/${slug}?year=${encodeURIComponent(year)}&non-interactive=true`;

  const screenshotEndpoint = new URL(
    "/api/screenshot/",
    process.env.SCREENSHOT_SERVICE_API_URL
  ).toString();

  const payload = {
    url: pageUrl,
    selector: "#id-used-by-screenshot-donot-change",
    selector_to_wait: "#id-used-by-screenshot-donot-change",
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
    const headers: Record<string, string> = {
      "Content-Type": "image/png",
      "Cache-Control":
        process.env.NODE_ENV === "production"
          ? "public, max-age=0, s-maxage=86400, stale-while-revalidate=3600"
          : "no-store",
    };
    if (download) {
      headers["Content-Disposition"] =
        `attachment; filename="metaculus-${slug}-${year}.png"`;
    }
    return new NextResponse(buf, {
      status: 200,
      headers,
    });
  } catch {
    return NextResponse.json({ error: "screenshot failed" }, { status: 500 });
  }
}
