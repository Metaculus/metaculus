"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import type { BECommentType, ImpactMetadata } from "@/types/comment";
import type { NewsDraft } from "@/types/key_factors";
import type { NewsArticle } from "@/types/news";
import type { PostWithForecasts } from "@/types/post";

import { Target } from "../../item_creation/driver/option_target_picker";
import KeyFactorsNewsForm from "../../item_creation/news/key_factors_news_form";
import { useKeyFactorsCtx } from "../../key_factors_context";
import { normalizeUrlForComparison } from "../../utils";
import KeyFactorsModalFooter from "../key_factors_modal_footer";

type Props = {
  post: PostWithForecasts;
  onClose: () => void;
  onSuccess?: (c: BECommentType) => void;
};

const KeyFactorsNewsCreationBlock: React.FC<Props> = ({
  post,
  onClose,
  onSuccess,
}) => {
  const t = useTranslations();
  const { isPending, resetAll, setDrafts, submit, setErrors } =
    useKeyFactorsCtx();

  const { combinedKeyFactors } = useCommentsFeed();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedImpact, setSelectedImpact] = useState<ImpactMetadata>({
    impact_direction: null,
    certainty: null,
  });

  const [pastedArticle, setPastedArticle] = useState<NewsArticle | null>(null);
  const [target, setTarget] = useState<Target>({});

  const existingNewsUrls = useMemo(
    () =>
      combinedKeyFactors
        .map((kf) => kf.news?.url as string | undefined)
        .filter((u): u is string => !!u)
        .map((u) => normalizeUrlForComparison(u)),
    [combinedKeyFactors]
  );

  const canSubmit = useMemo(() => {
    if (isPending) return false;

    const hasArticleFromMatches =
      selectedId != null && articles.some((a) => a.id === selectedId);
    const hasPastedArticle = !!pastedArticle;

    const m = selectedImpact;
    const hasImpact =
      !!m &&
      (m.impact_direction === 1 ||
        m.impact_direction === -1 ||
        m.certainty === -1);

    return (hasArticleFromMatches || hasPastedArticle) && hasImpact;
  }, [isPending, selectedId, pastedArticle, selectedImpact, articles]);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    let a: NewsArticle | undefined;

    if (selectedId != null) {
      a = articles.find((x) => x.id === selectedId);
    } else if (pastedArticle) {
      a = pastedArticle;
    }

    if (!a) return;

    const m = selectedImpact;
    const drafts: NewsDraft[] = [
      {
        news: {
          url: a.url,
          title: a.title,
          img_url: a.favicon_url ?? "",
          source: a.media_label,
          published_at: a.created_at,
          impact_direction: m?.impact_direction ?? null,
          certainty: m?.certainty ?? null,
        },
        question_id: target.question_id,
        question_option: target.question_option,
      },
    ];

    setDrafts(() => drafts);

    const result = await submit("news", undefined, drafts);
    if (result && "errors" in result) {
      setErrors(result.errors);
      return;
    }
    if (result?.comment) onSuccess?.(result.comment);

    resetAll();
    onClose();
  };

  return (
    <>
      <p className="my-0 mb-3 text-base leading-[21px] text-gray-800 dark:text-gray-800-dark">
        {t("chooseUrl")}
      </p>

      <KeyFactorsNewsForm
        post={post}
        articles={articles}
        selectedId={selectedId}
        selectedImpact={selectedImpact}
        target={target}
        setSelectedImpact={setSelectedImpact}
        setSelectedId={setSelectedId}
        setArticles={setArticles}
        onUrlPreviewLoaded={setPastedArticle}
        onTargetChange={setTarget}
        existingNewsUrls={existingNewsUrls}
      />

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
