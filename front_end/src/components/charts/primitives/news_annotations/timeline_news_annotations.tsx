"use client";

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import { FC, useCallback, useMemo, useRef, useState } from "react";

import { QuestionType } from "@/types/question";

import NewsAnnotationMarker from "./news_annotation_marker";
import NewsAnnotationPopup from "./news_annotation_popup";
import { AnnotationCluster } from "./types";

type Props = {
  clusters: AnnotationCluster[];
  chartHeight: number;
  axisBottomOffset: number;
  questionType?: QuestionType;
};

const TimelineNewsAnnotations: FC<Props> = ({
  clusters,
  chartHeight,
  axisBottomOffset,
  questionType,
}) => {
  const [activeClusterId, setActiveClusterId] = useState<number | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHoverStart = useCallback((index: number) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveClusterId(index);
  }, []);

  const handleHoverEnd = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveClusterId(null);
      closeTimeoutRef.current = null;
    }, 150);
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
          axisBottomOffset={axisBottomOffset}
          questionType={questionType}
          onHoverStart={handleHoverStart}
          onHoverEnd={handleHoverEnd}
        />
      ))}
    </div>
  );
};

type MarkerWithPopupProps = {
  cluster: AnnotationCluster;
  index: number;
  isActive: boolean;
  axisBottomOffset: number;
  questionType?: QuestionType;
  onHoverStart: (index: number) => void;
  onHoverEnd: () => void;
};

const AnnotationMarkerWithPopup: FC<MarkerWithPopupProps> = ({
  cluster,
  index,
  isActive,
  axisBottomOffset,
  questionType,
  onHoverStart,
  onHoverEnd,
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
      bottom: axisBottomOffset,
      transform: "translateX(-50%) translateY(50%)",
      pointerEvents: "auto" as const,
      zIndex: isActive ? 20 : 10,
    }),
    [cluster.xPixel, isActive, axisBottomOffset]
  );

  return (
    <>
      <div ref={refs.setReference} style={markerStyle}>
        <NewsAnnotationMarker
          count={cluster.annotations.length}
          isActive={isActive}
          onHoverStart={() => onHoverStart(index)}
          onHoverEnd={onHoverEnd}
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
            onMouseEnter={() => onHoverStart(index)}
            onMouseLeave={onHoverEnd}
          >
            <NewsAnnotationPopup
              cluster={cluster}
              questionType={questionType}
            />
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

export default TimelineNewsAnnotations;
