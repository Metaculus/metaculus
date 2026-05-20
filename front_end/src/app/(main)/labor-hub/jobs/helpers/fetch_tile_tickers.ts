import { cache } from "react";

import ServerCommentsApi from "@/services/api/comments/comments.server";
import { logError } from "@/utils/core/errors";

import { JOBS_DATA } from "../../data";

const MIN_LENGTH = 60;
const MAX_LENGTH = 180;

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function strip(text: string): string {
  let s = text;
  s = s.replace(/!\[[^\]]*?\]\([^)]+?\)/g, "");
  s = s.replace(/\[([^\]]+?)\]\([^)]+?\)/g, "$1");
  s = s.replace(/\\([[\]()*_`#])/g, "$1");
  s = s.replace(/^.*\|.*\|.*$/gm, "");
  s = s.replace(/^[\s\-=*]{3,}$/gm, "");
  s = s.replace(/[*_`#]+/g, "");
  s = s.replace(/^\s*[>*\-+]\s*/gm, "");
  s = s.replace(/<\/?[^>]+>/g, "");
  s = decodeEntities(s);
  const paragraphs = s
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const firstPara = paragraphs[0] ?? "";
  return firstPara.replace(/\s+/g, " ").trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : max)}…`;
}

async function fetchTopForPost(
  postId: number,
  excludedIds: Set<number>
): Promise<string | null> {
  try {
    const response = await ServerCommentsApi.getComments({
      post: postId,
      sort: "-vote_score",
      exclude_bots: true,
      limit: 5,
      parent_isnull: true,
    });
    const top = response.results.find(
      (c) => !c.is_soft_deleted && !excludedIds.has(c.id)
    );
    if (!top) return null;
    const stripped = strip(top.text);
    if (stripped.length < MIN_LENGTH) return null;
    return truncate(stripped, MAX_LENGTH);
  } catch (err) {
    logError(err);
    return null;
  }
}

async function resolveTickers(): Promise<Record<string, string | null>> {
  const entries = await Promise.all(
    JOBS_DATA.map(async (job) => {
      const excluded = new Set(job.excluded_comment_ids ?? []);
      const ticker =
        job.curated_insights?.[0]?.body ??
        (await fetchTopForPost(job.post_id, excluded));
      return [job.slug, ticker] as const;
    })
  );
  return Object.fromEntries(entries);
}

export const fetchTileTickers = cache(resolveTickers);
