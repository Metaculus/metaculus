import { Button } from "@headlessui/react";
import classNames from "classnames";
import Link from "next/link";
import { FC, ReactNode } from "react";

type Props = {
  text: string;
  emoji: string | ReactNode;
  isActive: boolean;
  onClick?: () => void;
  href?: string;
};

const TopicItem: FC<Props> = ({ isActive, onClick, text, emoji, href }) => {
  return (
    <Button
      as={href ? Link : undefined}
      href={href!}
      className={classNames(
        "w-auto cursor-pointer snap-start rounded-full p-1.5 px-2 text-sm leading-4 sm:w-full sm:p-2 sm:px-2.5 sm:text-base sm:leading-5",
        isActive
          ? "bg-metac-blue-800 text-metac-gray-0 hover:bg-metac-blue-800  dark:bg-metac-blue-800-dark dark:text-metac-gray-200-dark dark:hover:bg-metac-blue-800-dark"
          : "text-metac-blue-800 hover:bg-metac-blue-400 dark:text-metac-blue-200 dark:hover:bg-metac-blue-600"
      )}
      type="button"
      onClick={onClick}
    >
      <div className="flex items-center justify-start gap-1 sm:gap-2">
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
