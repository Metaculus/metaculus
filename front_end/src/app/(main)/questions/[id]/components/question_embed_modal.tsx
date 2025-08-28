"use client";
import { FC } from "react";

import EmbedModal from "@/components/embed_modal";
import useEmbedModalContext from "@/contexts/embed_modal_context";
import { useEmbedUrl } from "@/hooks/share";
import { QuestionType } from "@/types/question";
type Props = {
  postId: number;
  postTitle?: string;
  questionType?: QuestionType;
};

const QuestionEmbedModal: FC<Props> = ({ postId, postTitle, questionType }) => {
  const embedUrl = useEmbedUrl(`/questions/embed/${postId}`);
  const { isOpen, updateIsOpen } = useEmbedModalContext();

  if (!embedUrl) {
    return null;
  }

  return (
    <EmbedModal
      isOpen={isOpen}
      onClose={updateIsOpen}
      embedWidth={550}
      embedHeight={430}
      url={embedUrl}
      withChartZoom
      postTitle={postTitle}
      questionType={questionType}
    />
  );
};

export default QuestionEmbedModal;
