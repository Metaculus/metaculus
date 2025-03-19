/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC } from "react";
import { VictoryLabel } from "victory";

import { METAC_COLORS } from "@/constants/colors";

type Props = {
  getThemeColor: (color: string) => string;
  isTickLabel?: boolean;
};

const TimeSeriesLabel: FC<Props & any> = ({
  isTickLabel = false,
  getThemeColor,
  ...props
}) => {
  const { datum, y, dy, scale, ...rest } = props;

  const truncateText = (text: string, maxLength = 20) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };
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
        text={({ datum }: any) => truncateText(datum.x)}
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
          text={({ datum }: any) => (datum.isClosed ? `Closed` : `Resolved`)}
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
        text={({ datum }: any) => `${datum.label}`}
      />
    </g>
  );
};

export default TimeSeriesLabel;
