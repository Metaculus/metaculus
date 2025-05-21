"use client";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

const CollapsibleBox: FC<
  PropsWithChildren<{
    title: string;
    expanded: boolean;
    onToggleExpanded(expanded: boolean): void;
  }>
> = ({ title, children, expanded, onToggleExpanded }) => {
  return (
    <div className="rounded border border-purple-500 bg-purple-100 text-gray-900 dark:border-purple-500-dark dark:bg-purple-100-dark dark:text-gray-900-dark">
      <button
        onClick={() => onToggleExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4"
      >
        <div className="text-base font-semibold">{title}</div>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={cn("ml-0.5 mr-1.5 transition-transform duration-300", {
            "rotate-180": expanded,
          })}
        />
      </button>
      {expanded && (
        <div className="px-4 pb-4 text-base leading-5">{children}</div>
      )}
    </div>
  );
};

export default CollapsibleBox;
