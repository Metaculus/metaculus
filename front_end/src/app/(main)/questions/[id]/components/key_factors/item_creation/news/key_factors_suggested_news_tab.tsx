"use client";

import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

import Button from "@/components/ui/button";
import ClientPostsApi from "@/services/api/posts/posts.client";
import type { ImpactMetadata } from "@/types/comment";
import type { NewsArticle } from "@/types/news";
import type { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";

import KeyFactorSuggestedNewsItem from "./key_factor_suggested_news_item";
import { useKeyFactorsCtx } from "../../key_factors_context";
import { normalizeUrlForComparison } from "../../utils";
import { Target } from "../driver/option_target_picker";

const VISIBLE_STEP = 3;

type Props = {
  post: PostWithForecasts;
  articles: NewsArticle[];
  selectedId: number | null;
  selectedImpact: ImpactMetadata;
  target: Target;
  onTargetChange: Dispatch<SetStateAction<Target>>;
  setSelectedImpact: Dispatch<SetStateAction<ImpactMetadata>>;
  setArticles: Dispatch<SetStateAction<NewsArticle[]>>;
  setSelectedId: Dispatch<SetStateAction<number | null>>;
  existingNewsUrls: string[];
};

const KeyFactorsSuggestedNewsTab: React.FC<Props> = ({
  post,
  articles,
  selectedId,
  selectedImpact,
  setSelectedImpact,
  setArticles,
  setSelectedId,
  target,
  onTargetChange,
  existingNewsUrls,
}) => {
  const t = useTranslations();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(VISIBLE_STEP);
  const [loading, setLoading] = useState(true);

  const { isPending } = useKeyFactorsCtx();

  useEffect(() => {
    let mounted = true;

    if (articles.length > 0) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await ClientPostsApi.getRelatedNews(post.id);
        if (!mounted) return;
        const list = res ?? [];

        const filtered = list.filter((a) => {
          const normalized = normalizeUrlForComparison(a.url);
          return !existingNewsUrls.includes(normalized);
        });

        setArticles(filtered);
        setVisibleCount(
          Math.min(VISIBLE_STEP, filtered.length || VISIBLE_STEP)
        );

        setSelectedId(null);
        setSelectedImpact({ impact_direction: null, certainty: null });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    post.id,
    setArticles,
    setSelectedId,
    existingNewsUrls,
    setSelectedImpact,
    articles.length,
  ]);

  const visibleArticles = articles.slice(0, visibleCount);
  const hasMore = visibleCount < articles.length;

  if (loading)
    return (
      <div className="py-8 text-center">
        <FontAwesomeIcon
          className="animate-spin text-[20px] text-blue-500 dark:text-blue-500-dark"
          icon={faSpinner}
        />
      </div>
    );
  if (!articles.length) return <div className="py-8 text-center">no found</div>;

  return (
    <div className="flex min-h-0 grow flex-col gap-[14px]">
      <div
        ref={scrollRef}
        role="radiogroup"
        className="flex flex-col gap-3 pr-1 sm:max-h-[60vh] sm:overflow-y-auto"
      >
        {visibleArticles.map((a) => {
          const isSelected = selectedId === a.id;
          return (
            <KeyFactorSuggestedNewsItem
              post={post}
              target={target}
              onTargetChange={onTargetChange}
              key={a.id}
              article={a}
              selected={isSelected}
              impact={
                isSelected
                  ? selectedImpact
                  : { impact_direction: null, certainty: null }
              }
              onToggleSelect={(id) =>
                setSelectedId((curr) => {
                  if (curr === id) {
                    setSelectedImpact({
                      impact_direction: null,
                      certainty: null,
                    });
                    return null;
                  }
                  setSelectedImpact({
                    impact_direction: null,
                    certainty: null,
                  });
                  return id;
                })
              }
              onSelectImpact={(_, meta) => {
                setSelectedId(a.id);
                setSelectedImpact({
                  impact_direction: meta.impact_direction,
                  certainty: meta.certainty,
                });
              }}
              questionType={
                post.question?.type ??
                post.group_of_questions?.questions?.[0]?.type ??
                QuestionType.Binary
              }
              unit={post.question?.unit}
            />
          );
        })}
      </div>

      {hasMore && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setVisibleCount(articles.length);
            requestAnimationFrame(() => {
              const el = scrollRef.current;
              if (!el) return;
              el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
            });
          }}
          className="mr-auto border-blue-400 text-blue-700 dark:border-blue-400-dark dark:text-blue-700-dark"
          disabled={isPending}
        >
          {t("showNMore", { count: articles.length - visibleCount })}
        </Button>
      )}
    </div>
  );
};

export default KeyFactorsSuggestedNewsTab;
