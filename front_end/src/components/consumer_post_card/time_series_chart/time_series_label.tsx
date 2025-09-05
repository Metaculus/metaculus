/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useTranslations } from "next-intl";
import { FC } from "react";
import { VictoryLabel } from "victory";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import { calculateTextWidth } from "@/utils/charts/helpers";

type Props = {
  isTickLabel?: boolean;
  labelVisibilityMap: boolean[];
  widthPerLabel?: number;
  allQuestionsEmpty?: boolean;
  colorful?: boolean;
};

const TimeSeriesLabel: FC<Props & any> = ({
  isTickLabel = false,
  labelVisibilityMap,
  widthPerLabel,
  allQuestionsEmpty = false,
  colorful = false,
  ...props
}) => {
  const { datum, y, dy, scale, ...rest } = props;
  const t = useTranslations();
  const { getThemeColor } = useAppTheme();
  const shouldTrancateText = labelVisibilityMap.some(
    (value: boolean) => !value
  );
  const getLabelColor = (datum: any, isChipText?: boolean) => {
    if (datum.resolution) {
      return getThemeColor(
        isChipText ? METAC_COLORS.purple["600"] : METAC_COLORS.purple["800"]
      );
    }
    if (datum.isClosed) {
      return getThemeColor(
        isChipText ? METAC_COLORS.gray["500"] : METAC_COLORS.gray["700"]
      );
    }
    return getThemeColor(METAC_COLORS.blue["700"]);
  };
  if (isTickLabel && widthPerLabel) {
    const textLines = wrapText(datum.x, widthPerLabel);
    return (
      <VictoryLabel
        datum={datum}
        y={scale.y(0)}
        dy={textLines.length === 1 ? 20 : 30}
        {...rest}
        style={{
          fontSize: shouldTrancateText ? 12 : 14,
          fontFamily: "var(--font-inter-variable)",
          fill: ({ datum }: any) =>
            datum.isEmpty
              ? getThemeColor(METAC_COLORS.gray["700"])
              : getLabelColor(datum),
        }}
        text={() => textLines.join("\n")}
      />
    );
  }

  return (
    <g>
      {!colorful && (datum.isClosed || datum.resolution) && !datum.isEmpty && (
        <VictoryLabel
          datum={datum}
          y={scale.y(datum.y)}
          dy={["no", "yes"].includes(datum.resolution as string) ? -26 : -23}
          {...rest}
          style={{
            fontSize: 12,
            fontWeight: 400,
            lineHeight: "16px",
            fontFamily: "var(--font-inter-variable)",
            fill: ({ datum }: any) => getLabelColor(datum, true),
          }}
          text={({ datum, index }: any) =>
            labelVisibilityMap[index]
              ? datum.isClosed
                ? t("pending").toUpperCase()
                : t("resolved").toUpperCase()
              : ""
          }
        />
      )}
      <VictoryLabel
        datum={datum}
        y={scale.y(datum.y)}
        dy={
          datum.isEmpty
            ? allQuestionsEmpty
              ? 0
              : 60
            : ["no", "yes"].includes(datum.resolution as string)
              ? -8
              : -5
        }
        {...rest}
        className="font-inter"
        style={{
          fontSize: 16,
          fontWeight: colorful ? 500 : 700,
          lineHeight: "24px",
          fontFamily: "var(--font-inter-variable)",
          fill: ({ datum }: any) =>
            colorful
              ? getThemeColor(METAC_COLORS.gray["900"])
              : datum.isEmpty
                ? getThemeColor(METAC_COLORS.gray["500"])
                : getLabelColor(datum),
        }}
        text={({ datum, index }: any) =>
          labelVisibilityMap[index] ? `${datum.label}` : ""
        }
      />
    </g>
  );
};

const wrapText = (text: string, maxWidth: number) => {
  if (!text?.trim()) {
    return [];
  }

  const splitWord = (word: string): [string, string | null] => {
    let firstPart = word;
    while (
      calculateTextWidth(14, firstPart + "...") > maxWidth &&
      firstPart.length > 3
    ) {
      firstPart = firstPart.slice(0, -1);
    }
    const remainingPart =
      firstPart.length < word.length ? word.slice(firstPart.length) : null;
    return [firstPart, remainingPart];
  };

  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  if (!words[0]) return lines;

  let currentLine = "";
  const remainingWords = [...words];

  while (remainingWords.length > 0) {
    const word = remainingWords[0] as string;
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = calculateTextWidth(14, testLine);

    if (width <= maxWidth) {
      currentLine = testLine;
      remainingWords.shift();
      if (remainingWords.length === 0) {
        lines.push(currentLine);
      }
    } else {
      if (!currentLine) {
        const [firstPart, remaining] = splitWord(word as string);
        lines.push(firstPart);
        remainingWords.shift();
        if (remaining) {
          remainingWords.unshift(remaining);
        }
        break;
      } else {
        lines.push(currentLine);
        break;
      }
    }
  }

  if (lines.length < 2 && remainingWords.length > 0) {
    currentLine = remainingWords[0] as string;
    let i = 1;
    while (i < remainingWords.length) {
      const testLine = `${currentLine} ${remainingWords[i]}`;
      const width = calculateTextWidth(14, testLine);

      if (width <= maxWidth) {
        currentLine = testLine;
        i++;
      } else {
        currentLine += "...";
        break;
      }
    }
    if (i < remainingWords.length && !currentLine.includes("...")) {
      currentLine += "...";
    }
    lines.push(currentLine);
  }

  return lines;
};

export default TimeSeriesLabel;
