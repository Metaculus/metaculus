"use client";

import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import KeyFactorVoter from "@/components/comment_feed/key_factor_voter";
import Button from "@/components/ui/button";
import SectionToggle from "@/components/ui/section_toggle";
import { KeyFactor } from "@/types/comment";

type KeyFactorsSectionProps = {
  keyFactors: KeyFactor[];
};

const KeyFactorsSection: FC<KeyFactorsSectionProps> = ({ keyFactors }) => {
  const t = useTranslations();
  const [displayLimit, setDisplayLimit] = useState(4);

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
  return (
    <div className="relative flex items-center gap-3 rounded border border-transparent bg-gray-0 p-3 hover:border-blue-500 dark:bg-gray-0-dark dark:hover:border-blue-500-dark [&>.target]:hover:underline">
      {/* Link component does not trigger hash event trigger, so we use <a> instead */}
      <a
        href={`#comment-${comment_id}`}
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
