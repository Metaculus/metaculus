"use client";

import { CSSProperties, FC } from "react";

import useAppTheme from "@/hooks/use_app_theme";
import cn from "@/utils/core/cn";
import { addOpacityToHex } from "@/utils/core/colors";

export type GradientColorStop = {
  fill: string;
  border: string;
};

type Props = {
  /** 0-100 — how much of the parent track this bar fills. Ignored when
   *  `fill` is true. */
  pct?: number;
  /** When true, the bar fills 100% of its parent so the parent grid /
   *  flex can drive its width. Required for adjacent bars that must
   *  exactly tile their container without gap overflow. */
  fill?: boolean;
  /** Solid hex color (e.g. #6B7AE8). Drives the filled bg. Ignored when
   *  `gradientColors` is provided. */
  color?: string;
  /** Border color override for light mode. Defaults to `color`. Use a
   *  darker shade for sharp contrast against the soft fill. */
  borderColor?: string;
  /** When provided, the bar renders with a horizontal gradient fill and
   *  matching gradient border, transitioning from the first color stop
   *  on the left to the second on the right. Used for split-control
   *  outcomes where neither party "owns" the bar. Overrides `color` /
   *  `borderColor`. */
  gradientColors?: [GradientColorStop, GradientColorStop];
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
 *
 * When `gradientColors` is provided, the bar renders with a horizontal
 * `linear-gradient` fill + matching gradient border. The active state
 * swaps the gradient to its full-opacity variant via a CSS variable.
 */
const CvBar: FC<Props> = ({
  pct,
  fill,
  color,
  borderColor,
  gradientColors,
  heightClassName = "h-5",
  active,
  className,
}) => {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";

  const width = fill ? "100%" : `${Math.max(pct ?? 1, 1)}%`;

  if (gradientColors) {
    const [from, to] = gradientColors;
    const defaultOpacity = isDark
      ? BG_OPACITY_DEFAULT_DARK
      : BG_OPACITY_DEFAULT_LIGHT;
    // Same border-color rule as solid bars: in dark mode the darker
    // `border` shade blends with the card, so use the brighter `fill`.
    const restBorderFrom = isDark ? from.fill : from.border;
    const restBorderTo = isDark ? to.fill : to.border;

    const restFill = `linear-gradient(to right, ${addOpacityToHex(from.fill, defaultOpacity)}, ${addOpacityToHex(to.fill, defaultOpacity)}) padding-box, linear-gradient(to right, ${restBorderFrom}, ${restBorderTo}) border-box`;
    const activeFill = `linear-gradient(to right, ${from.fill}, ${to.fill}) padding-box, linear-gradient(to right, ${from.border}, ${to.border}) border-box`;

    // Glow ring uses the from-color (left edge) — single source so the
    // ring reads cleanly. It's subtle either way.
    const ringColor = from.fill;

    const style: CSSProperties = {
      width,
      background: "var(--cv-bar-bg, var(--cv-bar-bg-rest))",
      ["--cv-bar-bg-rest" as string]: restFill,
      ["--cv-bar-bg-active" as string]: activeFill,
      ["--cv-bar-active-ring" as string]: `0 0 0 ${ACTIVE_RING_PX}px ${addOpacityToHex(ringColor, ACTIVE_RING_OPACITY)}`,
    };

    return (
      <div
        data-active={active || undefined}
        className={cn(
          "block shrink-0 rounded-md border border-transparent transition-[background,box-shadow] duration-150",
          // Swap the gradient + apply ring on any of the active triggers.
          "group-hover/cv:shadow-[var(--cv-bar-active-ring)] group-hover/cv:[--cv-bar-bg:var(--cv-bar-bg-active)]",
          "group-hover/cr:shadow-[var(--cv-bar-active-ring)] group-hover/cr:[--cv-bar-bg:var(--cv-bar-bg-active)]",
          "group-data-[open]/cr:shadow-[var(--cv-bar-active-ring)] group-data-[open]/cr:[--cv-bar-bg:var(--cv-bar-bg-active)]",
          "data-[active]:shadow-[var(--cv-bar-active-ring)] data-[active]:[--cv-bar-bg:var(--cv-bar-bg-active)]",
          heightClassName,
          className
        )}
        style={style}
      />
    );
  }

  const solidColor = color ?? "#999999";
  const resolvedBorder = isDark ? solidColor : borderColor ?? solidColor;
  const defaultOpacity = isDark
    ? BG_OPACITY_DEFAULT_DARK
    : BG_OPACITY_DEFAULT_LIGHT;

  const style: CSSProperties = {
    width,
    borderColor: resolvedBorder,
    backgroundColor: addOpacityToHex(solidColor, defaultOpacity),
    // Active state: full color, slightly darker border, glow ring.
    ["--cv-bar-active-bg" as string]: solidColor,
    ["--cv-bar-active-border" as string]: borderColor ?? solidColor,
    ["--cv-bar-active-ring" as string]: `0 0 0 ${ACTIVE_RING_PX}px ${addOpacityToHex(solidColor, ACTIVE_RING_OPACITY)}`,
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
