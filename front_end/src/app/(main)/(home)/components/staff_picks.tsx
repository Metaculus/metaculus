import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, ReactNode } from "react";

import cn from "@/utils/core/cn";

type StaffPickItem = {
  name: string;
  emoji: string | ReactNode;
  url: string;
};

type Props = {
  items: StaffPickItem[];
};

const StaffPicks: FC<Props> = ({ items }) => {
  const t = useTranslations();
  return (
    <div className="mb-4 flex  min-w-0 flex-1 items-center gap-2 overflow-hidden overflow-x-auto border-b border-blue-400/50 bg-blue-200 px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] dark:border-blue-400-dark/50 dark:bg-blue-200-dark md:mb-6 lg:px-20 [&::-webkit-scrollbar]:hidden">
      <h2 className="m-0 shrink-0 pr-4 text-xs font-medium uppercase leading-3 text-blue-700 dark:text-blue-700-dark">
        {t("staffPicks")}
      </h2>
      {items.map((item, idx) => (
        <Link
          key={`staff-pick-${idx}`}
          href={item.url}
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full border-0 bg-blue-400 py-2 pl-3 pr-4 text-xs font-medium leading-3 text-blue-700 no-underline transition-colors hover:bg-blue-500 dark:bg-blue-400-dark dark:text-blue-700-dark dark:hover:bg-blue-500-dark"
          )}
        >
          <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
            {typeof item.emoji === "string" ? (
              <span className="text-xs">{item.emoji}</span>
            ) : (
              item.emoji
            )}
          </span>
          <span className="whitespace-nowrap text-blue-800 dark:text-blue-800-dark">
            {item.name}
          </span>
        </Link>
      ))}
    </div>
  );
};

export default StaffPicks;
