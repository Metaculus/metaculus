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
  const getLabelColor = (datum: any) => {
    if (datum.resolution) {
      return getThemeColor(METAC_COLORS.purple["700"]);
    }
    if (datum.isClosed) {
      return getThemeColor(METAC_COLORS.gray["700"]);
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
          dy={-20}
          {...rest}
          style={{
            fontSize: 12,
            fontWeight: 500,
            fill: ({ datum }: any) => getLabelColor(datum),
          }}
          text={({ datum, index }: any) =>
            labelVisibilityMap[index]
              ? datum.isClosed
                ? t("closed")
                : t("resolved")
              : ""
          }
        />
      )}
      <VictoryLabel
        datum={datum}
        y={scale.y(datum.y)}
        dy={-5}
        {...rest}
        style={{
          fontSize: 16,
          fontWeight: 700,
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
