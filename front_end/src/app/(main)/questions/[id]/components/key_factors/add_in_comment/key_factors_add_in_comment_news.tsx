"use client";

import { faNewspaper } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { FormError } from "@/components/ui/form_field";
import { ImpactMetadata } from "@/types/comment";
import { NewsArticle } from "@/types/news";
import { PostWithForecasts } from "@/types/post";

import KeyFactorsNewItemContainer from "../item_creation/key_factors_new_item_container";
import KeyFactorsNewsForm from "../item_creation/news/key_factors_news_form";
import { useKeyFactorsCtx } from "../key_factors_context";
import KeyFactorsAddInCommentWrapper from "./key_factors_add_in_comment_wrapper";
import { Target } from "../item_creation/driver/option_target_picker";
import { normalizeUrlForComparison } from "../utils";

type Props = {
  postData: PostWithForecasts;
  onSubmit: (payload: {
    article: NewsArticle;
    impact: ImpactMetadata;
    target: Target;
  }) => void;
  onCancel: () => void;
  onBack: () => void;
};

const KeyFactorsAddInCommentNews: React.FC<Props> = ({
  postData,
  onSubmit,
  onCancel,
  onBack,
}) => {
  const t = useTranslations();

  const { isPending, errors: keyFactorsErrors } = useKeyFactorsCtx();
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
      selectedId != null && articles.some((x) => x.id === selectedId);
    const hasPastedArticle = !!pastedArticle;

    const m = selectedImpact;
    const hasImpact =
      !!m &&
      (m.impact_direction === 1 ||
        m.impact_direction === -1 ||
        m.certainty === -1);

    return (hasArticleFromMatches || hasPastedArticle) && hasImpact;
  }, [isPending, selectedId, pastedArticle, selectedImpact, articles]);

  const handleSubmit = () => {
    if (!canSubmit) return;

    let article: NewsArticle | undefined;

    if (selectedId != null) {
      article = articles.find((x) => x.id === selectedId);
    } else if (pastedArticle) {
      article = pastedArticle;
    }

    if (!article) return;

    onSubmit({ article, impact: selectedImpact, target });
  };

  return (
    <KeyFactorsAddInCommentWrapper
      submitLabel={t("addAsKeyFactor")}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    >
      <KeyFactorsNewItemContainer
        icon={faNewspaper}
        label={t("news")}
        onBack={onBack}
      >
        <KeyFactorsNewsForm
          post={postData}
          target={target}
          onTargetChange={setTarget}
          articles={articles}
          selectedId={selectedId}
          selectedImpact={selectedImpact}
          setSelectedImpact={setSelectedImpact}
          setSelectedId={setSelectedId}
          setArticles={setArticles}
          onUrlPreviewLoaded={setPastedArticle}
          className="-mt-2"
          existingNewsUrls={existingNewsUrls}
        />
        <FormError errors={keyFactorsErrors} />
      </KeyFactorsNewItemContainer>
    </KeyFactorsAddInCommentWrapper>
  );
};

export default KeyFactorsAddInCommentNews;
