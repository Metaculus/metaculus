import { NextRequest, NextResponse } from "next/server";

import { ALL_JOB_SLUGS } from "@/app/(main)/labor-hub/data";
import { WALL_YEARS } from "@/app/(main)/labor-hub/jobs/helpers/wall_types";
import { getPublicSettings } from "@/utils/public_settings.server";

type Params = { slug: string };

const SCREENSHOT_TIMEOUT_MS = 15_000;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { slug } = await params;
  if (!ALL_JOB_SLUGS.includes(slug)) {
    return NextResponse.json({ error: "unknown job" }, { status: 404 });
  }

  // Clamp the year param to the canonical allowlist before it lands in URLs
  // or in the Content-Disposition filename.
  const yearParam = req.nextUrl.searchParams.get("year") ?? "2035";
  const year = (WALL_YEARS as readonly string[]).includes(yearParam)
    ? yearParam
    : "2035";
  const download = req.nextUrl.searchParams.get("download") === "1";

  const { PUBLIC_APP_URL } = getPublicSettings();
  const pageUrl = `${PUBLIC_APP_URL}/og/labor-hub/jobs/${slug}?year=${encodeURIComponent(year)}&non-interactive=true`;

  const apiBase = process.env.SCREENSHOT_SERVICE_API_URL;
  if (!apiBase) {
    return NextResponse.json(
      { error: "screenshot service not configured" },
      { status: 500 }
    );
  }
  let screenshotEndpoint: string;
  try {
    screenshotEndpoint = new URL("/api/screenshot/", apiBase).toString();
  } catch {
    return NextResponse.json(
      { error: "screenshot service URL invalid" },
      { status: 500 }
    );
  }

  const payload = {
    url: pageUrl,
    selector: "#id-used-by-screenshot-donot-change",
    selector_to_wait: "#id-used-by-screenshot-donot-change",
    width: 1200,
    height: 630,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCREENSHOT_TIMEOUT_MS);

  try {
    const r = await fetch(screenshotEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: process.env.SCREENSHOT_SERVICE_API_KEY || "",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

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
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { error: "screenshot timed out" },
        { status: 504 }
      );
    }
    return NextResponse.json({ error: "screenshot failed" }, { status: 500 });
  }
}
