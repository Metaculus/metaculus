"use client";
import { FC } from "react";

import EmbedModal from "@/components/embed_modal";
import { ContinuousQuestionTypes } from "@/constants/questions";
import useEmbedModalContext from "@/contexts/embed_modal_context";
import { useEmbedUrl } from "@/hooks/share";
import { QuestionType } from "@/types/question";

type Props = {
  postId: number;
  postTitle?: string;
  questionType?: QuestionType;
  isFanChart?: boolean;
};

const QuestionEmbedModal: FC<Props> = ({
  postId,
  postTitle,
  questionType,
  isFanChart,
}) => {
  const embedUrl = useEmbedUrl(`/questions/embed/${postId}`);
  const { isOpen, updateIsOpen } = useEmbedModalContext();

  if (!embedUrl) {
    return null;
  }

  const isBinaryOrContinuous =
    !!questionType &&
    (questionType === QuestionType.Binary ||
      ContinuousQuestionTypes.some((type) => type === questionType));

  const embedWidth = 550;
  const embedHeight = isBinaryOrContinuous || isFanChart ? 390 : 290;

  return (
    <EmbedModal
      isOpen={isOpen}
      onClose={updateIsOpen}
      embedWidth={embedWidth}
      embedHeight={embedHeight}
      url={embedUrl}
      withChartZoom
      postTitle={postTitle}
      questionType={questionType}
    />
  );
};

export default QuestionEmbedModal;
