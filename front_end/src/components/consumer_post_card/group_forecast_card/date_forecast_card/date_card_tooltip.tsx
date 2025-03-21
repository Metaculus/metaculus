import { FC } from "react";

import useAppTheme from "@/hooks/use_app_theme";
import { ThemeColor } from "@/types/theme";

type Props = {
  points: {
    label: string;
    color: ThemeColor;
  }[];
};

const DateForecastCardTooltip: FC<Props> = ({ points }) => {
  const { getThemeColor } = useAppTheme();
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {points.map((point) => (
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
