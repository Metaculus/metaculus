"use client";
import { useTranslations } from "next-intl";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { CoherenceLinksContext } from "@/app/(main)/components/coherence_links_provider";
import ClientPostsApi from "@/services/api/posts/posts.client";
import type { FetchedAggregateCoherenceLink } from "@/types/coherence";
import type { KeyFactor } from "@/types/comment";
import type { PostWithForecasts } from "@/types/post";
import {
  AggregationMethod,
  Question,
  QuestionType,
  QuestionWithNumericForecasts,
} from "@/types/question";
import cn from "@/utils/core/cn";

import {
  KeyFactorTileBaseRateFreqView,
  KeyFactorTileBaseRateTrendView,
  KeyFactorTileDriverView,
  KeyFactorTileNewsView,
  KeyFactorTileQuestionLinkView,
  type Props as KfDisplayProps,
} from "./key_factor_tile_view";
import { isDisplayableQuestionLink } from "../utils";

type Props = {
  post: Pick<PostWithForecasts, "id" | "key_factors">;
  maxItems?: number;
  className?: string;
};

const KF_COMPONENTS = {
  driver: KeyFactorTileDriverView,
  news: KeyFactorTileNewsView,
  baseRateTrend: KeyFactorTileBaseRateTrendView,
  baseRateFreq: KeyFactorTileBaseRateFreqView,
} satisfies Record<string, React.FC<KfDisplayProps>>;

function pickKfComponent(kf: KeyFactor): React.FC<KfDisplayProps> {
  const brType = kf.base_rate?.type;
  if (brType === "trend") return KF_COMPONENTS.baseRateTrend;
  if (brType === "frequency") return KF_COMPONENTS.baseRateFreq;
  if (kf.news) return KF_COMPONENTS.news;
  return KF_COMPONENTS.driver;
}

const MAX_DEFAULT = 3;

type QuestionWithCP = Question & {
  community_prediction?: number | null;
  median?: number | null;
};

const KeyFactorsTileView: React.FC<Props> = ({
  post,
  maxItems = MAX_DEFAULT,
  className,
}) => {
  const t = useTranslations();
  const [expandedIds, setExpandedIds] = useState<Array<KeyFactor["id"]>>([]);
  const [isQuestionLinkExpanded, setIsQuestionLinkExpanded] = useState(false);

  const coherenceCtx = useContext(CoherenceLinksContext);

  const aggregateLinks = useMemo<FetchedAggregateCoherenceLink[]>(() => {
    if (!coherenceCtx?.aggregateCoherenceLinks) return [];
    return coherenceCtx.aggregateCoherenceLinks.data ?? [];
  }, [coherenceCtx]);

  const questionLinkAggregates = useMemo(
    () => (aggregateLinks ?? []).filter(isDisplayableQuestionLink),
    [aggregateLinks]
  );

  const primaryQuestionLink = useMemo(() => {
    if (!questionLinkAggregates.length) return null;

    const sorted = [...questionLinkAggregates].sort((a, b) => {
      const linksDiff = (b.links_nr ?? 0) - (a.links_nr ?? 0);
      if (linksDiff !== 0) return linksDiff;
      return (b.strength ?? 0) - (a.strength ?? 0);
    });

    return sorted[0];
  }, [questionLinkAggregates]);

  const otherQuestion = useMemo<QuestionWithCP | null>(() => {
    if (!primaryQuestionLink) return null;

    const { question1, question2 } = primaryQuestionLink;
    let other: QuestionWithCP | undefined = (question1 ?? question2) as
      | QuestionWithCP
      | undefined;

    if (question1?.post_id === post.id && question2) {
      other = question2 as QuestionWithCP;
    } else if (question2?.post_id === post.id && question1) {
      other = question1 as QuestionWithCP;
    }

    if (!other || !other.title) return null;
    return other;
  }, [primaryQuestionLink, post.id]);

  const [binaryLabel, setBinaryLabel] = useState<string | null>(null);

  useEffect(() => {
    setBinaryLabel(null);

    if (!otherQuestion) return;
    if (otherQuestion.type !== QuestionType.Binary) return;

    let cancelled = false;

    const applyProb = (rawProb?: number | null) => {
      if (cancelled || typeof rawProb !== "number") return;
      const pct = Math.round(rawProb * 100);
      setBinaryLabel(`${pct}% ${t("chance")}`);
    };

    const inlineCP = getBinaryCPFromQuestion(otherQuestion);
    if (inlineCP != null) {
      applyProb(inlineCP);
      return;
    }

    const fetchCP = async () => {
      try {
        if (otherQuestion.post_id) {
          const otherPost = await ClientPostsApi.getPost(
            otherQuestion.post_id,
            true
          );
          if (cancelled) return;
          const q = otherPost.question as Question | undefined;
          applyProb(getBinaryCPFromQuestion(q));
          return;
        }

        if (otherQuestion.id) {
          const q = (await ClientPostsApi.getQuestion(
            otherQuestion.id,
            true
          )) as Question;
          if (cancelled) return;
          applyProb(getBinaryCPFromQuestion(q));
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load CP for question link tile", error);
        }
      }
    };

    void fetchCP();

    return () => {
      cancelled = true;
    };
  }, [otherQuestion, t]);

  const onToggleQuestionLink = useCallback(() => {
    setIsQuestionLinkExpanded((prev) => !prev);
  }, []);

  const questionLinkDisplay = useMemo(() => {
    if (!primaryQuestionLink || !otherQuestion) return null;

    const isBinary = otherQuestion.type === QuestionType.Binary;
    const label = isBinary && binaryLabel ? binaryLabel : null;

    return (
      <li key={`question-link-tile-${primaryQuestionLink.id}`}>
        <KeyFactorTileQuestionLinkView
          kf={{} as KeyFactor}
          label={label}
          title={otherQuestion.title}
          expanded={isQuestionLinkExpanded}
          onToggle={onToggleQuestionLink}
        />
      </li>
    );
  }, [
    primaryQuestionLink,
    otherQuestion,
    binaryLabel,
    isQuestionLinkExpanded,
    onToggleQuestionLink,
  ]);

  const items = useMemo(
    () =>
      [...(post.key_factors ?? [])]
        .sort((a, b) => score(b) - score(a))
        .slice(0, maxItems),
    [post.key_factors, maxItems]
  );

  const onToggle = useCallback((id: KeyFactor["id"]) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  if (items.length === 0 && !questionLinkDisplay) return null;

  return (
    <div className={cn("mt-4", className)}>
      <p className="my-0 mb-3 text-[10px] font-medium uppercase text-gray-500 dark:text-gray-500-dark">
        {t("keyFactors")}
      </p>

      <ul className="flex flex-col gap-1">
        {questionLinkDisplay}

        {items.map((kf) => {
          const expanded = expandedIds.includes(kf.id);
          const Display = pickKfComponent(kf);

          return (
            <li key={kf.id}>
              <Display
                kf={kf}
                expanded={expanded}
                onToggle={() => onToggle(kf.id)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

function getBinaryCPFromQuestion(
  question?: Question | QuestionWithCP | null
): number | null {
  if (!question || question.type !== QuestionType.Binary) return null;

  const numericQ = question as QuestionWithNumericForecasts;

  const defaultMethod =
    numericQ.default_aggregation_method as AggregationMethod;
  const agg =
    numericQ.aggregations[defaultMethod] ??
    numericQ.aggregations.recency_weighted;

  const latest = agg?.latest;
  if (!latest) return null;

  const center = latest.centers?.[0];
  if (typeof center === "number") return center;

  const mean = latest.means?.[0];
  if (typeof mean === "number") return mean;

  return null;
}

const score = (kf: KeyFactor) => (kf.freshness ?? 0) * 10;

export default KeyFactorsTileView;
