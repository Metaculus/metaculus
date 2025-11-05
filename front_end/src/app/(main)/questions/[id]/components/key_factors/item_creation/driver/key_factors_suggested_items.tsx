"use client";
import { faClose, faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";

import KeyFactorsCarousel from "@/app/(main)/questions/[id]/components/key_factors/key_factors_carousel";
import { KeyFactor } from "@/types/comment";
import { KeyFactorDraft } from "@/types/key_factors";
import { PostWithForecasts } from "@/types/post";
import { CurrentUser } from "@/types/users";
import { inferEffectiveQuestionTypeFromPost } from "@/utils/questions/helpers";

import KeyFactorItem from "../../item_view";

type Props = {
  suggestedKeyFactors: KeyFactorDraft[];
  post: PostWithForecasts;
  user: CurrentUser;
  drafts: KeyFactorDraft[];
  setDrafts: React.Dispatch<React.SetStateAction<KeyFactorDraft[]>>;
  setSuggestedKeyFactors: React.Dispatch<
    React.SetStateAction<KeyFactorDraft[]>
  >;
};

const KeyFactorsSuggestedItems: React.FC<Props> = ({
  suggestedKeyFactors,
  post,
  user,
  drafts,
  setDrafts,
  setSuggestedKeyFactors,
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
            const question = post.group_of_questions?.questions.find(
              (obj) => obj.id === kf.question_id
            );
            const fake: KeyFactor = {
              ...kf,
              id: -1,
              author: user,
              freshness: 0,
              comment_id: -1,
              vote: { score: 0, user_vote: null, count: 0 },
              question: kf.question_id
                ? {
                    id: kf.question_id,
                    label: question?.label || "",
                  }
                : undefined,
              post: {
                id: post.id,
                unit: post.question?.unit || question?.unit,
                question_type:
                  inferEffectiveQuestionTypeFromPost(post) || undefined,
              },
            };

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
                      setDrafts([...drafts, kf]);
                      setSuggestedKeyFactors(
                        suggestedKeyFactors.filter((_, i) => i !== idx)
                      );
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

export default KeyFactorsSuggestedItems;
