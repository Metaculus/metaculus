"use client";

import { faCopy, faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useMemo, useState } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import {
  createCoherenceLink,
  voteAggregateCoherenceLink,
} from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import type { AggregateLinkVoteValue } from "@/services/api/coherence_links/coherence_links.shared";
import { QuestionLinkDirection, QuestionLinkStrength } from "@/types/coherence";
import { StrengthValues } from "@/types/comment";
import { Question } from "@/types/question";
import cn from "@/utils/core/cn";

import ThumbVoteButtons, { ThumbVoteSelection } from "../thumb_vote_buttons";
import { useOptimisticVote } from "../use_optimistic_vote";

type Props = {
  aggregationId?: number;
  fromQuestion: Question;
  toQuestion: Question;
  defaultDirection: QuestionLinkDirection;
  defaultStrength?: QuestionLinkStrength;
  onChange?: (next: "agree" | "disagree" | null) => void;
  onStrengthChange?: (strength: number | null) => void;
  onVotePanelToggle?: (open: boolean) => void;
  targetElementId?: string;
  className?: string;
};

const mapUserVoteToSelection = (
  v: number | null | undefined
): ThumbVoteSelection => {
  if (v === 1) return "up";
  if (v === -1) return "down";
  return null;
};

const QuestionLinkAgreeVoter: FC<Props> = ({
  aggregationId,
  fromQuestion,
  toQuestion,
  defaultDirection,
  defaultStrength = "medium",
  onChange,
  onStrengthChange,
  onVotePanelToggle,
  className,
  targetElementId,
}) => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();
  const { coherenceLinks, aggregateCoherenceLinks, updateCoherenceLinks } =
    useCoherenceLinksContext();

  const [submitting, setSubmitting] = useState(false);

  const contextVotes = useMemo(() => {
    const agg = aggregateCoherenceLinks.data.find(
      (it) => it.id === aggregationId
    );
    const votes = agg?.votes;
    return {
      agree: votes?.aggregated_data?.find((x) => x.score === 1)?.count ?? 0,
      disagree: votes?.aggregated_data?.find((x) => x.score === -1)?.count ?? 0,
      userVote: (votes?.user_vote ?? null) as 1 | -1 | null,
    };
  }, [aggregateCoherenceLinks, aggregationId]);

  const {
    vote: currentVote,
    upCount: agree,
    downCount: disagree,
    setOptimistic,
    clearOptimistic,
  } = useOptimisticVote<1 | -1 | null>({
    serverVote: contextVotes.userVote,
    serverUpCount: contextVotes.agree,
    serverDownCount: contextVotes.disagree,
    upValue: 1,
    downValue: -1,
  });

  const selected = mapUserVoteToSelection(currentVote);

  const { user } = useAuth();
  const [showCopyHint, setShowCopyHint] = useState(false);

  const hasPersonalCopy = useMemo(() => {
    if (!fromQuestion.id || !toQuestion.id) return false;

    const normalizePair = (a: number, b: number) => (a < b ? [a, b] : [b, a]);
    const [fromA, fromB] = normalizePair(fromQuestion.id, toQuestion.id);

    return coherenceLinks.data.some((link) => {
      const [linkA, linkB] = normalizePair(
        link.question1_id,
        link.question2_id
      );
      return linkA === fromA && linkB === fromB;
    });
  }, [fromQuestion.id, toQuestion.id, coherenceLinks.data]);

  const pushVote = async (next: "agree" | "disagree" | null) => {
    if (!aggregationId) return;

    if (!user) {
      setCurrentModal({ type: "signin" });
      return;
    }
    if (user.is_bot) return;

    const vote: AggregateLinkVoteValue =
      next === "agree" ? 1 : next === "disagree" ? -1 : null;

    setSubmitting(true);
    setOptimistic(vote);
    try {
      const res = await voteAggregateCoherenceLink(aggregationId, vote);
      if ("errors" in res) return;

      const data = res.data;

      if ("strength" in data) {
        onStrengthChange?.(data.strength ?? null);
      }

      await updateCoherenceLinks();
    } catch (e) {
      console.error("Failed to vote aggregate coherence link", e);
    } finally {
      clearOptimistic();
      setSubmitting(false);
    }
  };

  const handleVote = (value: "agree" | "disagree") => {
    const next: "agree" | "disagree" | null =
      selected === "up" && value === "agree"
        ? null
        : selected === "down" && value === "disagree"
          ? null
          : value;

    setShowCopyHint(!hasPersonalCopy && next === "agree");
    onChange?.(next);
    void pushVote(next);
  };

  const openCopyModal = () => {
    if (hasPersonalCopy) return;

    const defaultDir = defaultDirection ?? "positive";
    const defaultStr = defaultStrength ?? "medium";

    setCurrentModal({
      type: "copyQuestionLink",
      data: {
        fromQuestionTitle: fromQuestion.title,
        toQuestionTitle: toQuestion.title,
        defaultDirection: defaultDir,
        defaultStrength: defaultStr,
        targetElementId,
        onCreate: async ({ direction, strength, swapped }) => {
          const dirNumber = direction === "positive" ? 1 : -1;
          const strengthMap: Record<QuestionLinkStrength, StrengthValues> = {
            low: StrengthValues.LOW,
            medium: StrengthValues.MEDIUM,
            high: StrengthValues.HIGH,
          };
          const strengthNumber = strengthMap[strength];
          const type = "causal";

          const [sourceQuestion, targetQuestion] = swapped
            ? [toQuestion, fromQuestion]
            : [fromQuestion, toQuestion];

          const error = await createCoherenceLink(
            sourceQuestion,
            targetQuestion,
            dirNumber,
            strengthNumber,
            type
          );

          if (!error) {
            await updateCoherenceLinks();
          } else {
            return false;
          }
        },
      },
    });
  };

  const menuItems: MenuItemProps[] = [];

  if (!hasPersonalCopy) {
    menuItems.push({
      id: "copy-to-account",
      element: (
        <div
          className={cn(
            "inline-flex cursor-pointer items-center justify-end gap-2.5 whitespace-nowrap px-3 py-2 text-xs text-blue-700 hover:bg-blue-100 dark:text-blue-700-dark dark:hover:bg-blue-100-dark",
            "border-b-[1px] border-gray-300 dark:border-gray-300-dark"
          )}
          onClick={openCopyModal}
        >
          <span>{t("copyToMyAccount")}</span>
          <FontAwesomeIcon icon={faCopy} />
        </div>
      ),
    });
  }
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <ThumbVoteButtons
          upCount={agree}
          downCount={disagree}
          selected={selected}
          disabled={submitting}
          onClickUp={() => {
            handleVote("agree");
            onVotePanelToggle?.(selected !== "up");
          }}
          onClickDown={() => {
            handleVote("disagree");
            onVotePanelToggle?.(false);
          }}
        />

        {menuItems.length > 0 && (
          <DropdownMenu
            items={menuItems}
            className="border-gray-300 dark:border-gray-300-dark"
          >
            <Button
              aria-label={t("moreActions")}
              variant="tertiary"
              size="sm"
              presentationType="icon"
            >
              <FontAwesomeIcon icon={faEllipsis} />
            </Button>
          </DropdownMenu>
        )}
      </div>

      {!hasPersonalCopy && showCopyHint && (
        <div className="flex gap-1 text-xs leading-snug text-gray-800 dark:text-gray-100">
          <p className="my-0">
            {t.rich("questionLinksHint", {
              strong: (chunks) => <span className="font-medium">{chunks}</span>,
            })}
          </p>

          <button
            type="button"
            onClick={openCopyModal}
            className="text-xs text-blue-700 underline hover:text-blue-800 dark:text-blue-700-dark dark:hover:text-blue-600-dark"
          >
            {t("copyQuestionLinkToAccount")}
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionLinkAgreeVoter;
