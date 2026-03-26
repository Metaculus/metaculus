"use client";

import { FC, useEffect, useRef } from "react";

import { QuestionType } from "@/types/question";

import NewsAnnotationPopupCard from "./news_annotation_popup_card";
import { AnnotationCluster } from "./types";

const MAX_VISIBLE_ANNOTATIONS = 3;

type Props = {
  cluster: AnnotationCluster;
  questionType?: QuestionType;
  onClose: () => void;
};

const NewsAnnotationPopup: FC<Props> = ({ cluster, questionType, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const visibleAnnotations = cluster.annotations.slice(
    0,
    MAX_VISIBLE_ANNOTATIONS
  );

  return (
    <div ref={ref} className="flex w-[280px] flex-col gap-[5px] rounded-xl p-0">
      {visibleAnnotations.map((annotation) => (
        <NewsAnnotationPopupCard
          key={annotation.keyFactor.id}
          annotation={annotation}
          questionType={questionType}
        />
      ))}
    </div>
  );
};

export default NewsAnnotationPopup;
