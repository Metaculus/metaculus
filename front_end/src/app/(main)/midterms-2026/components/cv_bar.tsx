"use client";

import { CSSProperties, FC } from "react";

import useAppTheme from "@/hooks/use_app_theme";
import cn from "@/utils/core/cn";
import { addOpacityToHex } from "@/utils/core/colors";

type Props = {
  /** 0-100 — how much of the parent track this bar fills. Ignored when
   *  `fill` is true. */
  pct?: number;
  /** When true, the bar fills 100% of its parent so the parent grid /
   *  flex can drive its width. Required for adjacent bars that must
   *  exactly tile their container without gap overflow. */
  fill?: boolean;
  /** Solid hex color (e.g. #6B7AE8). Drives the filled bg. */
  color: string;
  /** Border color override for light mode. Defaults to `color`. Use a
   *  darker shade for sharp contrast against the soft fill. */
  borderColor?: string;
  /** Tailwind height class (default `h-5`). */
  heightClassName?: string;
  /** Force the active (hover-like) styling regardless of cursor position.
   *  Used when external state (e.g. column-level hover in the Electoral
   *  Consequences table) decides the bar should appear lit. */
  active?: boolean;
  className?: string;
};

const BG_OPACITY_DEFAULT_LIGHT = 0.4;
// Dark mode needs more saturation to read against the navy card bg.
const BG_OPACITY_DEFAULT_DARK = 0.55;
// Glow ring radius (px) used on active state.
const ACTIVE_RING_PX = 3;
const ACTIVE_RING_OPACITY = 0.45;

/**
 * Visual primitive shaped like the consumer view multiple-choice bar:
 * rounded, full-color border, semi-transparent fill in the same color.
 *
 * Active (hover or tooltip-shown) styling is driven by the nearest
 * named-group ancestor:
 * - `group/cv` for direct hover over the row
 * - `group/cr` for the Chamber Control tooltip wrapper, which fires
 *   either via hover (desktop) or `data-open` (touch tap)
 *
 * On active, the fill goes to 100% color (no opacity), the border
 * darkens slightly via a CSS variable, and a colored glow ring is
 * applied via box-shadow so the highlight is unmistakable.
 *
 * In dark mode the darker `borderColor` would blend with the card bg
 * at rest, so we fall back to the primary `color` (which is a brighter
 * shade) for the resting border instead.
 */
const CvBar: FC<Props> = ({
  pct,
  fill,
  color,
  borderColor,
  heightClassName = "h-5",
  active,
  className,
}) => {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const resolvedBorder = isDark ? color : borderColor ?? color;
  const defaultOpacity = isDark
    ? BG_OPACITY_DEFAULT_DARK
    : BG_OPACITY_DEFAULT_LIGHT;

  const width = fill ? "100%" : `${Math.max(pct ?? 1, 1)}%`;

  const style: CSSProperties = {
    width,
    borderColor: resolvedBorder,
    backgroundColor: addOpacityToHex(color, defaultOpacity),
    // Active state: full color, slightly darker border, glow ring.
    ["--cv-bar-active-bg" as string]: color,
    ["--cv-bar-active-border" as string]: borderColor ?? color,
    ["--cv-bar-active-ring" as string]: `0 0 0 ${ACTIVE_RING_PX}px ${addOpacityToHex(color, ACTIVE_RING_OPACITY)}`,
  };

  return (
    <div
      data-active={active || undefined}
      className={cn(
        "block shrink-0 rounded-md border transition-[background-color,border-color,box-shadow] duration-150",
        // Active styling can be triggered by any of: direct hover on a
        // `group/cv` row, hover or tap-open on a `group/cr` Chamber
        // Control wrapper, or an explicit `active` prop (data-active).
        "group-hover/cv:border-[var(--cv-bar-active-border)] group-hover/cv:bg-[var(--cv-bar-active-bg)] group-hover/cv:shadow-[var(--cv-bar-active-ring)]",
        "group-hover/cr:border-[var(--cv-bar-active-border)] group-hover/cr:bg-[var(--cv-bar-active-bg)] group-hover/cr:shadow-[var(--cv-bar-active-ring)]",
        "group-data-[open]/cr:border-[var(--cv-bar-active-border)] group-data-[open]/cr:bg-[var(--cv-bar-active-bg)] group-data-[open]/cr:shadow-[var(--cv-bar-active-ring)]",
        "data-[active]:border-[var(--cv-bar-active-border)] data-[active]:bg-[var(--cv-bar-active-bg)] data-[active]:shadow-[var(--cv-bar-active-ring)]",
        heightClassName,
        className
      )}
      style={style}
    />
  );
};

export default CvBar;
