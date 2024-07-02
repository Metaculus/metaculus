import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const contentType = "image/png";

export default async function Image({ params }: { params: { id: number } }) {
  const headersList = headers();
  const url = headersList.get("x-url");
  if (!url) {
    return new NextResponse("Missing x-url header", { status: 400 });
  }

  const request = new NextRequest(url);
  const origin = request.nextUrl.origin;
  return await fetch(`${origin}/questions/${params.id}/api/generate-preview`);
}
