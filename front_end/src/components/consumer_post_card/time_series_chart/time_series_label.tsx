/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useTranslations } from "next-intl";
import { FC } from "react";
import { VictoryLabel } from "victory";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import { getTruncatedLabel } from "@/utils/charts";

type Props = {
  isTickLabel?: boolean;
  labelVisibilityMap: boolean[];
};

const TimeSeriesLabel: FC<Props & any> = ({
  isTickLabel = false,
  labelVisibilityMap,
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
        isChipText ? METAC_COLORS.purple["600"] : METAC_COLORS.purple["700"]
      );
    }
    if (datum.isClosed) {
      return getThemeColor(
        isChipText ? METAC_COLORS.gray["500"] : METAC_COLORS.gray["700"]
      );
    }
    return getThemeColor(METAC_COLORS.blue["700"]);
  };
  if (isTickLabel) {
    return (
      <VictoryLabel
        datum={datum}
        className="max-w-[100px] truncate"
        y={scale.y(0)}
        dy={20}
        {...rest}
        style={{
          fontSize: 14,
          fontFamily: "var(--font-inter-variable)",
          fill: ({ datum }: any) => getLabelColor(datum),
        }}
        text={({ datum, index }: any) =>
          labelVisibilityMap[index]
            ? shouldTrancateText
              ? getTruncatedLabel(datum.x, 20)
              : datum.x
            : ""
        }
      />
    );
  }

  return (
    <g>
      {(datum.isClosed || datum.resolution) && (
        <VictoryLabel
          datum={datum}
          y={scale.y(datum.y)}
          dy={["no", "yes"].includes(datum.resolution as string) ? -26 : -23}
          {...rest}
          style={{
            fontSize: 14,
            fontWeight: 500,
            lineHeight: "16px",
            fontFamily: "var(--font-inter-variable)",
            fill: ({ datum }: any) => getLabelColor(datum, true),
          }}
          text={({ datum, index }: any) =>
            labelVisibilityMap[index]
              ? datum.isClosed
                ? t("closed").toUpperCase()
                : t("resolved").toUpperCase()
              : ""
          }
        />
      )}
      <VictoryLabel
        datum={datum}
        y={scale.y(datum.y)}
        dy={["no", "yes"].includes(datum.resolution as string) ? -8 : -5}
        {...rest}
        className="font-inter"
        style={{
          fontSize: 16,
          fontWeight: 700,
          fontFamily: "var(--font-inter-variable)",
          fill: ({ datum }: any) => getLabelColor(datum),
        }}
        text={({ datum, index }: any) =>
          labelVisibilityMap[index] ? `${datum.label}` : ""
        }
      />
    </g>
  );
};

export default TimeSeriesLabel;
