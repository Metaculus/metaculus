import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

import { ENFORCED_THEME_PARAM } from "@/constants/global_search_params";
import { COOKIE_NAME_DEV_TOKEN } from "@/services/session";
import { getAlphaAccessToken } from "@/utils/alpha_access";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: 1200,
      height: 630,
    },
    args: [`--window-size=1200,630`],
  });
  const page = await browser.newPage();

  const alphaAccessToken = await getAlphaAccessToken();
  if (alphaAccessToken) {
    console.log("alphaAccessToken", alphaAccessToken);

    await page.setCookie({
      name: COOKIE_NAME_DEV_TOKEN,
      value: alphaAccessToken,
      domain: new URL(req.nextUrl.origin).hostname,
      path: "/",
    });
  }

  const url = `${req.nextUrl.origin}/embed/questions/${params.id}?${ENFORCED_THEME_PARAM}=dark&non-interactive=true`;
  await page.goto(url, { waitUntil: "networkidle0" });
  const element = await page.$("#id-used-by-screenshot-donot-change");

  if (!element) {
    await browser.close();
    return new NextResponse("Element not found", { status: 404 });
  }

  const screenshot = await element.screenshot({ type: "png" });

  await browser.close();

  return new NextResponse(screenshot, {
    headers: {
      "Content-Type": "image/png",
    },
  });
}
