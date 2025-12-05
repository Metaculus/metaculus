"use client";

import { fromUnixTime, isValid, parse, parseISO } from "date-fns";

import { FetchedAggregateCoherenceLink } from "@/types/coherence";
import {
  CommentType,
  ImpactDirectionCategory,
  KeyFactor,
} from "@/types/comment";
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

export const openKeyFactorsSectionAndScrollTo = ({
  selector,
  attempts = 15,
  offset = 55,
  mobileOnly = false,
}: {
  selector: string;
  attempts?: number;
  offset?: number;
  mobileOnly?: boolean;
}) => {
  if (typeof window === "undefined") return;
  if (mobileOnly && window.innerWidth >= 640) return;

  const scrollWhenReady = (attemptsLeft: number) => {
    if (attemptsLeft <= 0) return;

    const sectionEl = document.getElementById("key-factors-section-toggle");
    if (sectionEl?.getAttribute("data-headlessui-state") !== "open") {
      sectionEl?.querySelector("button")?.click();
    }

    const el = firstVisible(selector);

    if (el) {
      const rect = el.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY - offset;

      if (!document.body.contains(el)) return;

      el.classList.remove(
        "kf-scroll-highlight-static",
        "kf-scroll-highlight-fade"
      );

      el.classList.add("kf-scroll-highlight-static");

      window.scrollTo({
        top: absoluteTop,
        behavior: "smooth",
      });

      const fadeDelay = 800;
      const fadeDuration = 450;

      window.setTimeout(() => {
        if (!document.body.contains(el)) return;

        el.classList.remove("kf-scroll-highlight-static");
        el.classList.add("kf-scroll-highlight-fade");

        window.setTimeout(() => {
          el.classList.remove("kf-scroll-highlight-fade");
        }, fadeDuration + 50);
      }, fadeDelay);

      return;
    }

    setTimeout(() => scrollWhenReady(attemptsLeft - 1), 100);
  };

  scrollWhenReady(attempts);
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

export function updateCommentKeyFactors(
  comment: CommentType,
  targetId: number,
  newKeyFactors: KeyFactor[]
): CommentType {
  if (comment.id === targetId) {
    return { ...comment, key_factors: newKeyFactors };
  }
  if (comment.children?.length) {
    return {
      ...comment,
      children: comment.children.map((child) =>
        updateCommentKeyFactors(child, targetId, newKeyFactors)
      ),
    };
  }
  return comment;
}

export function normalizeUrlForComparison(raw: string): string {
  if (!raw) return "";
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    if (u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return raw.trim();
  }
}

export function isDisplayableQuestionLink(it: FetchedAggregateCoherenceLink) {
  return (
    (it.links_nr ?? 0) > 1 && it.strength !== null && it.direction !== null
  );
}
