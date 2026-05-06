"use client";

import {
  FC,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import useMounted from "@/hooks/use_mounted";

type Props = {
  /** Document-space x (viewport rect.left + width/2 + scrollX). */
  x: number;
  /** Document-space y (viewport rect.top + scrollY). */
  y: number;
  /** Optional click handler for the wrapper button. */
  onClick?: () => void;
  /** Element used to detect "click outside" — taps inside this ref keep
   *  the tooltip open (e.g. the map container); the portal contents are
   *  also automatically excluded. */
  insideRef?: React.RefObject<HTMLElement | null>;
  /** Called when the user taps anywhere outside the map and tooltip. */
  onDismiss?: () => void;
  children: ReactNode;
};

const VIEWPORT_PADDING = 8;

/**
 * Renders the map tooltip into `document.body` via a portal so it escapes
 * any `overflow-hidden` clipping on its ancestors (e.g. the SectionCard
 * that clips the geographic map's zoomed paths).
 */
const MapTooltipPortal: FC<Props> = ({
  x,
  y,
  onClick,
  insideRef,
  onDismiss,
  children,
}) => {
  const mounted = useMounted();
  const tooltipRef = useRef<HTMLButtonElement>(null);
  const [adjustment, setAdjustment] = useState({
    leftOffset: 0,
    placeBelow: false,
  });

  // After the tooltip is rendered, measure it and if it's clipped by the
  // viewport edges, shift it horizontally and/or flip it below the anchor.
  useLayoutEffect(() => {
    const node = tooltipRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const overflowRight = rect.right - (viewportWidth - VIEWPORT_PADDING);
    const overflowLeft = VIEWPORT_PADDING - rect.left;
    let leftOffset = 0;
    if (overflowRight > 0) leftOffset = -overflowRight;
    if (overflowLeft > 0) leftOffset = overflowLeft;
    const placeBelow = rect.top - VIEWPORT_PADDING < window.scrollY;
    setAdjustment({ leftOffset, placeBelow });
  }, [x, y, mounted]);

  useEffect(() => {
    if (!onDismiss) return;
    const handle = (e: globalThis.MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (insideRef?.current?.contains(target)) return;
      if (tooltipRef.current?.contains(target)) return;
      onDismiss();
    };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [onDismiss, insideRef]);

  if (!mounted || typeof document === "undefined") return null;

  const transform = adjustment.placeBelow
    ? `translate(calc(-50% + ${adjustment.leftOffset}px), 16px)`
    : `translate(calc(-50% + ${adjustment.leftOffset}px), -100%)`;
  const top = adjustment.placeBelow ? y + 32 : y - 8;

  return createPortal(
    <button
      ref={tooltipRef}
      type="button"
      onClick={onClick}
      className="absolute z-[60] cursor-pointer"
      style={{
        left: x,
        top,
        transform,
      }}
    >
      {children}
    </button>,
    document.body
  );
};

export default MapTooltipPortal;
