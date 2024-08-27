"use client";
import { FC } from "react";

import EmbedModal from "@/components/embed_modal";
import useEmbedModalContext from "@/contexts/embed_modal_context";
import { useEmbedUrl } from "@/hooks/share";

type Props = {
  postId: number;
  postTitle?: string;
};

const QuestionEmbedModal: FC<Props> = ({ postId, postTitle }) => {
  const embedUrl = useEmbedUrl(`/embed/questions/${postId}`);
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
    />
  );
};

export default QuestionEmbedModal;
