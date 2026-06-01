import { useMemo } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { createCoherenceLink } from "@/app/(main)/questions/actions";
import { useModal } from "@/contexts/modal_context";
import { QuestionLinkDirection, QuestionLinkStrength } from "@/types/coherence";
import { StrengthValues } from "@/types/comment";
import { Question } from "@/types/question";

export function useQuestionLinkCopy({
  fromQuestion,
  toQuestion,
  defaultDirection,
  defaultStrength = "medium",
  targetElementId,
  onCloseAllPanels,
}: {
  fromQuestion: Question | null;
  toQuestion: Question | null;
  defaultDirection: QuestionLinkDirection;
  defaultStrength?: QuestionLinkStrength;
  targetElementId?: string;
  onCloseAllPanels?: () => void;
}) {
  const { setCurrentModal } = useModal();
  const { coherenceLinks, updateCoherenceLinks } = useCoherenceLinksContext();

  const hasPersonalCopy = useMemo(() => {
    if (!fromQuestion?.id || !toQuestion?.id) return false;

    const normalizePair = (a: number, b: number) => (a < b ? [a, b] : [b, a]);
    const [fromA, fromB] = normalizePair(fromQuestion.id, toQuestion.id);

    return coherenceLinks.data.some((link) => {
      const [linkA, linkB] = normalizePair(
        link.question1_id,
        link.question2_id
      );
      return linkA === fromA && linkB === fromB;
    });
  }, [fromQuestion?.id, toQuestion?.id, coherenceLinks.data]);

  const openCopyModal = () => {
    if (hasPersonalCopy || !fromQuestion || !toQuestion) return;

    onCloseAllPanels?.();

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
        onCreate: async ({
          direction,
          strength,
          swapped,
        }: {
          direction: "positive" | "negative";
          strength: QuestionLinkStrength;
          swapped: boolean;
        }) => {
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

  return { hasPersonalCopy, openCopyModal };
}
