import { FC } from "react";

import useAppTheme from "@/hooks/use_app_theme";
import { ThemeColor } from "@/types/theme";

type Props = {
  points: {
    label: string;
    color: ThemeColor;
    x: number;
  }[];
};

const DateForecastCardTooltip: FC<Props> = ({ points }) => {
  const { getThemeColor } = useAppTheme();
  const sortedPoints = [...points].sort((a, b) => a.x - b.x);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {sortedPoints.map((point) => (
        <div
          key={point.label}
          className="flex items-center gap-1 text-center text-sm"
        >
          <span
            className="line-clamp-2 block h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: getThemeColor(point.color) }}
          />
          {point.label}
        </div>
      ))}
    </div>
  );
};

export default DateForecastCardTooltip;
