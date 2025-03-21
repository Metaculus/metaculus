import { FC } from "react";

import useAppTheme from "@/hooks/use_app_theme";
import { ThemeColor } from "@/types/theme";

type Props = {
  points: {
    x: number;
    y: number;
    label: string;
    color: ThemeColor;
  }[];
};

const DateForecastCardTooltip: FC<Props> = ({ points }) => {
  const { getThemeColor } = useAppTheme();
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 gap-y-2">
      {points.map((point) => (
        <div key={point.label} className="flex items-center gap-1 text-center">
          <span
            className="line-clamp-2 block h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: getThemeColor(point.color) }}
          ></span>
          {point.label}
        </div>
      ))}
    </div>
  );
};

export default DateForecastCardTooltip;
