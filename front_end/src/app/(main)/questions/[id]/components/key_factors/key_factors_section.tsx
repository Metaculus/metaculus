"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { sendGAEvent } from "@next/third-parties/google";
import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import AddKeyFactorsModal from "@/components/comment_feed/add_key_factors_modal";
import Button from "@/components/ui/button";
import SectionToggle from "@/components/ui/section_toggle";
import useHash from "@/hooks/use_hash";

import KeyFactorItem from "./key_factor_item";

type KeyFactorsSectionProps = {
  postId: number;
};

const AddKeyFactorsButton: FC<{
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}> = ({ onClick, className }) => {
  const t = useTranslations();
  return (
    <Button
      as="div"
      className={className}
      size="xs"
      variant="tertiary"
      onClick={(e) => onClick(e as React.MouseEvent<HTMLButtonElement>)}
    >
      <FontAwesomeIcon icon={faPlus} className="size-4 p-1" />
      {t("addKeyFactor")}
    </Button>
  );
};

const KeyFactorsSection: FC<KeyFactorsSectionProps> = ({ postId }) => {
  const t = useTranslations();
  const hash = useHash();
  const [displayLimit, setDisplayLimit] = useState(4);
  const [isAddKeyFactorsModalOpen, setIsAddKeyFactorsModalOpen] =
    useState(false);

  const { combinedKeyFactors } = useCommentsFeed();

  useEffect(() => {
    // Expands the key factor list when you follow the #key-factors link.
    if (hash === "key-factors") setDisplayLimit(combinedKeyFactors.length);
  }, [hash, combinedKeyFactors.length]);

  useEffect(() => {
    if (combinedKeyFactors.length > 0) {
      sendGAEvent("event", "KeyFactorPageview");
    }
  }, [combinedKeyFactors]);

  return (
    <>
      <AddKeyFactorsModal
        isOpen={isAddKeyFactorsModalOpen}
        onClose={() => setIsAddKeyFactorsModalOpen(false)}
        postId={postId}
      />

      <SectionToggle
        detailElement={
          combinedKeyFactors.length > 0 ? (
            <AddKeyFactorsButton
              className="ml-auto"
              onClick={(event) => {
                event.preventDefault();
                setIsAddKeyFactorsModalOpen(true);
              }}
            />
          ) : null
        }
        title={t("keyFactors")}
        defaultOpen
        id="key-factors"
        wrapperClassName="scroll-mt-header"
      >
        {combinedKeyFactors.length > 0 ? (
          <div id="key-factors-list" className="flex flex-col gap-2.5">
            {combinedKeyFactors.slice(0, displayLimit).map((kf) => {
              return (
                <KeyFactorItem
                  keyFactor={kf}
                  key={`post-key-factor-${kf.id}-${kf.votes_score}-${kf.user_votes.at(-1)?.score ?? 0} `}
                />
              );
            })}
            {combinedKeyFactors.length > displayLimit && (
              <div className="flex flex-col items-center justify-between hover:text-blue-700 @md:flex-row">
                <Button
                  variant="tertiary"
                  onClick={() => setDisplayLimit((prev) => prev + 10)}
                >
                  {t("showMore")}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-between pb-8 pt-6 hover:text-blue-700">
            <span>{t("noKeyFactorsP1")}</span>
            <span className="mt-1 text-sm text-blue-600 dark:text-blue-600-dark">
              {t("noKeyFactorsP2")}
            </span>
            <AddKeyFactorsButton
              className="mx-auto mt-4"
              onClick={() => setIsAddKeyFactorsModalOpen(true)}
            />
          </div>
        )}
      </SectionToggle>
    </>
  );
};

type KeyFactorBlockProps = {
  keyFactor: KeyFactor;
  linkToComment?: boolean;
};

export const KeyFactorItem: FC<KeyFactorBlockProps> = ({
  keyFactor: { text, id, votes_score, user_votes, comment_id },
  linkToComment = true,
}) => {
  const scrollTo = useScrollTo();
  const linkAnchor = linkToComment ? `#comment-${comment_id}` : "#key-factors";

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 rounded border border-transparent bg-blue-200 p-3 hover:border-blue-500 dark:bg-blue-200-dark dark:hover:border-blue-500-dark [&>.target]:hover:visible",
        { "bg-gray-0 dark:bg-gray-0-dark": linkToComment }
      )}
    >
      {/* Link component does not trigger hash event trigger, so we use <a> instead */}
      <KeyFactorVoter
        className="z-10"
        voteData={{
          keyFactorId: id,
          votesScore: votes_score,
          userVote:
            user_votes.findLast((vote) => vote.vote_type === "a_updown") ??
            null, // TODO: pass all user votes array and use it inside the voter
        }}
      />
      <div className="decoration-blue-500 underline-offset-4 dark:decoration-blue-500-dark">
        {text}
      </div>

      <a
        href={linkAnchor}
        onClick={(e) => {
          const target = document.getElementById(linkAnchor.replace("#", ""));
          if (target) {
            if (linkToComment) {
              e.preventDefault();
            }
            scrollTo(target.getBoundingClientRect().top);
          }
          sendGAEvent("event", "KeyFactorClick", { event_label: "fromList" });
        }}
        className="target invisible ml-auto text-blue-600 dark:text-blue-600"
      >
        <FontAwesomeIcon
          icon={faArrowUpRightFromSquare}
          className="size-3 p-1"
        />
      </a>
    </div>
  );
};

export default KeyFactorsSection;
