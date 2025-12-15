"use client";

import { faNewspaper } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import ImpactDirectionControls from "@/app/(main)/questions/[id]/components/key_factors/item_creation/driver/impact_direction_controls";
import OptionTargetPicker, {
  Target,
} from "@/app/(main)/questions/[id]/components/key_factors/item_creation/driver/option_target_picker";
import KeyFactorsNewItemContainer from "@/app/(main)/questions/[id]/components/key_factors/item_creation/key_factors_new_item_container";
import KeyFactorNewsItem from "@/app/(main)/questions/[id]/components/key_factors/item_view/news/key_factor_news_item";
import { ImpactMetadata } from "@/types/comment";
import { NewsDraft } from "@/types/key_factors";
import { PostWithForecasts } from "@/types/post";
import {
  inferEffectiveQuestionTypeFromPost,
  isGroupOfQuestionsPost,
  isMultipleChoicePost,
  isQuestionPost,
} from "@/utils/questions/helpers";

type Props = {
  draft: NewsDraft;
  setDraft: (d: NewsDraft) => void;
  post: PostWithForecasts;
};

const KeyFactorsNewsSuggestionFields: FC<Props> = ({
  draft,
  setDraft,
  post,
}) => {
  const t = useTranslations();
  const news = draft.news;

  const questionMeta = useMemo(() => {
    const questionTypeBase = inferEffectiveQuestionTypeFromPost(post);
    let questionType = questionTypeBase;
    let effectiveUnit = isQuestionPost(post) ? post.question.unit : undefined;

    if (isGroupOfQuestionsPost(post) && draft.question_id) {
      const sq = post.group_of_questions.questions.find(
        (q) => q.id === draft.question_id
      );
      questionType = sq?.type ?? questionTypeBase;
      effectiveUnit = sq?.unit ?? effectiveUnit;
    }

    return { questionType, effectiveUnit };
  }, [post, draft.question_id]);

  if (!news) return null;

  const { questionType, effectiveUnit } = questionMeta;

  const impact =
    news.certainty === -1
      ? ({
          impact_direction: null,
          certainty: -1,
        } as const)
      : news.impact_direction === null
        ? null
        : ({
            impact_direction: news.impact_direction as 1 | -1,
            certainty: null,
          } as const);

  const handleImpactSelect = (m: ImpactMetadata) => {
    setDraft({
      ...draft,
      news: {
        ...news,
        impact_direction: m.impact_direction,
        certainty: m.certainty,
      },
    });
  };

  const handleTargetChange = (target: Target) => {
    setDraft({
      ...draft,
      question_id: target.question_id,
      question_option: target.question_option,
    });
  };

  const stopAll = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    (e.nativeEvent as Event)?.stopImmediatePropagation?.();
  };

  const isMC = isMultipleChoicePost(post);
  const isGroup = isGroupOfQuestionsPost(post);

  return (
    <KeyFactorsNewItemContainer icon={faNewspaper} label={t("news")}>
      <div className="rounded border border-blue-400 p-4 antialiased dark:border-blue-400-dark">
        <KeyFactorNewsItem
          faviconUrl={news.img_url ?? ""}
          source={news.source ?? ""}
          title={news.title ?? ""}
          createdAt={news.published_at ?? ""}
          url={news.url ?? ""}
        />

        {questionType && (
          <>
            <p className="mb-2 mt-4 text-xs font-medium text-blue-700 dark:text-blue-700-dark">
              {t("chooseDirectionOfImpact")}
            </p>
            <ImpactDirectionControls
              questionType={questionType}
              unit={effectiveUnit}
              impact={impact}
              onSelect={handleImpactSelect}
              itemClassName="bg-gray-0 dark:bg-gray-0-dark"
            />
          </>
        )}

        {(isMC || isGroup) && (
          <div
            className="mt-4"
            onClick={stopAll}
            onMouseDown={stopAll}
            onKeyDown={stopAll}
          >
            <OptionTargetPicker
              post={post}
              value={{
                question_id: draft.question_id,
                question_option: draft.question_option,
              }}
              onChange={handleTargetChange}
            />
          </div>
        )}
      </div>
    </KeyFactorsNewItemContainer>
  );
};

export default KeyFactorsNewsSuggestionFields;
