"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import Button from "@/components/ui/button";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { BECommentType } from "@/types/comment";
import { NewsDraft } from "@/types/key_factors";
import { NewsArticle } from "@/types/news";
import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";

import KeyFactorSuggestedNewsItem from "../../item_creation/news/key_factor_suggested_news_item";
import { useKeyFactorsCtx } from "../../key_factors_context";
import KeyFactorsModalFooter from "../key_factors_modal_footer";

type Props = {
  post: PostWithForecasts;
  onClose: () => void;
  onSuccess?: (c: BECommentType) => void;
};

const VISIBLE_STEP = 3;

const KeyFactorsNewsCreationBlock: React.FC<Props> = ({
  post,
  onClose,
  onSuccess,
}) => {
  const t = useTranslations();
  const { isPending, resetAll, setDrafts, submit, setErrors } =
    useKeyFactorsCtx();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [impactsById, setImpactsById] = useState<
    Record<number, { impact_direction: 1 | -1 | null; certainty: -1 | null }>
  >({});
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState<number>(VISIBLE_STEP);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await ClientPostsApi.getRelatedNews(post.id);
        if (!mounted) return;
        const list = res ?? [];
        setArticles(list);
        const init: Record<
          number,
          { impact_direction: 1 | -1 | null; certainty: -1 | null }
        > = {};
        list.forEach(
          (a) => (init[a.id] = { impact_direction: null, certainty: null })
        );
        setImpactsById(init);
        setVisibleCount(Math.min(VISIBLE_STEP, list.length || VISIBLE_STEP));
        setSelectedId(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [post.id]);

  const canSubmit = useMemo(() => {
    if (loading || isPending || selectedId == null) return false;
    const m = impactsById[selectedId];
    return (
      !!m &&
      (m.impact_direction === 1 ||
        m.impact_direction === -1 ||
        m.certainty === -1)
    );
  }, [loading, isPending, selectedId, impactsById]);

  const handleSubmit = async () => {
    if (!canSubmit || selectedId == null) return;

    const a = articles.find((x) => x.id === selectedId);
    const m = impactsById[selectedId];
    const drafts: NewsDraft[] = [
      {
        news: {
          url: a?.url,
          title: a?.title,
          img_url: a?.favicon_url ?? "",
          source: a?.media_label,
          published_at: a?.created_at,
          impact_direction: m?.impact_direction ?? null,
          certainty: m?.certainty ?? null,
        },
      },
    ];

    setDrafts(() => drafts);

    const result = await submit("news");
    if (result && "errors" in result) {
      setErrors(result.errors);
      return;
    }
    if (result?.comment) onSuccess?.(result.comment);

    resetAll();
    onClose();
  };

  const setOnlyImpact = (
    id: number,
    meta: { impact_direction: 1 | -1 | null; certainty: -1 | null }
  ) =>
    setImpactsById((prev) => {
      const next: typeof prev = {};
      for (const k of Object.keys(prev)) {
        const n = Number(k);
        next[n] =
          n === id
            ? {
                impact_direction: meta.impact_direction,
                certainty: meta.certainty,
              }
            : { impact_direction: null, certainty: null };
      }
      return next;
    });

  const clearAllImpacts = () =>
    setImpactsById((prev) => {
      const next: typeof prev = {};
      for (const k of Object.keys(prev)) {
        const n = Number(k);
        next[n] = { impact_direction: null, certainty: null };
      }
      return next;
    });

  if (loading) return <div className="py-8 text-center">{t("loading")}</div>;
  if (!articles.length) return <div className="py-8 text-center">no found</div>;

  const visibleArticles = articles.slice(0, visibleCount);
  const hasMore = visibleCount < articles.length;

  return (
    <>
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
                key={a.id}
                article={a}
                selected={isSelected}
                impact={
                  impactsById[a.id] ?? {
                    impact_direction: null,
                    certainty: null,
                  }
                }
                onToggleSelect={(id) =>
                  setSelectedId((curr) => {
                    if (curr === id) {
                      clearAllImpacts();
                      return null;
                    }
                    clearAllImpacts();
                    return id;
                  })
                }
                onSelectImpact={(id, meta) => {
                  setSelectedId(id);
                  setOnlyImpact(id, {
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

      <KeyFactorsModalFooter
        isPending={isPending}
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitLabel={t("addAsKeyFactor")}
        disabled={!canSubmit}
        errors={undefined}
      />
    </>
  );
};

export default KeyFactorsNewsCreationBlock;
