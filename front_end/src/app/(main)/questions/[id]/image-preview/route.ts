import { NextRequest, NextResponse } from "next/server";

import {
  ENFORCED_THEME_PARAM,
  HIDE_ZOOM_PICKER,
} from "@/constants/global_search_params";
import { logError } from "@/utils/core/errors";
import { getPublicSettings } from "@/utils/public_settings.server";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;
  const width = 1200;
  const height = 630;
  const theme = request.nextUrl.searchParams.get("theme") ?? "dark";
  const { PUBLIC_APP_URL } = getPublicSettings();

  const imageUrl = `${PUBLIC_APP_URL}/questions/embed/${id}/?${ENFORCED_THEME_PARAM}=${theme}&${HIDE_ZOOM_PICKER}=true&non-interactive=true&og=1`;

  const payload = {
    url: imageUrl,
    selector: "#id-used-by-screenshot-donot-change",
    selector_to_wait: "#id-logo-used-by-screenshot-donot-change",
    width: width,
    height: height,
  };

  try {
    const screenshotResponse = await fetch(
      `${process.env.SCREENSHOT_SERVICE_API_URL}/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          api_key: process.env.SCREENSHOT_SERVICE_API_KEY || "",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!screenshotResponse.ok) {
      const errorText = await screenshotResponse.text();
      console.error(
        `Screenshot service failed. code=${screenshotResponse.status}, response=${errorText}`
      );
      logError(
        new Error(
          `Screenshot service failed. code=${screenshotResponse.status}, response=${errorText}`
        )
      );
      return NextResponse.json(
        { error: "Failed to generate a question image." + errorText },
        { status: screenshotResponse.status }
      );
    }

    const imageData = await screenshotResponse.arrayBuffer();

    return new NextResponse(imageData, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Screenshot service error", error);
    return NextResponse.json(
      { error: "Screenshot service request failed" },
      { status: 500 }
    );
  }
}
