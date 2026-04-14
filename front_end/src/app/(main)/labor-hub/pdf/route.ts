import { NextRequest, NextResponse } from "next/server";

import { logError } from "@/utils/core/errors";
import { getPublicSettings } from "@/utils/public_settings.server";

export async function GET(request: NextRequest) {
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

  const pageUrl = `${PUBLIC_APP_URL}/labor-hub`;

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
        `Labor hub PDF service failed. code=${pdfResponse.status}, response=${errorText}`
      );
      logError(
        new Error(
          `Labor hub PDF service failed. code=${pdfResponse.status}, response=${errorText}`
        )
      );
      return NextResponse.json(
        { error: "Failed to generate Labor Hub PDF." + errorText },
        { status: pdfResponse.status }
      );
    }

    const pdfData = await pdfResponse.arrayBuffer();

    return new NextResponse(pdfData, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="labor-automation-hub.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Labor hub PDF service error", error);
    return NextResponse.json(
      { error: "PDF service request failed" },
      { status: 500 }
    );
  }
}
