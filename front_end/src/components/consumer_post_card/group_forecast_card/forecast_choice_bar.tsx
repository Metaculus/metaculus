"use client";

import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC } from "react";

import TruncatedTextTooltip from "@/components/truncated_text_tooltip";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useMounted from "@/hooks/use_mounted";
import { Resolution } from "@/types/post";
import { ThemeColor } from "@/types/theme";
import cn from "@/utils/core/cn";
import { addOpacityToHex } from "@/utils/core/colors";
import { isSuccessfullyResolved } from "@/utils/questions/resolution";

type Props = {
  choiceLabel: string;
  choiceValue: string;
  isClosed: boolean;
  displayedResolution?: Resolution | null;
  resolution: Resolution | null;
  progress: number;
  color: ThemeColor;
  isBordered?: boolean;
  borderOnly?: boolean;
  unit?: string;
  forceColorful?: boolean;
  compact?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
};

const WIDTH_ADJUSTMENT = 2;

const ForecastChoiceBar: FC<Props> = ({
  choiceLabel,
  choiceValue,
  progress,
  isClosed,
  displayedResolution,
  resolution,
  color,
  isBordered = true,
  borderOnly = false,
  unit,
  forceColorful = false,
  compact = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
  isActive = false,
  className,
}) => {
  const t = useTranslations();
  const { getThemeColor } = useAppTheme();
  const mounted = useMounted();
  const isCpRevealed = !isNaN(progress);

  const isResolutionSuccessful = isSuccessfullyResolved(resolution);

  // Outer glow for the active row uses the same color the fill resolves to
  // (gray when closed), at 25% opacity with no blur.
  const glowThemeColor =
    isClosed && !forceColorful ? METAC_COLORS.gray["500"] : color;
  const activeGlowStyle = isActive
    ? {
        boxShadow: `0 0 0 4px ${addOpacityToHex(
          mounted ? getThemeColor(glowThemeColor) : glowThemeColor.DEFAULT,
          0.25
        )}`,
      }
    : undefined;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      style={activeGlowStyle}
      className={cn(
        "relative flex w-full items-center justify-between gap-2 rounded-lg bg-transparent font-medium text-gray-800 dark:text-gray-800-dark",
        onMouseEnter && "group transition-colors",
        onMouseEnter &&
          !isActive &&
          "hover:bg-blue-500/20 dark:hover:bg-blue-500-dark/20",
        isActive && "bg-blue-500/30 dark:bg-blue-500-dark/30",
        onClick && "cursor-pointer",
        className,
        isBordered
          ? "border border-blue-400 dark:border-blue-400-dark"
          : "border border-transparent",
        compact
          ? "h-6 px-2 py-0.5 text-xs leading-4 md:h-8 md:px-2.5 md:py-1 md:text-base md:leading-6"
          : "h-8 px-2.5 py-1 text-base leading-6",
        {
          "text-purple-800 dark:text-purple-800-dark": isResolutionSuccessful,
          "border-2 border-gray-400 text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark":
            !isNil(resolution) && !isResolutionSuccessful,
          "border-gray-300 text-gray-800 dark:border-gray-300-dark dark:text-gray-800-dark":
            !isCpRevealed,
        }
      )}
    >
      <div className="z-10 flex max-w-[85%] overflow-hidden">
        <TruncatedTextTooltip
          text={choiceLabel}
          className="line-clamp-1"
          variant="light"
        />
      </div>
      <span
        className={cn("z-10 text-nowrap", {
          "text-xs font-normal text-gray-700 opacity-50 dark:text-gray-700-dark":
            !isCpRevealed,
        })}
      >
        {displayedResolution ? (
          <>
            {isResolutionSuccessful && (
              <span className="font-normal capitalize text-purple-800 dark:text-purple-800-dark">
                {t("result")}:{" "}
              </span>
            )}
            {isResolutionSuccessful ? (
              <span className="font-bold text-purple-800 dark:text-purple-800-dark">
                {unit
                  ? String(displayedResolution).replace(unit, "")
                  : displayedResolution}
                {unit && <span className="font-normal">{unit}</span>}
              </span>
            ) : (
              <span className="font-bold">{displayedResolution}</span>
            )}
          </>
        ) : (
          choiceValue
        )}
      </span>

      {isCpRevealed && (
        <div
          className={cn(
            "absolute -inset-[1px] z-0 rounded-lg border",
            onMouseEnter &&
              (isActive
                ? "opacity-100 transition-opacity"
                : "opacity-75 transition-opacity group-hover:opacity-100"),
            {
              "border-2": resolution || isActive,
            }
          )}
          style={{
            display:
              !isNil(resolution) && !isResolutionSuccessful ? "none" : "block",
            width: borderOnly
              ? `calc(100% + ${WIDTH_ADJUSTMENT}px)`
              : progress < 3
                ? "3%"
                : `calc(${progress}% + ${WIDTH_ADJUSTMENT}px)`,
            background: (() => {
              if (borderOnly || resolution) {
                return "transparent";
              }
              if (isClosed && !forceColorful) {
                return addOpacityToHex(
                  mounted
                    ? getThemeColor(METAC_COLORS.gray["500"])
                    : METAC_COLORS.gray["500"].DEFAULT,
                  0.4
                );
              }
              return addOpacityToHex(
                mounted ? getThemeColor(color) : color.DEFAULT,
                0.4
              );
            })(),
            borderColor: (() => {
              if (resolution) {
                return mounted
                  ? getThemeColor(METAC_COLORS.purple["700"])
                  : METAC_COLORS.gray["700"].DEFAULT;
              }
              if (isClosed && !forceColorful) {
                return addOpacityToHex(
                  mounted
                    ? getThemeColor(METAC_COLORS.gray["500"])
                    : METAC_COLORS.gray["500"].DEFAULT,
                  0.5
                );
              }
              return mounted ? getThemeColor(color) : color.DEFAULT;
            })(),
          }}
        ></div>
      )}
    </div>
  );
};

export default ForecastChoiceBar;
