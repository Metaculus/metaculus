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
    <div className="mb-6  flex min-w-0 flex-1 items-center gap-2 overflow-hidden overflow-x-auto border-b border-gray-300 bg-gray-200 px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] dark:border-gray-200-dark dark:bg-gray-200-dark lg:px-20 [&::-webkit-scrollbar]:hidden">
      <h2 className="m-0 shrink-0 pr-4 text-xs font-medium uppercase leading-3 text-gray-700 dark:text-gray-700-dark">
        {t("staffPicks")}
      </h2>
      {items.map((item, idx) => (
        <Link
          key={`staff-pick-${idx}`}
          href={item.url}
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full border-0 bg-gray-300 py-2 pl-3 pr-4 text-xs font-medium leading-3 text-gray-700 no-underline transition-colors hover:bg-gray-400 dark:bg-gray-300-dark dark:text-gray-700-dark dark:hover:bg-gray-400-dark"
          )}
        >
          <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
            {typeof item.emoji === "string" ? (
              <span className="text-xs">{item.emoji}</span>
            ) : (
              item.emoji
            )}
          </span>
          <span className="whitespace-nowrap">{item.name}</span>
        </Link>
      ))}
    </div>
  );
};

export default StaffPicks;
