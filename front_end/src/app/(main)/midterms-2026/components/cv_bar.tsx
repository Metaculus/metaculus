"use client";

import { CSSProperties, FC } from "react";

import useAppTheme from "@/hooks/use_app_theme";
import cn from "@/utils/core/cn";
import { addOpacityToHex } from "@/utils/core/colors";

/** A hex color, optionally split into separate light + dark values that
 *  CvBar resolves based on the active theme. Plain hex strings keep the
 *  same value across themes. */
export type ThemedColor = string | { light: string; dark: string };

export type GradientColorStop = {
  fill: ThemedColor;
  border: ThemedColor;
};

type Props = {
  /** 0-100 — how much of the parent track this bar fills. Ignored when
   *  `fill` is true. */
  pct?: number;
  /** When true, the bar fills 100% of its parent so the parent grid /
   *  flex can drive its width. Required for adjacent bars that must
   *  exactly tile their container without gap overflow. */
  fill?: boolean;
  /** Solid color. Drives the filled bg. Ignored when `gradientColors`
   *  is provided. */
  color?: ThemedColor;
  /** Border color override for light mode. Defaults to `color`. Use a
   *  darker shade for sharp contrast against the soft fill. */
  borderColor?: ThemedColor;
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

const BG_OPACITY_REST_LIGHT = 0.4;
// Dark mode needs more saturation to read against the navy card bg.
const BG_OPACITY_REST_DARK = 0.55;
// Active state bumps opacity additively by +0.2 (cap 1.0).
const BG_OPACITY_ACTIVE_BUMP = 0.2;

const resolveThemed = (c: ThemedColor | undefined, isDark: boolean): string => {
  if (!c) return "#999999";
  if (typeof c === "string") return c;
  return isDark ? c.dark : c.light;
};

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
 * On active, border-width doubles (1 → 2px) and the fill opacity bumps
 * by +0.2. Stroke color is held at 1.0 opacity; the doubled width
 * carries the visual emphasis.
 *
 * In dark mode the darker `borderColor` would blend with the card bg,
 * so we fall back to the brighter `color` for the resting border
 * instead. Each color prop accepts a `{ light, dark }` pair so callers
 * can supply mode-specific hex values for proper contrast in both
 * themes.
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
  const restOpacity = isDark ? BG_OPACITY_REST_DARK : BG_OPACITY_REST_LIGHT;
  const activeOpacity = Math.min(restOpacity + BG_OPACITY_ACTIVE_BUMP, 1);

  const width = fill ? "100%" : `${Math.max(pct ?? 1, 1)}%`;

  if (gradientColors) {
    const [fromRaw, toRaw] = gradientColors;
    const fromFill = resolveThemed(fromRaw.fill, isDark);
    const toFill = resolveThemed(toRaw.fill, isDark);
    const fromBorderResolved = resolveThemed(fromRaw.border, isDark);
    const toBorderResolved = resolveThemed(toRaw.border, isDark);
    // Same border-color rule as solid bars: in dark mode the darker
    // `border` shade blends with the card, so use the brighter `fill`.
    const restBorderFrom = isDark ? fromFill : fromBorderResolved;
    const restBorderTo = isDark ? toFill : toBorderResolved;

    const fillRest = `linear-gradient(to right, ${addOpacityToHex(fromFill, restOpacity)}, ${addOpacityToHex(toFill, restOpacity)})`;
    const fillActive = `linear-gradient(to right, ${addOpacityToHex(fromFill, activeOpacity)}, ${addOpacityToHex(toFill, activeOpacity)})`;
    const borderRest = `linear-gradient(to right, ${restBorderFrom}, ${restBorderTo})`;
    const borderActive = `linear-gradient(to right, ${fromBorderResolved}, ${toBorderResolved})`;

    const style: CSSProperties = {
      width,
      background: "var(--cv-bar-fill)",
      ["--cv-bar-fill" as string]: fillRest,
      ["--cv-bar-fill-active" as string]: fillActive,
      ["--cv-bar-border" as string]: borderRest,
      ["--cv-bar-border-active" as string]: borderActive,
    };

    return (
      <div
        data-active={active || undefined}
        className={cn(
          "group/cvg relative block shrink-0 rounded-md",
          // Active triggers swap fill + border + bump the border padding.
          "group-hover/cv:[--cv-bar-border-pad:2px] group-hover/cv:[--cv-bar-border:var(--cv-bar-border-active)] group-hover/cv:[--cv-bar-fill:var(--cv-bar-fill-active)]",
          "group-hover/cr:[--cv-bar-border-pad:2px] group-hover/cr:[--cv-bar-border:var(--cv-bar-border-active)] group-hover/cr:[--cv-bar-fill:var(--cv-bar-fill-active)]",
          "group-data-[open]/cr:[--cv-bar-border-pad:2px] group-data-[open]/cr:[--cv-bar-border:var(--cv-bar-border-active)] group-data-[open]/cr:[--cv-bar-fill:var(--cv-bar-fill-active)]",
          "data-[active]:[--cv-bar-border-pad:2px] data-[active]:[--cv-bar-border:var(--cv-bar-border-active)] data-[active]:[--cv-bar-fill:var(--cv-bar-fill-active)]",
          heightClassName,
          className
        )}
        style={style}
      >
        {/* Gradient-border overlay. The mask-composite trick paints the
            border gradient only in the padding ring around the inner
            content box, so it doesn't bleed under the semi-transparent
            fill. The padding width is driven by --cv-bar-border-pad so
            the active state doubles it (1px → 2px). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-md [background:var(--cv-bar-border)] [padding:var(--cv-bar-border-pad,1px)]"
          style={{
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
      </div>
    );
  }

  const solidColor = resolveThemed(color, isDark);
  const resolvedBorderColor = resolveThemed(borderColor ?? color, isDark);
  // In dark mode, the darker borderColor would blend with the card bg
  // at rest, so we fall back to the primary `color` (brighter) for the
  // resting border.
  const restBorder = isDark ? solidColor : resolvedBorderColor;
  const activeBorder = resolvedBorderColor;

  const style: CSSProperties = {
    width,
    backgroundColor:
      "var(--cv-bar-bg, " + addOpacityToHex(solidColor, restOpacity) + ")",
    borderColor: "var(--cv-bar-border, " + restBorder + ")",
    borderWidth: "var(--cv-bar-border-w, 1px)",
    ["--cv-bar-bg-active" as string]: addOpacityToHex(
      solidColor,
      activeOpacity
    ),
    ["--cv-bar-border-active" as string]: activeBorder,
  };

  return (
    <div
      data-active={active || undefined}
      className={cn(
        "block shrink-0 rounded-md border-solid",
        // Active triggers bump bg opacity, swap to the darker border,
        // and double the border width.
        "group-hover/cv:[--cv-bar-bg:var(--cv-bar-bg-active)] group-hover/cv:[--cv-bar-border-w:2px] group-hover/cv:[--cv-bar-border:var(--cv-bar-border-active)]",
        "group-hover/cr:[--cv-bar-bg:var(--cv-bar-bg-active)] group-hover/cr:[--cv-bar-border-w:2px] group-hover/cr:[--cv-bar-border:var(--cv-bar-border-active)]",
        "group-data-[open]/cr:[--cv-bar-bg:var(--cv-bar-bg-active)] group-data-[open]/cr:[--cv-bar-border-w:2px] group-data-[open]/cr:[--cv-bar-border:var(--cv-bar-border-active)]",
        "data-[active]:[--cv-bar-bg:var(--cv-bar-bg-active)] data-[active]:[--cv-bar-border-w:2px] data-[active]:[--cv-bar-border:var(--cv-bar-border-active)]",
        heightClassName,
        className
      )}
      style={style}
    />
  );
};

export default CvBar;
