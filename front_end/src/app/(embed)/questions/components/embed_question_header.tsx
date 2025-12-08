import { useEffect, useRef } from "react";

import QuestionHeaderCPStatus from "@/app/(main)/questions/[id]/components/question_view/forecaster_question_view/question_header/question_header_cp_status";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import {
  isContinuousQuestion,
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

  return (
    <div
      ref={containerRef}
      className={cn("flex items-center", isEmbed && "items-start")}
    >
      <TruncatableQuestionTitle
        className="!text-[20px] !leading-[125%]"
        maxLines={4}
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
