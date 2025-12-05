"use client";
import { faCheck, faClose, faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import KeyFactorsCarousel from "@/app/(main)/questions/[id]/components/key_factors/key_factors_carousel";
import { KeyFactor, KeyFactorVoteAggregate, News } from "@/types/comment";
import { KeyFactorDraft } from "@/types/key_factors";
import { PostWithForecasts } from "@/types/post";
import { CurrentUser } from "@/types/users";
import { inferEffectiveQuestionTypeFromPost } from "@/utils/questions/helpers";

import KeyFactorItem from "./item_view";
import { useKeyFactorsCtx } from "./key_factors_context";

type ActionKind = "accept" | "edit" | "reject";

type KeyFactorActionButtonProps = {
  kind: ActionKind;
  onClick: () => void;
};

export const KeyFactorActionButton: React.FC<KeyFactorActionButtonProps> = ({
  kind,
  onClick,
}) => {
  let icon = faCheck;
  let className =
    "pointer-events-auto flex h-6 w-6 rounded-full p-0 bg-olive-400 text-olive-700 dark:bg-olive-400-dark dark:text-olive-700-dark";

  if (kind === "edit") {
    icon = faPen;
    className =
      "pointer-events-auto flex h-6 w-6 rounded-full p-0 bg-blue-400 text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark";
  } else if (kind === "reject") {
    icon = faClose;
    className =
      "pointer-events-auto flex h-6 w-6 rounded-full p-0 bg-salmon-300 text-salmon-600 dark:bg-salmon-300-dark dark:text-salmon-600-dark";
  }

  return (
    <button className={className} onClick={onClick}>
      <FontAwesomeIcon icon={icon} className="m-auto size-3" />
    </button>
  );
};

type Props = {
  suggestedKeyFactors: KeyFactorDraft[];
  post: PostWithForecasts;
  user: CurrentUser;
  setSuggestedKeyFactors: React.Dispatch<
    React.SetStateAction<KeyFactorDraft[]>
  >;
  onEdit: (
    kf: KeyFactorDraft,
    index: number,
    opts?: { showErrors?: boolean }
  ) => void;
};

const KeyFactorsSuggestedItems: React.FC<Props> = ({
  suggestedKeyFactors,
  post,
  user,
  setSuggestedKeyFactors,
  onEdit,
}) => {
  const { addSingleSuggestedKeyFactor } = useKeyFactorsCtx();

  if (suggestedKeyFactors.length === 0) return null;

  const removeAt = (idx: number) => {
    setSuggestedKeyFactors((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div id="suggested-key-factors" className="flex flex-col gap-2">
      <KeyFactorsCarousel
        items={suggestedKeyFactors}
        gapClassName="gap-3.5"
        renderItem={(kf, idx) => {
          const question = post.group_of_questions?.questions.find(
            (obj) => obj.id === kf.question_id
          );

          const emptyAggregate: KeyFactorVoteAggregate = {
            score: 0,
            user_vote: null,
            count: 0,
            aggregated_data: [],
          };

          let news: News | null = null;
          if (kf.news && kf.news.url && kf.news.title && kf.news.source) {
            news = {
              url: kf.news.url,
              title: kf.news.title,
              source: kf.news.source,
              img_url: kf.news.img_url ?? undefined,
              published_at: kf.news.published_at ?? undefined,
              impact_direction: kf.news.impact_direction ?? null,
              certainty: kf.news.certainty ?? null,
            };
          }

          const fake: KeyFactor = {
            id: -1,
            driver: kf.driver ?? null,
            base_rate: kf.base_rate ?? null,
            news,
            author: user,
            comment_id: -1,
            vote: emptyAggregate,
            question_id: kf.question_id ?? null,
            question: kf.question_id
              ? {
                  id: kf.question_id,
                  label: question?.label || "",
                  unit: question?.unit ?? null,
                }
              : null,
            question_option: kf.question_option,
            freshness: 0,
            post: {
              id: post.id,
              unit: post.question?.unit || question?.unit,
              question_type:
                inferEffectiveQuestionTypeFromPost(post) || undefined,
            },
            flagged_by_me: false,
          };

          const isBaseRateWithMissingSource =
            !!kf.base_rate && !kf.base_rate.source;

          return (
            <div key={idx} className="group relative mt-3">
              <KeyFactorItem
                keyFactor={fake}
                isCompact
                mode="consumer"
                linkToComment={false}
                isSuggested
                className="bg-gray-0 dark:bg-gray-0-dark"
              />
              <div className="absolute -right-3 -top-3 flex gap-2">
                {!isBaseRateWithMissingSource && (
                  <KeyFactorActionButton
                    kind="accept"
                    onClick={async () => {
                      const res = await addSingleSuggestedKeyFactor(kf);
                      if (!res || ("errors" in res && res.errors)) {
                        onEdit(kf, idx, { showErrors: true });
                        return;
                      }
                      removeAt(idx);
                    }}
                  />
                )}
                <KeyFactorActionButton
                  kind="edit"
                  onClick={() => onEdit(kf, idx)}
                />
                <KeyFactorActionButton
                  kind="reject"
                  onClick={() => removeAt(idx)}
                />
              </div>
            </div>
          );
        }}
      />
    </div>
  );
};

export default KeyFactorsSuggestedItems;
