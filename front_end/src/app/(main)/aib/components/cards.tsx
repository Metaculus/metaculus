import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

function Dates() {
  const t = useTranslations();

  return (
    <Card
      className="rounded-md bg-blue-500/50 py-4 text-blue-800 hover:cursor-default dark:bg-blue-500-dark/50 dark:text-blue-800-dark "
      heading1={t("FABStartDate")}
      heading2={t("FABStartDateJan5")}
    />
  );
}

function Prize() {
  const t = useTranslations();
  return (
    <Card
      className="rounded-md border-olive-700 bg-olive-500/50 text-olive-800 dark:bg-olive-500/30 dark:text-olive-900-dark"
      heading1={t("FABPrizePool")}
      heading2={t("FABPrizeValue58k")}
    />
  );
}

const Card: FC<{ className: string; heading1: string; heading2: string }> = ({
  className,
  heading1,
  heading2,
}) => {
  return (
    <div
      className={cn(
        "flex size-full min-h-[90px] grow flex-row items-center justify-center lg:h-auto lg:min-h-[180px]",
        className
      )}
    >
      <div className="relative z-20 flex size-full select-none flex-col items-center justify-center gap-1 rounded md:gap-2 lg:gap-3">
        <div className="text-lg opacity-60 md:text-lg lg:text-xl min-[1920px]:text-2xl">
          {heading1}
        </div>
        <div
          className={cn(
            heading2 === "Coming Soon"
              ? "text-xl md:text-3xl lg:text-4xl min-[1920px]:text-5xl"
              : "text-2xl md:text-4xl lg:text-6xl min-[1920px]:text-7xl"
          )}
        >
          {heading2}
        </div>
      </div>
    </div>
  );
};

export { Dates, Prize };
