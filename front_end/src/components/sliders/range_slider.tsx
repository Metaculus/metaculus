"use client";
import Slider from "rc-slider";
import {
  FC,
  KeyboardEvent,
  PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import "./slider.css";

import SliderThumb from "@/components/sliders/primitives/thumb";
import { nudgeSteps } from "@/components/ui/nudge_buttons";

export type RangeSliderValue = {
  left: number;
  right: number;
};

type Props = {
  value: RangeSliderValue;
  step: number;
  // Minimum distance kept between the two outer thumbs
  minGap?: number;
  onChange: (value: RangeSliderValue) => void;
  disabled?: boolean;
};

// The center thumb is hidden when the outer thumbs are closer than this
// (in px, center to center): room for half of each outer thumb (16px), the
// center thumb (20px), and a little breathing space.
const MIN_CENTER_THUMB_GAP_PX = 44;
// How far one arrow key press moves the center thumb
const CENTER_KEYBOARD_STEP = 0.01;

/**
 * Two-thumb slider over [0, 1], plus a center thumb at the midpoint that
 * moves the whole range (as does dragging the track between the thumbs).
 * The center isn't part of the value; it's always derived from the edges.
 */
const RangeSlider: FC<Props> = ({
  value,
  step,
  minGap = 0,
  onChange,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const dragRef = useRef<{
    startX: number;
    startValue: RangeSliderValue;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    // Without ResizeObserver (e.g. jsdom) the center thumb just stays hidden
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setContainerWidth(entry.contentRect.width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Shift the whole range by `delta`, keeping its width and staying in
  // [0, 1]. Edges pinned at an end are set exactly (not via floating-point
  // arithmetic) since an edge at exactly 0 or 1 has special meaning for
  // open bounds.
  const shiftBy = (from: RangeSliderValue, delta: number) => {
    const width = from.right - from.left;
    if (from.left + delta <= 0) {
      onChange({ left: 0, right: width });
    } else if (from.right + delta >= 1) {
      onChange({ left: 1 - width, right: 1 });
    } else {
      onChange({ left: from.left + delta, right: from.right + delta });
    }
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startValue: value };
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !containerWidth) return;
    shiftBy(drag.startValue, (e.clientX - drag.startX) / containerWidth);
  };

  const handlePointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const direction =
      e.key === "ArrowLeft" || e.key === "ArrowDown"
        ? -1
        : e.key === "ArrowRight" || e.key === "ArrowUp"
          ? 1
          : 0;
    if (!direction) return;
    e.preventDefault();
    // Shift moves further, like the table's nudges
    shiftBy(value, nudgeSteps(direction, e.shiftKey) * CENTER_KEYBOARD_STEP);
  };

  const center = (value.left + value.right) / 2;
  const showCenterThumb =
    containerWidth > 0 &&
    (value.right - value.left) * containerWidth >= MIN_CENTER_THUMB_GAP_PX;

  return (
    <div ref={containerRef} className="relative">
      <Slider
        min={0}
        max={1}
        step={step}
        value={[value.left, value.right]}
        range
        disabled={disabled}
        onChange={(v) => {
          const [left, right] = v as [number, number];
          onChange({ left, right });
        }}
        pushable={minGap}
        allowCross={false}
        draggableTrack
        style={{ touchAction: "pan-y" }}
        handleRender={(origin, props) => (
          <SliderThumb
            {...origin.props}
            value={props.index === 0 ? value.left : value.right}
            active={false}
          />
        )}
      />
      {showCenterThumb && (
        // Overlays the slider at the same height so the thumb lines up
        // with the others. Only the thumb itself takes pointer events.
        <div className="pointer-events-none absolute inset-0 flex items-center">
          <SliderThumb
            className="pointer-events-auto"
            style={{ left: `${center * 100}%`, transform: "translateX(-50%)" }}
            value={center}
            active
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={center}
            aria-disabled={disabled}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onKeyDown={handleKeyDown}
          />
        </div>
      )}
    </div>
  );
};

export default RangeSlider;
