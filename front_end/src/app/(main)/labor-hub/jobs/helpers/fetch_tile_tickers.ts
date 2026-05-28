import { cache } from "react";

import ServerCommentsApi from "@/services/api/comments/comments.server";
import { logError } from "@/utils/core/errors";

import { JOBS_DATA } from "../../data";

const MIN_LENGTH = 60;
const MAX_LENGTH = 180;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/**
 * Decodes HTML entities for PLAIN-TEXT contexts only — never feed the result
 * into dangerouslySetInnerHTML. Uses a single-pass replacement so sequences
 * like "&amp;lt;" decode once (→ "&lt;") rather than double-decoding to "<".
 */
function decodeEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g,
    (match, entity: string) => {
      if (entity.startsWith("#x"))
        return String.fromCharCode(parseInt(entity.slice(2), 16));
      if (entity.startsWith("#"))
        return String.fromCharCode(parseInt(entity.slice(1), 10));
      return NAMED_ENTITIES[entity] ?? match;
    }
  );
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
  // Decode entities first (may introduce '<' / '>'), then strip every angle
  // bracket so no HTML tag syntax can survive or re-form (plain-text output).
  s = decodeEntities(s);
  s = s.replace(/[<>]/g, "");
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

/** Returns the qualifying ticker candidates for a post, best-voted first. */
async function fetchCandidatesForPost(
  postId: number,
  excludedIds: Set<number>
): Promise<string[]> {
  try {
    const response = await ServerCommentsApi.getComments({
      post: postId,
      sort: "-vote_score",
      exclude_bots: true,
      limit: 5,
      parent_isnull: true,
    });
    return response.results
      .filter((c) => !c.is_soft_deleted && !excludedIds.has(c.id))
      .map((c) => truncate(strip(c.text), MAX_LENGTH))
      .filter((text) => text.length >= MIN_LENGTH);
  } catch (err) {
    logError(err);
    return [];
  }
}

async function resolveTickers(): Promise<Record<string, string | null>> {
  // 1. Gather candidates per job in parallel.
  const perJob = await Promise.all(
    JOBS_DATA.map(async (job) => {
      const curated = job.curated_insights?.[0]?.body;
      if (curated) return { slug: job.slug, candidates: [curated] };
      const excluded = new Set(job.excluded_comment_ids ?? []);
      const candidates = await fetchCandidatesForPost(job.post_id, excluded);
      return { slug: job.slug, candidates };
    })
  );

  // 2. Assign, preferring a comment not already shown on another tile so the
  //    same boilerplate comment doesn't slide across many tiles at once.
  const used = new Set<string>();
  const result: Record<string, string | null> = {};
  for (const { slug, candidates } of perJob) {
    const unique = candidates.find((c) => !used.has(c));
    const pick = unique ?? candidates[0] ?? null;
    if (pick) used.add(pick);
    result[slug] = pick;
  }
  return result;
}

export const fetchTileTickers = cache(resolveTickers);
