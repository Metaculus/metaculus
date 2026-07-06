"use client";

import { FC, useEffect, useMemo, useRef, useState } from "react";

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

  const shellRef = useRef<HTMLDivElement | null>(null);
  const [modalWidth, setModalWidth] = useState<number>(550);

  useEffect(() => {
    if (!isOpen) return;
    const el = shellRef.current;
    if (!el) return;

    const update = () => setModalWidth(el.getBoundingClientRect().width);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen]);

  const isBinaryOrContinuous =
    !!questionType &&
    (questionType === QuestionType.Binary ||
      ContinuousQuestionTypes.some((t) => t === questionType));

  const embedWidth = 550;
  const effectiveWidth = Math.min(modalWidth, embedWidth);
  const embedHeight = useMemo(() => {
    if (isBinaryOrContinuous) {
      return effectiveWidth < 418 ? 390 : 360;
    }
    if (isFanChart) {
      return effectiveWidth < 480 ? 290 : 360;
    }
    return effectiveWidth < 418 ? 290 : 270;
  }, [effectiveWidth, isBinaryOrContinuous, isFanChart]);

  if (!embedUrl) return null;

  return (
    <div ref={shellRef} className="w-full">
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
    </div>
  );
};

export default QuestionEmbedModal;
