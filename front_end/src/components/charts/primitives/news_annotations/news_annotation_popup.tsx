"use client";

import { FC } from "react";

import { QuestionType } from "@/types/question";

import NewsAnnotationPopupCard from "./news_annotation_popup_card";
import { AnnotationCluster } from "./types";

const MAX_VISIBLE_ANNOTATIONS = 3;

type Props = {
  cluster: AnnotationCluster;
  questionType?: QuestionType;
};

const NewsAnnotationPopup: FC<Props> = ({ cluster, questionType }) => {
  const visibleAnnotations = cluster.annotations.slice(
    0,
    MAX_VISIBLE_ANNOTATIONS
  );

  return (
    <div className="flex w-[280px] flex-col gap-[5px] rounded-xl p-0">
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
