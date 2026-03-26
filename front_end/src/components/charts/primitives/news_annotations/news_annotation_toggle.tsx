"use client";

import { faNewspaper } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import cn from "@/utils/core/cn";

type Props = {
  enabled: boolean;
  onToggle: () => void;
};

const NewsAnnotationToggle: FC<Props> = ({ enabled, onToggle }) => {
  return (
    <button
      className={cn(
        "relative flex size-[18px] items-center justify-center rounded-full border text-[10px] transition-colors",
        enabled
          ? "border-blue-700 bg-gray-0 text-blue-700 dark:border-blue-700-dark dark:bg-gray-0-dark dark:text-blue-700-dark"
          : "border-gray-400 bg-gray-300 text-gray-600 dark:border-gray-400-dark dark:bg-gray-300-dark dark:text-gray-600-dark"
      )}
      onClick={onToggle}
      aria-label="Toggle news annotations"
    >
      <FontAwesomeIcon icon={faNewspaper} className="text-[10px]" />
      {!enabled && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-[1px] w-[14px] rotate-[-45deg] bg-gray-600 dark:bg-gray-600-dark" />
        </div>
      )}
    </button>
  );
};

export default NewsAnnotationToggle;
