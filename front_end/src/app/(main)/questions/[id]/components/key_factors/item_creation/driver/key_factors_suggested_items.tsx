"use client";
import { faClose, faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";

import KeyFactorsCarousel from "@/app/(main)/questions/[id]/components/key_factors/key_factors_carousel";
import { KeyFactor, KeyFactorVoteAggregate, News } from "@/types/comment";
import { KeyFactorDraft } from "@/types/key_factors";
import { PostWithForecasts } from "@/types/post";
import { CurrentUser } from "@/types/users";
import {
  isBaseRateDraft,
  isDriverDraft,
  isNewsDraft,
} from "@/utils/key_factors";
import { inferEffectiveQuestionTypeFromPost } from "@/utils/questions/helpers";

import KeyFactorItem from "../../item_view";
import { KFType } from "../../types";

type Props = {
  suggestedKeyFactors: KeyFactorDraft[];
  post: PostWithForecasts;
  user: CurrentUser;
  drafts: KeyFactorDraft[];
  setDrafts: React.Dispatch<React.SetStateAction<KeyFactorDraft[]>>;
  setSuggestedKeyFactors: React.Dispatch<
    React.SetStateAction<KeyFactorDraft[]>
  >;
  selectedType: KFType;
  setSelectedType: React.Dispatch<React.SetStateAction<KFType>>;
};

const KeyFactorsSuggestedItems: React.FC<Props> = ({
  suggestedKeyFactors,
  post,
  user,
  drafts,
  setDrafts,
  setSuggestedKeyFactors,
  setSelectedType,
  selectedType,
}) => {
  const t = useTranslations();

  return (
    <div id="suggested-key-factors" className="flex flex-col gap-2">
      <p className="text-base leading-tight">
        {t("suggestedKeyFactorsSection")}
      </p>
      <div className="-mt-3">
        <KeyFactorsCarousel
          items={suggestedKeyFactors}
          gapClassName="gap-3.5"
          renderItem={(kf, idx) => {
            const fake = draftToDisplayKeyFactor(kf, post, user);

            return (
              <div key={idx} className="group relative mt-3">
                <KeyFactorItem
                  keyFactor={fake}
                  isCompact
                  mode="consumer"
                  linkToComment={false}
                />
                <div className="absolute -right-3 -top-3 flex gap-2">
                  <button
                    className="pointer-events-auto flex h-6 w-6 rounded-full bg-blue-400 p-0 text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark"
                    onClick={() => {
                      setSelectedType("driver");
                      requestAnimationFrame(() => {
                        if (!selectedType) {
                          setDrafts([kf]);
                        } else {
                          setDrafts([...drafts, kf]);
                        }
                        setSuggestedKeyFactors(
                          suggestedKeyFactors.filter((_, i) => i !== idx)
                        );
                      });
                    }}
                  >
                    <FontAwesomeIcon icon={faPen} className="m-auto size-3" />
                  </button>
                  <button
                    className="pointer-events-auto flex h-6 w-6 rounded-full bg-salmon-300 p-0 text-salmon-600 dark:bg-salmon-300-dark dark:text-salmon-600-dark"
                    onClick={() =>
                      setSuggestedKeyFactors(
                        suggestedKeyFactors.filter((_, i) => i !== idx)
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faClose} className="m-auto size-4" />
                  </button>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

const emptyAggregate: KeyFactorVoteAggregate = {
  score: 0,
  user_vote: null,
  count: 0,
  aggregated_data: [],
};

type QuestionLite = { id: number; label: string; unit?: string | null };
const isQuestionLite = (x: unknown): x is QuestionLite =>
  !!x && typeof x === "object" && "id" in x && "label" in x;

function draftToDisplayKeyFactor(
  kf: KeyFactorDraft,
  post: PostWithForecasts,
  user: CurrentUser
): KeyFactor {
  const raw =
    kf.question_id &&
    post.group_of_questions?.questions.find((q) => q?.id === kf.question_id);

  const question = isQuestionLite(raw) ? raw : undefined;

  const base: Omit<KeyFactor, "driver" | "base_rate" | "news"> = {
    id: -1,
    author: user,
    freshness: 0,
    comment_id: -1,
    vote: emptyAggregate,
    question: kf.question_id
      ? {
          id: kf.question_id,
          label: question?.label || "",
          unit: question?.unit ?? undefined,
        }
      : undefined,
    question_option: kf.question_option,
    post: {
      id: post.id,
      unit: post.question?.unit || question?.unit || undefined,
      question_type: inferEffectiveQuestionTypeFromPost(post) || undefined,
    },
    flagged_by_me: false,
  };

  if (isDriverDraft(kf)) {
    return {
      ...base,
      driver: {
        text: kf.driver.text,
        impact_direction: kf.driver.impact_direction,
        certainty: kf.driver.certainty,
      },
      base_rate: null,
      news: null,
    };
  }

  if (isBaseRateDraft(kf)) {
    return {
      ...base,
      driver: null,
      base_rate: { ...kf.base_rate },
      news: null,
    };
  }

  if (isNewsDraft(kf)) {
    const n = kf.news;
    const news: News = {
      url: n.url ?? "",
      title: n.title ?? "",
      source: n.source ?? "",
      img_url: n.img_url ?? undefined,
      published_at: n.published_at ?? undefined,
      impact_direction: n.impact_direction ?? null,
      certainty: n.certainty ?? null,
    };
    return { ...base, driver: null, base_rate: null, news };
  }

  return { ...base, driver: null, base_rate: null, news: null };
}

export default KeyFactorsSuggestedItems;
