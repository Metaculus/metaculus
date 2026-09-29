/**
 * Collects everything needed to draft a Global Health Monitor edition into front_end/.ghm/.
 *
 *   bun run ghm:inputs --since 2026-09-17
 *
 * --since  publication date of the latest edition; changes and comments are measured from it
 * --api    API base URL (defaults to METACULUS_API_BASE_URL, then https://www.metaculus.com/api)
 * METACULUS_API_TOKEN is required against metaculus.com; local dev servers accept anonymous calls.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { apiGet, ApiConfig, fetchGhmPostsFromApi, getApiConfig } from "./api";
import { PRO_FORECASTER_USERNAMES } from "../../src/app/(main)/global-health-monitor/config/pro_forecasters";
import {
  GHM_VALUE_KEYS,
  GHM_VALUES,
  ValueRef,
} from "../../src/app/(main)/global-health-monitor/config/questions";
import { GHM_PROJECT_ID } from "../../src/app/(main)/global-health-monitor/config/season";
import { getAllGhmPostIds } from "../../src/app/(main)/global-health-monitor/config/sections";
import { GHM_SOURCES } from "../../src/app/(main)/global-health-monitor/config/sources";
import {
  computeChange,
  findQuestion,
  readForecastAt,
  readLatestForecast,
} from "../../src/app/(main)/global-health-monitor/helpers/forecast_values";
import {
  formatChange,
  formatInterval,
  formatValue,
} from "../../src/app/(main)/global-health-monitor/helpers/format";
import { PostWithForecasts } from "../../src/types/post";

const SITE = "https://www.metaculus.com";
const CLOSING_SOON_DAYS = 45;

type ApiComment = {
  id: number;
  created_at: string;
  text: string;
  is_private: boolean;
  parent_id: number | null;
  author: { username: string };
};

type ListedPost = {
  id: number;
  title: string;
  notebook?: unknown;
};

function collectValues(
  posts: Map<number, PostWithForecasts>,
  sinceSeconds: number,
  nowSeconds: number
) {
  return GHM_VALUE_KEYS.map((key) => {
    const ref: ValueRef = GHM_VALUES[key];
    const post = posts.get(ref.postId);
    const question = findQuestion(post, ref);
    if (!question) {
      return { key, label: ref.label, postId: ref.postId, error: "not found" };
    }

    const latest = readLatestForecast(question, ref);
    const since = readForecastAt(question, ref, sinceSeconds, latest?.option);
    const change = computeChange(ref, latest?.value, since?.point.value);
    const closeSeconds = Date.parse(question.scheduled_close_time) / 1000;

    return {
      key,
      label: ref.label,
      postId: ref.postId,
      url: `${SITE}/questions/${ref.postId}/`,
      now: latest ? formatValue(ref, latest.value, latest.bound) : null,
      option: latest?.option ?? null,
      interval: latest ? formatInterval(ref, latest.lower, latest.upper) : null,
      atSince: since
        ? formatValue(ref, since.point.value, since.point.bound)
        : null,
      change: change
        ? { text: formatChange(change), direction: change.direction }
        : null,
      forecastUpdated: latest
        ? new Date(latest.startTime * 1000).toISOString()
        : null,
      lapsed:
        !!latest && latest.endTime !== null && latest.endTime <= nowSeconds,
      resolution: question.resolution ?? null,
      closesSoon:
        !question.resolution &&
        closeSeconds - nowSeconds < CLOSING_SOON_DAYS * 86_400,
      closes: question.scheduled_close_time,
    };
  });
}

async function collectNewPosts(config: ApiConfig) {
  const known = new Set(getAllGhmPostIds());
  const { results } = await apiGet<{ results: ListedPost[] }>(
    config,
    "/posts/",
    { tournaments: GHM_PROJECT_ID, statuses: "open", limit: 100 }
  );
  return results
    .filter((post) => !post.notebook && !known.has(post.id))
    .map(({ id, title }) => ({ id, title, url: `${SITE}/questions/${id}/` }));
}

async function collectComments(config: ApiConfig, sinceIso: string) {
  const pros = new Set(
    PRO_FORECASTER_USERNAMES.map((username) => username.toLowerCase())
  );
  const comments = [];
  for (const postId of getAllGhmPostIds()) {
    const { results } = await apiGet<{ results: ApiComment[] }>(
      config,
      "/comments/",
      { post: postId, sort: "-created_at", limit: 50, exclude_bots: true }
    );
    for (const comment of results) {
      if (comment.is_private || comment.created_at < sinceIso) {
        continue;
      }
      comments.push({
        postId,
        commentId: comment.id,
        author: comment.author.username,
        isPro: pros.has(comment.author.username.toLowerCase()),
        isReply: comment.parent_id !== null,
        createdAt: comment.created_at,
        url: `${SITE}/questions/${postId}/#comment-${comment.id}`,
        text: comment.text.slice(0, 3000),
      });
    }
  }
  return comments;
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "MetaculusGlobalHealthMonitor/1.0 (+https://www.metaculus.com/global-health-monitor/)",
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} for ${url}`);
  }
  return response.text();
}

// Machine-readable sources. HTML-only sources (WHO, USDA, ECDC measles) are read by the skill.
async function collectSources() {
  const respNetFilter =
    "age_category='Overall' AND sex='All' AND race='All' AND state='Overall' AND rate_type='Observed' AND data_type='Weekly Rate'";
  const requests: Record<string, () => Promise<unknown>> = {
    cdcRespNetWeeklyRates: async () =>
      JSON.parse(
        await fetchText(
          `https://data.cdc.gov/resource/kvib-3txy.json?$where=${encodeURIComponent(respNetFilter)}&$order=date%20DESC&$limit=40`
        )
      ),
    ecdcChikungunyaCaseSummaryCsv: async () =>
      (await fetchText("https://chik-weekly.ecdc.europa.eu/case_summary.csv"))
        .split("\n")
        .slice(0, 80)
        .join("\n"),
    cdcMeaslesCasesByYear: async () =>
      JSON.parse(
        await fetchText("https://www.cdc.gov/measles/MeaslesCasesYear.json")
      ),
    cdcMeaslesWeeklyCases: async () =>
      JSON.parse(
        await fetchText("https://www.cdc.gov/measles/weekly-cases-chart.json")
      ),
  };

  const sources: Record<string, unknown> = {};
  for (const [name, request] of Object.entries(requests)) {
    try {
      sources[name] = await request();
    } catch (error) {
      sources[name] = { error: String(error) };
    }
  }
  return sources;
}

const EXTRA_SOURCE_PAGES = {
  cdcBirdFlu: "https://www.cdc.gov/bird-flu/situation-summary/index.html",
};

const HTML_ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  "#39": "'",
  rsquo: "'",
  lsquo: "'",
  quot: '"',
  ldquo: '"',
  rdquo: '"',
};

function htmlToText(html: string) {
  return (
    html
      .replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1[^>]*>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      // One pass, so "&amp;quot;" becomes "&quot;" rather than being unescaped twice.
      .replace(
        /&(nbsp|amp|#39|rsquo|lsquo|quot|ldquo|rdquo);/g,
        (entity, name: string) => HTML_ENTITIES[name] ?? entity
      )
      .replace(/\s+/g, " ")
      .trim()
  );
}

// Plain text of the source pages the edition cites, so drafting needs no open web access.
async function collectSourcePages() {
  const pages: Record<string, { url: string; text?: string; error?: string }> =
    {};
  const urls = {
    ...Object.fromEntries(
      Object.entries(GHM_SOURCES).map(([id, source]) => [id, source.url])
    ),
    ...EXTRA_SOURCE_PAGES,
  };
  for (const [id, url] of Object.entries(urls)) {
    try {
      pages[id] = {
        url,
        text: htmlToText(await fetchText(url)).slice(0, 8000),
      };
    } catch (error) {
      pages[id] = { url, error: String(error) };
    }
  }
  return pages;
}

function toMarkdown(inputs: {
  since: string;
  collectedAt: string;
  values: ReturnType<typeof collectValues>;
  newPosts: Awaited<ReturnType<typeof collectNewPosts>>;
  comments: Awaited<ReturnType<typeof collectComments>>;
}) {
  const lines = [
    `# Global Health Monitor inputs (since ${inputs.since})`,
    "",
    `Collected ${inputs.collectedAt}.`,
    "",
    "| Value | Now | At last edition | Change | Notes |",
    "|---|---|---|---|---|",
  ];
  for (const value of inputs.values) {
    if ("error" in value) {
      lines.push(`| ${value.label} | – | – | – | ${value.error} |`);
      continue;
    }
    const notes = [
      value.lapsed ? "CP lapsed" : null,
      value.resolution ? `resolved: ${value.resolution}` : null,
      value.closesSoon ? `closes ${value.closes.slice(0, 10)}` : null,
    ].filter(Boolean);
    lines.push(
      `| [${value.label}](${value.url}) | ${value.now ?? "–"}${value.interval ? ` (${value.interval})` : ""} | ${value.atSince ?? "–"} | ${value.change ? `${value.change.text} (${value.change.direction})` : "–"} | ${notes.join("; ")} |`
    );
  }
  lines.push("", "## New open questions not in config", "");
  lines.push(
    ...(inputs.newPosts.length
      ? inputs.newPosts.map((post) => `- [${post.title}](${post.url})`)
      : ["None."])
  );
  lines.push("", "## Comments since the last edition", "");
  const pro = inputs.comments.filter((comment) => comment.isPro);
  lines.push(
    `${inputs.comments.length} comments, ${pro.length} from Pro Forecasters (see inputs.json for text).`
  );
  return lines.join("\n") + "\n";
}

async function main() {
  const { values: args } = parseArgs({
    options: {
      since: { type: "string" },
      api: { type: "string" },
      out: { type: "string", default: ".ghm" },
    },
  });
  if (!args.since || !/^\d{4}-\d{2}-\d{2}$/.test(args.since)) {
    throw new Error("Pass --since YYYY-MM-DD (the latest edition's date).");
  }

  const config = getApiConfig(args.api);
  const sinceIso = `${args.since}T00:00:00Z`;
  const nowSeconds = Math.floor(Date.now() / 1000);

  const posts = await fetchGhmPostsFromApi(config);
  const inputs = {
    since: args.since,
    collectedAt: new Date().toISOString(),
    values: collectValues(posts, Date.parse(sinceIso) / 1000, nowSeconds),
    newPosts: await collectNewPosts(config),
    comments: await collectComments(config, sinceIso),
    sources: await collectSources(),
    sourcePages: await collectSourcePages(),
  };

  const outDir = path.resolve(process.cwd(), args.out ?? ".ghm");
  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, "inputs.json"),
    JSON.stringify(inputs, null, 2)
  );
  await writeFile(path.join(outDir, "inputs.md"), toMarkdown(inputs));
  console.log(
    `Wrote ${path.join(outDir, "inputs.json")} and inputs.md: ${inputs.values.length} values, ${inputs.comments.length} comments, ${inputs.newPosts.length} new questions.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
