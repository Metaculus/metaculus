"use client";

import { isValid, parse, parseISO, fromUnixTime } from "date-fns";

import { ImpactDirectionCategory } from "@/types/comment";
import type { NewsArticle } from "@/types/news";
import { QuestionType } from "@/types/question";

export const firstVisible = (sel: string) => {
  return (
    [...document.querySelectorAll(sel)].find((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return (
        r.width &&
        r.height &&
        s.display !== "none" &&
        s.visibility === "visible"
      );
    }) || null
  );
};

export const convertNumericImpactToDirectionCategory = (
  impactDirection: -1 | 1 | null,
  certainty: -1 | null,
  questionType: QuestionType
): ImpactDirectionCategory | null => {
  if (certainty === -1) {
    return ImpactDirectionCategory.IncreaseUncertainty;
  }

  switch (questionType) {
    case QuestionType.Binary:
    case QuestionType.MultipleChoice:
      return impactDirection === -1
        ? ImpactDirectionCategory.Decrease
        : ImpactDirectionCategory.Increase;

    case QuestionType.Numeric:
    case QuestionType.Discrete:
      return impactDirection === -1
        ? ImpactDirectionCategory.Less
        : ImpactDirectionCategory.More;

    case QuestionType.Date:
      return impactDirection === -1
        ? ImpactDirectionCategory.Earlier
        : ImpactDirectionCategory.Later;

    default:
      return null;
  }
};

function normalizeToIsoDate(raw: unknown): string {
  const fallback = () => new Date().toISOString();
  if (!raw) return fallback();
  if (raw instanceof Date) {
    return isValid(raw) ? raw.toISOString() : fallback();
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return fallback();

    const isoDate = parseISO(trimmed);
    if (isValid(isoDate)) return isoDate.toISOString();

    const withT = trimmed.replace(" ", "T");

    let parsed = parse(withT, "yyyy-MM-dd'T'HH:mm:ss", new Date());
    if (!isValid(parsed)) {
      parsed = parse(withT, "yyyy-MM-dd'T'HH:mm", new Date());
    }
    if (isValid(parsed)) return parsed.toISOString();
  }

  if (typeof raw === "number" && !Number.isNaN(raw)) {
    const d = raw > 1e12 ? new Date(raw) : fromUnixTime(raw);

    if (isValid(d)) return d.toISOString();
  }

  return fallback();
}

export async function fetchNewsPreview(
  url: string,
  signal?: AbortSignal
): Promise<NewsArticle | null> {
  const effectiveUrl = url.trim();
  if (!effectiveUrl) return null;

  try {
    const res = await fetch(
      `/link-preview?url=${encodeURIComponent(effectiveUrl)}`,
      { signal }
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();

    const publishedRaw =
      data.published ?? data.publishedAt ?? data.pubDate ?? data.date ?? null;

    const createdAtIso = normalizeToIsoDate(publishedRaw);

    const preview: NewsArticle = {
      id: Date.now(),
      url: data.url ?? effectiveUrl,
      title: data.title ?? effectiveUrl,
      favicon_url: data.logo ?? data.favicon ?? "",
      media_label: data.siteName ?? data.source ?? "",
      created_at: createdAtIso,
    } as NewsArticle;

    return preview;
  } catch {
    if (signal?.aborted) return null;
    return null;
  }
}
