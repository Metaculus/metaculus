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
        "flex flex-1 flex-col items-center gap-2 rounded-[12px] bg-opacity-10 px-6 py-4 antialiased dark:bg-opacity-10 sm:p-6",
        t.bgClass,
        t.textClass
      )}
    >
      <p className="m-0 text-[28px] font-bold leading-[116%] tracking-wider sm:text-4xl sm:leading-[40px]">
        {value}
      </p>
      <div className="flex flex-col items-center text-base font-normal tracking-wide sm:text-lg">
        <p className="m-0 text-center">{label}</p>
        <p className="m-0">{subLabel}</p>
      </div>
    </div>
  );
};

export default AIBBenchmarkStatsCard;
