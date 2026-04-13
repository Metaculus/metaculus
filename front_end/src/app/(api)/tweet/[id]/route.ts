import { NextRequest, NextResponse } from "next/server";
import { fetchTweet } from "react-tweet/api";

const CACHE_MAX_AGE = 86400; // 24 hours
const CACHE_STALE_WHILE_REVALIDATE = 604800; // 7 days

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cacheHeaders = {
    "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`,
  };

  try {
    const result = await fetchTweet(id, {
      next: { revalidate: CACHE_MAX_AGE },
    } as RequestInit);

    if (result.notFound || result.tombstone) {
      return NextResponse.json({ data: null }, { status: 404 });
    }

    return NextResponse.json(
      { data: result.data ?? null },
      { headers: cacheHeaders }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch tweet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
