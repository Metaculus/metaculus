"use client";

import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import KeyFactorVoter from "@/components/comment_feed/key_factor_voter";
import Button from "@/components/ui/button";
import SectionToggle from "@/components/ui/section_toggle";
import useHash from "@/hooks/use_hash";
import useScrollTo from "@/hooks/use_scroll_to";
import { KeyFactor } from "@/types/comment";

type KeyFactorsSectionProps = {
  keyFactors: KeyFactor[];
};

const KeyFactorsSection: FC<KeyFactorsSectionProps> = ({ keyFactors }) => {
  const t = useTranslations();
  const [displayLimit, setDisplayLimit] = useState(4);
  const hash = useHash();

  useEffect(() => {
    // Expands the key factor list when you follow the #key-factors link.
    if (hash === "key-factors") setDisplayLimit(keyFactors.length);
  }, [hash, keyFactors.length]);

  return (
    <SectionToggle title={t("keyFactors")} defaultOpen id="key-factors">
      <div className="flex flex-col gap-2.5">
        {keyFactors.slice(0, displayLimit).map((kf) => (
          <KeyFactorItem keyFactor={kf} key={`post-key-factor-${kf.id}`} />
        ))}
        <div className="flex flex-col items-center justify-between hover:text-blue-700 @md:flex-row">
          {keyFactors.length > displayLimit && (
            <Button
              variant="tertiary"
              onClick={() => setDisplayLimit((prev) => prev + 10)}
            >
              {t("showMore")}
            </Button>
          )}
        </div>
      </div>
    </SectionToggle>
  );
};

type KeyFactorBlockProps = {
  keyFactor: KeyFactor;
};

const KeyFactorItem: FC<KeyFactorBlockProps> = ({
  keyFactor: { text, id, votes_score, user_vote, comment_id },
}) => {
  const scrollTo = useScrollTo();
  return (
    <div className="relative flex items-center gap-3 rounded border border-transparent bg-gray-0 p-3 hover:border-blue-500 dark:bg-gray-0-dark dark:hover:border-blue-500-dark [&>.target]:hover:underline">
      {/* Link component does not trigger hash event trigger, so we use <a> instead */}
      <a
        href={`#comment-${comment_id}`}
        onClick={(e) => {
          const target = document.getElementById(`comment-${comment_id}`);
          if (target) {
            e.preventDefault();
            scrollTo(target.getBoundingClientRect().top);
          }
        }}
        className="absolute left-0 z-0 h-full w-full"
      ></a>
      <KeyFactorVoter
        className="z-10"
        voteData={{
          keyFactorId: id,
          votesScore: votes_score,
          userVote: user_vote ?? null,
        }}
      />
      <div className="target decoration-blue-500 underline-offset-4 dark:decoration-blue-500-dark">
        {text}
      </div>
    </div>
  );
};

export default KeyFactorsSection;
