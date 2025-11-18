"use client";

import { faNewspaper } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { FormError } from "@/components/ui/form_field";
import { ImpactMetadata } from "@/types/comment";
import { NewsArticle } from "@/types/news";
import { PostWithForecasts } from "@/types/post";

import KeyFactorsNewItemContainer from "../item_creation/key_factors_new_item_container";
import KeyFactorsNewsForm from "../item_creation/news/key_factors_news_form";
import { useKeyFactorsCtx } from "../key_factors_context";
import KeyFactorsAddInCommentWrapper from "./key_factors_add_in_comment_wrapper";

type Props = {
  postData: PostWithForecasts;
  onSubmit: (payload: { article: NewsArticle; impact: ImpactMetadata }) => void;
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

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedImpact, setSelectedImpact] = useState<ImpactMetadata>({
    impact_direction: null,
    certainty: null,
  });

  const canSubmit = useMemo(() => {
    if (isPending || selectedId == null) return false;
    const m = selectedImpact;
    return (
      !!m &&
      (m.impact_direction === 1 ||
        m.impact_direction === -1 ||
        m.certainty === -1)
    );
  }, [isPending, selectedId, selectedImpact]);

  const handleSubmit = () => {
    if (!canSubmit || selectedId == null) return;
    const article = articles.find((x) => x.id === selectedId);
    if (!article) return;
    onSubmit({ article, impact: selectedImpact });
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
          articles={articles}
          selectedId={selectedId}
          selectedImpact={selectedImpact}
          setSelectedImpact={setSelectedImpact}
          setSelectedId={setSelectedId}
          setArticles={setArticles}
        />
        <FormError errors={keyFactorsErrors} />
      </KeyFactorsNewItemContainer>
    </KeyFactorsAddInCommentWrapper>
  );
};

export default KeyFactorsAddInCommentNews;
