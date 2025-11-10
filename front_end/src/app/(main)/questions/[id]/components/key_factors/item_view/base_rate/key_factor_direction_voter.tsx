"use client";

import { faThumbsDown, faThumbsUp } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { useMemo, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { voteKeyFactor } from "@/app/(main)/questions/actions";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import {
  KeyFactor,
  KeyFactorVoteAggregate,
  KeyFactorVoteTypes,
} from "@/types/comment";
import { ProjectPermissions } from "@/types/post";
import cn from "@/utils/core/cn";

import KeyFactorDropdownMenuItems from "../dropdown_menu_items";

type Props = {
  keyFactor: KeyFactor;
  projectPermission?: ProjectPermissions;
  className?: string;
};

const KeyFactorDirectionVoter: React.FC<Props> = ({
  keyFactor,
  projectPermission,
  className,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const { setKeyFactorVote } = useCommentsFeed();

  const [aggregate, setAggregate] = useState<KeyFactorVoteAggregate>(
    keyFactor.vote
  );
  const [submitting, setSubmitting] = useState(false);
  const userVote = aggregate?.user_vote as 5 | -5 | null;
  const { helpful, notHelpful } = useMemo(() => {
    const arr = aggregate?.aggregated_data ?? [];
    return {
      helpful: arr.find((a) => a.score === 5)?.count ?? 0,
      notHelpful: arr.find((a) => a.score === -5)?.count ?? 0,
    };
  }, [aggregate]);

  const submit = async (next: 5 | -5 | null) => {
    if (!user) {
      setCurrentModal({ type: "signin" });
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setAggregate((prev) => ({ ...prev, user_vote: next }));

    try {
      const resp = await voteKeyFactor({
        id: keyFactor.id,
        vote: next,
        user: user.id,
        vote_type: KeyFactorVoteTypes.DIRECTION,
      });

      if (resp) {
        const updated = resp as unknown as KeyFactorVoteAggregate;
        setAggregate(updated);
        setKeyFactorVote(keyFactor.id, updated);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = (value: 5 | -5) => submit(userVote === value ? null : value);

  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={submitting}
          aria-pressed={userVote === 5}
          onClick={() => toggle(5)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-1 text-xs font-normal transition-colors",
            userVote === 5
              ? "border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-200-dark dark:bg-purple-100-dark dark:text-purple-500"
              : "hover:dark:bg-gray-50-dark border-blue-400 bg-gray-0 text-blue-800 hover:bg-gray-50 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-blue-800-dark"
          )}
        >
          <FontAwesomeIcon
            className="text-[14px] text-olive-700 dark:text-olive-700-dark"
            icon={faThumbsUp}
          />
          <span>
            {helpful} {t("helpful")}
          </span>
        </button>

        <button
          type="button"
          disabled={submitting}
          aria-pressed={userVote === -5}
          onClick={() => toggle(-5)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[4px] border border-blue-400 px-2 py-1 text-xs font-normal transition-colors dark:border-blue-400-dark",
            userVote === -5
              ? "border-salmon-200 bg-salmon-100 text-salmon-800 dark:border-salmon-200-dark dark:bg-salmon-100-dark dark:text-salmon-800-dark"
              : "hover:dark:bg-gray-50-dark border-blue-400 bg-gray-0 text-blue-800 hover:bg-gray-50 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-blue-800-dark"
          )}
        >
          <FontAwesomeIcon
            className="text-[14px] text-salmon-600 dark:text-salmon-600-dark"
            icon={faThumbsDown}
          />
          <span className="text-blue-800 dark:text-blue-800-dark">
            {notHelpful} {t("notHelpful")}
          </span>
        </button>
      </div>

      <KeyFactorDropdownMenuItems
        keyFactor={{ ...keyFactor, vote: aggregate }}
        projectPermission={projectPermission}
      />
    </div>
  );
};

export default KeyFactorDirectionVoter;
