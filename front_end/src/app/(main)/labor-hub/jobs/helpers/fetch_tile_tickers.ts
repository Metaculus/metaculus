import { cache } from "react";

import ServerCommentsApi from "@/services/api/comments/comments.server";
import { logError } from "@/utils/core/errors";

import { JOBS_DATA } from "../../data";

const MIN_LENGTH = 60;
const MAX_LENGTH = 180;

function strip(text: string): string {
  const firstPara = text.split(/\n\s*\n/)[0] ?? text;
  return firstPara
    .replace(/^\s*[>*-]\s*/g, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/[*_`#]+/g, "")
    .trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : max)}…`;
}

async function fetchTopForPost(postId: number): Promise<string | null> {
  try {
    const response = await ServerCommentsApi.getComments({
      post: postId,
      sort: "-vote_score",
      exclude_bots: true,
      limit: 1,
      parent_isnull: true,
    });
    const top = response.results.find((c) => !c.is_soft_deleted);
    if (!top) return null;
    const stripped = strip(top.text);
    if (stripped.length < MIN_LENGTH) return null;
    return truncate(stripped, MAX_LENGTH);
  } catch (err) {
    logError(err);
    return null;
  }
}

export const fetchTileTickers = cache(
  async (): Promise<Record<string, string | null>> => {
    const entries = await Promise.all(
      JOBS_DATA.map(async (job) => {
        const ticker =
          job.curated_insights?.[0]?.body ??
          (await fetchTopForPost(job.post_id));
        return [job.slug, ticker] as const;
      })
    );
    return Object.fromEntries(entries);
  }
);
