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

  const isResolutionSuccessful = isSuccessfullyResolved(resolution);
  return (
    <div
      className={cn(
        "relative flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-blue-400 bg-transparent px-2.5 py-1 text-base font-medium leading-6 text-gray-900 dark:border-blue-400-dark dark:text-gray-900-dark",
        {
          "border-0": !isBordered,
          "border-2 border-purple-700 text-purple-800 dark:border-purple-700-dark dark:text-purple-800-dark":
            isResolutionSuccessful,
          "border-2 border-gray-400 text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark":
            !isNil(resolution) && !isResolutionSuccessful,
        }
      )}
    >
      <span className="z-10 line-clamp-1 max-w-[85%]">{choiceLabel}</span>
      <span className="z-10 text-nowrap">
        {displayedResolution ? (
          <>
            {isResolutionSuccessful && (
              <span className="font-medium capitalize text-purple-600 dark:text-purple-600-dark">
                {t("result")}:{" "}
              </span>
            )}
            <span className="font-bold">
              {isResolutionSuccessful ? (
                <>
                  {unit
                    ? String(displayedResolution).replace(unit, "")
                    : displayedResolution}
                  {unit && <span className="font-normal">{unit}</span>}
                </>
              ) : (
                displayedResolution
              )}
            </span>
          </>
        ) : (
          choiceValue
        )}
      </span>

      <div
        className={"absolute -inset-[1px] z-0 h-8 rounded-lg border"}
        style={{
          display: resolution ? "none" : "block",
          width:
            progress < 3 ? "3%" : `calc(${progress}% + ${WIDTH_ADJUSTMENT}px)`,
          background: (() => {
            if (resolution) {
              return "transparent";
            } else if (isClosed) {
              return addOpacityToHex(
                mounted
                  ? getThemeColor(METAC_COLORS.gray["500"])
                  : METAC_COLORS.gray["500"].DEFAULT,
                0.5
              );
            }
            return addOpacityToHex(
              mounted ? getThemeColor(color) : color.DEFAULT,
              0.3
            );
          })(),
          borderColor: isClosed
            ? mounted
              ? getThemeColor(METAC_COLORS.gray["500"])
              : METAC_COLORS.gray["500"].DEFAULT
            : mounted
              ? getThemeColor(color)
              : color.DEFAULT,
        }}
      ></div>
    </div>
  );
};

export default ForecastChoiceBar;
