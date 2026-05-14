"use client";

import { CSSProperties, FC } from "react";

import useAppTheme from "@/hooks/use_app_theme";
import cn from "@/utils/core/cn";
import { addOpacityToHex } from "@/utils/core/colors";

type Props = {
  /** 0-100 — how much of the parent track this bar fills */
  pct: number;
  /** Solid hex color (e.g. #6B7AE8). Drives the filled bg at 40% opacity. */
  color: string;
  /** Border color override for light mode. Defaults to `color`. Use a
   *  darker shade for sharp contrast against the soft fill. */
  borderColor?: string;
  /** Tailwind height class (default `h-5`). */
  heightClassName?: string;
  className?: string;
};

const BG_OPACITY_DEFAULT_LIGHT = 0.4;
const BG_OPACITY_HOVER_LIGHT = 0.7;
// Dark mode needs more saturation to read against the navy card bg.
const BG_OPACITY_DEFAULT_DARK = 0.55;
const BG_OPACITY_HOVER_DARK = 0.85;

/**
 * Visual primitive shaped like the consumer view multiple-choice bar:
 * rounded, full-color border, semi-transparent fill in the same color.
 *
 * Hover styling is *driven by the nearest `group/cv` ancestor* — wrap
 * the parent row in `className="group/cv"` so hovering anywhere in the
 * row brightens every bar inside.
 *
 * In dark mode the darker `borderColor` would blend with the card bg,
 * so we fall back to the primary `color` (which is a brighter shade)
 * for the border instead.
 */
const CvBar: FC<Props> = ({
  pct,
  color,
  borderColor,
  heightClassName = "h-5",
  className,
}) => {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const resolvedBorder = isDark ? color : borderColor ?? color;
  const defaultOpacity = isDark
    ? BG_OPACITY_DEFAULT_DARK
    : BG_OPACITY_DEFAULT_LIGHT;
  const hoverOpacity = isDark ? BG_OPACITY_HOVER_DARK : BG_OPACITY_HOVER_LIGHT;

  const style: CSSProperties = {
    width: `${Math.max(pct, 1)}%`,
    borderColor: resolvedBorder,
    backgroundColor: addOpacityToHex(color, defaultOpacity),
    ["--cv-bar-hover-bg" as string]: addOpacityToHex(color, hoverOpacity),
  };

  return (
    <div
      className={cn(
        "block shrink-0 rounded-md border transition-colors duration-150",
        "group-hover/cv:bg-[var(--cv-bar-hover-bg)]",
        heightClassName,
        className
      )}
      style={style}
    />
  );
};

export default CvBar;
