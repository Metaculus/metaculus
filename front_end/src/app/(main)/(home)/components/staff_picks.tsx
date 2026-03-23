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
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] md:py-5 [&::-webkit-scrollbar]:hidden">
      <h2 className="m-0 shrink-0 pr-2 text-xs font-bold uppercase leading-3 text-blue-700">
        {t("staffPicks")}
      </h2>
      {items.map((item, idx) => (
        <Link
          key={`staff-pick-${idx}`}
          href={item.url}
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full border-0 bg-gray-0 py-2 pl-3 pr-4 text-xs md:text-sm font-medium leading-3 text-blue-700 no-underline transition-colors hover:bg-blue-400"
          )}
        >
          <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
            {typeof item.emoji === "string" ? (
              <span className="text-xs">{item.emoji}</span>
            ) : (
              item.emoji
            )}
          </span>
          <span className="whitespace-nowrap text-blue-800">{item.name}</span>
        </Link>
      ))}
    </div>
  );
};

export default StaffPicks;
