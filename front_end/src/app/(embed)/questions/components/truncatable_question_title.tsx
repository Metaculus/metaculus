"use client";

import React, { HTMLAttributes, useEffect, useRef, useState } from "react";

import QuestionTitle from "@/app/(main)/questions/[id]/components/question_view/shared/question_title";
import cn from "@/utils/core/cn";

type TruncatableQuestionTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  maxLines?: number;
  revealOnHoverOrTap?: boolean;
};

const GRADIENT_EXTRA_PX = 12;

const TruncatableQuestionTitle: React.FC<TruncatableQuestionTitleProps> = ({
  children,
  className,
  style,
  maxLines = 4,
  revealOnHoverOrTap = true,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onClick,
  ...rest
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const [clampedHeight, setClampedHeight] = useState<number | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  const hasClamp = maxLines > 0;

  const clampStyle: React.CSSProperties = hasClamp
    ? {
        display: "-webkit-box",
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }
    : {};

  useEffect(() => {
    const el = titleRef.current;
    if (!el || !hasClamp) {
      setIsTruncated(false);
      setContentHeight(null);
      setClampedHeight(null);
      return;
    }

    const checkTruncation = () => {
      const client = el.clientHeight;
      const scroll = el.scrollHeight;

      setClampedHeight(client);
      setContentHeight(scroll);
      setIsTruncated(scroll > client + 1);
    };

    checkTruncation();

    const observer = new ResizeObserver(checkTruncation);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, maxLines, hasClamp]);

  const handleRevealOn = () => {
    if (!revealOnHoverOrTap || !isTruncated) return;
    setExpanded(true);
  };

  const handleRevealOff = () => {
    if (!revealOnHoverOrTap || !isTruncated) return;
    setExpanded(false);
  };

  const handleToggleClick = () => {
    if (!revealOnHoverOrTap || !isTruncated) return;
    setExpanded((prev) => !prev);
  };

  const showOverlay = revealOnHoverOrTap && isTruncated && expanded;

  const baseHeight = showOverlay ? contentHeight : clampedHeight;
  const gradientHeight =
    baseHeight != null ? baseHeight + GRADIENT_EXTRA_PX : undefined;

  return (
    <div
      className={cn("relative w-full", revealOnHoverOrTap && "cursor-pointer")}
      onMouseEnter={(e) => {
        onMouseEnter?.(e);
        handleRevealOn();
      }}
      onMouseLeave={(e) => {
        onMouseLeave?.(e);
        handleRevealOff();
      }}
      onFocus={(e) => {
        onFocus?.(e);
        handleRevealOn();
      }}
      onBlur={(e) => {
        onBlur?.(e);
        handleRevealOff();
      }}
      onClick={(e) => {
        onClick?.(e);
        handleToggleClick();
      }}
    >
      <QuestionTitle
        {...rest}
        ref={titleRef}
        className={className}
        style={{
          ...clampStyle,
          ...style,
          ...(showOverlay ? { visibility: "hidden" } : {}),
        }}
      >
        {children}
      </QuestionTitle>

      {showOverlay && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
            <QuestionTitle className={className} style={style}>
              {children}
            </QuestionTitle>
          </div>

          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 z-10",
              "bg-gradient-to-b from-blue-100/0 via-blue-100/90 to-blue-100",
              "dark:from-blue-100-dark/0 dark:via-blue-100-dark/90 dark:to-blue-100-dark"
            )}
            style={gradientHeight ? { height: gradientHeight } : undefined}
          />
        </>
      )}
    </div>
  );
};

export default TruncatableQuestionTitle;
