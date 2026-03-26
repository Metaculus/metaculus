"use client";

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import { FC, useCallback, useMemo, useState } from "react";

import { QuestionType } from "@/types/question";

import NewsAnnotationMarker from "./news_annotation_marker";
import NewsAnnotationPopup from "./news_annotation_popup";
import { AnnotationCluster } from "./types";

type Props = {
  clusters: AnnotationCluster[];
  chartHeight: number;
  questionType?: QuestionType;
};

const TimelineNewsAnnotations: FC<Props> = ({
  clusters,
  chartHeight,
  questionType,
}) => {
  const [activeClusterId, setActiveClusterId] = useState<number | null>(null);

  const handleMarkerClick = useCallback((index: number) => {
    setActiveClusterId((prev) => (prev === index ? null : index));
  }, []);

  const handleClose = useCallback(() => {
    setActiveClusterId(null);
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 hidden md:block"
      style={{ height: chartHeight }}
    >
      {clusters.map((cluster, index) => (
        <AnnotationMarkerWithPopup
          key={`${cluster.timestamp}-${index}`}
          cluster={cluster}
          index={index}
          isActive={activeClusterId === index}
          questionType={questionType}
          onClick={handleMarkerClick}
          onClose={handleClose}
        />
      ))}
    </div>
  );
};

type MarkerWithPopupProps = {
  cluster: AnnotationCluster;
  index: number;
  isActive: boolean;
  questionType?: QuestionType;
  onClick: (index: number) => void;
  onClose: () => void;
};

const AnnotationMarkerWithPopup: FC<MarkerWithPopupProps> = ({
  cluster,
  index,
  isActive,
  questionType,
  onClick,
  onClose,
}) => {
  const { refs, floatingStyles } = useFloating({
    open: isActive,
    placement: "top",
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const markerStyle = useMemo(
    () => ({
      position: "absolute" as const,
      left: cluster.xPixel,
      bottom: 20,
      transform: "translateX(-50%)",
      pointerEvents: "auto" as const,
      zIndex: isActive ? 20 : 10,
    }),
    [cluster.xPixel, isActive]
  );

  return (
    <>
      <div ref={refs.setReference} style={markerStyle}>
        <NewsAnnotationMarker
          count={cluster.annotations.length}
          isActive={isActive}
          onClick={() => onClick(index)}
        />
      </div>
      {isActive && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              zIndex: 50,
              pointerEvents: "auto",
            }}
          >
            <NewsAnnotationPopup
              cluster={cluster}
              questionType={questionType}
              onClose={onClose}
            />
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

export default TimelineNewsAnnotations;
