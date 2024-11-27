import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import KeyFactorVoter from "@/components/comment_feed/key_factor_voter";
import SectionToggle from "@/components/ui/section_toggle";
import { KeyFactor } from "@/types/comment";

type KeyFactorsSectionProps = {
  keyFactors: KeyFactor[];
};

const KeyFactorsSection: FC<KeyFactorsSectionProps> = ({ keyFactors }) => {
  const t = useTranslations();

  return (
    <SectionToggle title={t("keyFactors")} defaultOpen>
      <div className="flex flex-col gap-2.5">
        {keyFactors.map((kf) => (
          <KeyFactorItem keyFactor={kf} key={`post-key-factor-${kf.id}`} />
        ))}
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
  const t = useTranslations();

  return (
    <div className="flex items-center gap-3 rounded bg-gray-0 p-3 dark:bg-gray-0-dark">
      <KeyFactorVoter
        voteData={{
          keyFactorId: id,
          votesScore: votes_score,
          userVote: user_vote ?? null,
        }}
      />
      <Link
        href={`#comment-${comment_id}`}
        className="no-underline hover:underline"
      >
        {text}
      </Link>
    </div>
  );
};

export default KeyFactorsSection;
