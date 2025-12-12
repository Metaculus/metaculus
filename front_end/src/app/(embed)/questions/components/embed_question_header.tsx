import { useEffect, useMemo, useRef } from "react";

import QuestionHeaderCPStatus from "@/app/(main)/questions/[id]/components/question_view/forecaster_question_view/question_header/question_header_cp_status";
import { ContinuousQuestionTypes } from "@/constants/questions";
import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import {
  isContinuousQuestion,
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import { useIsEmbedMode } from "./question_view_mode_context";
import TruncatableQuestionTitle from "./truncatable_question_title";

type Props = {
  post: PostWithForecasts;
  onHeightChange?: (height: number) => void;
};

const EmbedQuestionHeader: React.FC<Props> = ({ post, onHeightChange }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isEmbed = useIsEmbedMode();

  useEffect(() => {
    if (!onHeightChange) return;
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      onHeightChange(el.getBoundingClientRect().height);
    };

    update();

    const observer = new ResizeObserver(() => {
      update();
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [onHeightChange]);

  const maxLines = useMemo(() => {
    if (isGroupOfQuestionsPost(post)) {
      const firstType = post.group_of_questions.questions[0]?.type;
      const isBinaryGroup = firstType === QuestionType.Binary;
      const isContinuousGroup = ContinuousQuestionTypes.some(
        (t) => t === firstType
      );

      if (isBinaryGroup || isContinuousGroup) return 2;
      return 3;
    }

    if (!isQuestionPost(post)) return 3;
    const q = post.question;

    if (q.type === QuestionType.MultipleChoice) return 2;
    return q.type === QuestionType.Binary || isContinuousQuestion(q) ? 4 : 3;
  }, [post]);

  const titleMinHeightClass = useMemo(() => {
    if (isGroupOfQuestionsPost(post)) {
      const firstType = post.group_of_questions.questions[0]?.type;
      const isBinaryGroup = firstType === QuestionType.Binary;
      const isContinuousGroup = ContinuousQuestionTypes.some(
        (t) => t === firstType
      );

      return isBinaryGroup || isContinuousGroup ? "min-h-[2.5em]" : "";
    }

    if (!isQuestionPost(post)) return "";
    const q = post.question;

    const needsMinHeight =
      q.type === QuestionType.MultipleChoice ||
      q.type === QuestionType.Binary ||
      isContinuousQuestion(q);

    return needsMinHeight ? "min-h-[2.5em]" : "";
  }, [post]);

  return (
    <div
      ref={containerRef}
      className={cn("flex items-center", isEmbed && "items-start")}
    >
      <TruncatableQuestionTitle
        className={cn("!text-[20px] !leading-[125%]", titleMinHeightClass)}
        maxLines={maxLines}
        revealOnHoverOrTap={true}
      >
        {post.title}
      </TruncatableQuestionTitle>
      {isQuestionPost(post) && (
        <QuestionHeaderCPStatus
          question={post.question as QuestionWithForecasts}
          size="md"
          hideLabel={isContinuousQuestion(post.question)}
        />
      )}
    </div>
  );
};

export default EmbedQuestionHeader;
