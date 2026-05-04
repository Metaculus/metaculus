import { Button } from "@headlessui/react";
import Link from "next/link";
import { FC, ReactNode } from "react";

import cn from "@/utils/core/cn";

type Props = {
  text: string;
  emoji: string | ReactNode;
  isActive: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
  variant?: "responsive" | "sidebar";
};

const TopicItem: FC<Props> = ({
  isActive,
  onClick,
  text,
  emoji,
  href,
  className,
  variant = "responsive",
}) => {
  return (
    <Button
      as={href ? Link : undefined}
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      href={href!}
      className={cn(
        "cursor-pointer snap-start no-underline",
        variant === "sidebar"
          ? "w-full rounded-full p-2 px-2.5 text-base leading-5"
          : "w-auto rounded-full p-1.5 px-2 text-sm leading-4 sm:w-full sm:p-2 sm:px-2.5 sm:text-base sm:leading-5",
        isActive
          ? "bg-blue-800 text-gray-0 hover:bg-blue-800  dark:bg-blue-800-dark dark:text-gray-200-dark dark:hover:bg-blue-800-dark"
          : "text-blue-800 hover:bg-blue-200 dark:text-blue-200 dark:hover:bg-blue-200-dark",
        className
      )}
      type="button"
      onClick={onClick}
    >
      <div
        className={cn(
          "flex items-center justify-start",
          variant === "sidebar" ? "gap-2" : "gap-1 sm:gap-2"
        )}
      >
        <div className="inline-flex flex-row items-center justify-center text-sm leading-4 tracking-widest">
          {emoji}
        </div>
        <div className="shrink grow basis-0 truncate text-left font-sans font-normal">
          {text}
        </div>
      </div>
    </Button>
  );
};

export default TopicItem;
