import cn from "@/utils/core/cn";

import { AIB_THEME, AIBTheme } from "./config";

type Props = {
  value: string;
  label: string;
  subLabel?: string;
  theme?: AIBTheme;
};

const AIBBenchmarkStatsCard: React.FC<Props> = ({
  value,
  label,
  subLabel,
  theme = "red",
}) => {
  const t = AIB_THEME[theme];

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center gap-2 rounded-[12px] bg-opacity-10 p-6 antialiased dark:bg-opacity-10",
        t.bgClass,
        t.textClass
      )}
    >
      <p className="m-0 text-4xl font-bold leading-[40px] tracking-wider">
        {value}
      </p>
      <div className="flex flex-col items-center text-lg font-normal tracking-wide">
        <p className="m-0">{label}</p>
        <p className="m-0">{subLabel}</p>
      </div>
    </div>
  );
};

export default AIBBenchmarkStatsCard;
