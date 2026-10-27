import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { logError } from "@/utils/core/errors";
import { getPublicSettings } from "@/utils/public_settings.server";

/**
 * Renders a dashboard page to PDF through the screenshot service.
 * `path` is the app-relative page path, including any query string.
 */
export async function renderHubPdf({
  request,
  path,
  fileName,
  label,
}: {
  request: NextRequest;
  path: string;
  fileName: string;
  label: string;
}) {
  const serviceUrl = process.env.SCREENSHOT_SERVICE_API_URL;
  if (!serviceUrl) {
    return NextResponse.json(
      { error: "PDF service is not configured." },
      { status: 503 }
    );
  }

  const paperFormat =
    request.nextUrl.searchParams.get("paper_format") ?? "Letter";
  const landscape = request.nextUrl.searchParams.get("landscape") === "true";

  const { PUBLIC_APP_URL } = getPublicSettings();

  const pageUrl = `${PUBLIC_APP_URL.replace(/\/$/, "")}${path}`;

  const pdfEndpoint = new URL("/api/pdf/", serviceUrl).toString();

  const payload = {
    url: pageUrl,
    paper_format: paperFormat,
    landscape,
  };

  try {
    const pdfResponse = await fetch(pdfEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: process.env.SCREENSHOT_SERVICE_API_KEY || "",
      },
      body: JSON.stringify(payload),
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error(
        `${label} PDF service failed. code=${pdfResponse.status}, response=${errorText}`
      );
      logError(
        new Error(
          `${label} PDF service failed. code=${pdfResponse.status}, response=${errorText}`
        )
      );
      return NextResponse.json(
        { error: `Failed to generate ${label} PDF.` + errorText },
        { status: pdfResponse.status }
      );
    }

    const pdfData = await pdfResponse.arrayBuffer();

    return new NextResponse(pdfData, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(`${label} PDF service error`, error);
    return NextResponse.json(
      { error: "PDF service request failed" },
      { status: 500 }
    );
  }
}
