import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC } from "react";

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
  unit?: string;
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
  isBordered = false,
  unit,
}) => {
  const t = useTranslations();
  const { getThemeColor } = useAppTheme();
  const mounted = useMounted();
  const isCpRevealed = !isNaN(progress);

  const isResolutionSuccessful = isSuccessfullyResolved(resolution);
  return (
    <div
      className={cn(
        "relative flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-blue-400 bg-transparent px-2.5 py-1 text-base font-medium leading-6 text-gray-800 dark:border-blue-400-dark dark:text-gray-800-dark",
        {
          "border-transparent": !isBordered,
          "text-purple-800 dark:text-purple-800-dark": isResolutionSuccessful,
          "border-2 border-gray-400 text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark":
            !isNil(resolution) && !isResolutionSuccessful,
          "border-gray-300 text-gray-800 dark:border-gray-300-dark dark:text-gray-800-dark":
            !isCpRevealed,
        }
      )}
    >
      <span className="z-10 line-clamp-1 max-w-[85%]">{choiceLabel}</span>
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
          className={cn("absolute -inset-[1px] z-0 h-8 rounded-lg border", {
            "border-2": resolution,
          })}
          style={{
            display:
              !isNil(resolution) && !isResolutionSuccessful ? "none" : "block",
            width:
              progress < 3
                ? "3%"
                : `calc(${progress}% + ${WIDTH_ADJUSTMENT}px)`,
            background: (() => {
              if (resolution) {
                return "transparent";
              } else if (isClosed) {
                return addOpacityToHex(
                  mounted
                    ? getThemeColor(METAC_COLORS.gray["500"])
                    : METAC_COLORS.gray["500"].DEFAULT,
                  0.3
                );
              }
              return addOpacityToHex(
                mounted ? getThemeColor(color) : color.DEFAULT,
                0.3
              );
            })(),
            borderColor: (() => {
              if (resolution) {
                return mounted
                  ? getThemeColor(METAC_COLORS.purple["700"])
                  : METAC_COLORS.gray["700"].DEFAULT;
              }

              return isClosed
                ? addOpacityToHex(
                    mounted
                      ? getThemeColor(METAC_COLORS.gray["500"])
                      : METAC_COLORS.gray["500"].DEFAULT,
                    0.5
                  )
                : mounted
                  ? getThemeColor(color)
                  : color.DEFAULT;
            })(),
          }}
        ></div>
      )}
    </div>
  );
};

export default ForecastChoiceBar;
