"use client";

import { faNewspaper } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import cn from "@/utils/core/cn";

type Props = {
  count: number;
  isActive?: boolean;
  onClick: () => void;
};

const NewsAnnotationMarker: FC<Props> = ({
  count,
  isActive = false,
  onClick,
}) => {
  return (
    <button
      className={cn(
        "flex size-[18px] items-center justify-center rounded-full border text-[10px] leading-none transition-colors",
        isActive
          ? "border-blue-800 bg-blue-800 text-gray-0 dark:border-blue-800-dark dark:bg-blue-800-dark dark:text-gray-0-dark"
          : "border-blue-700 bg-gray-0 text-blue-700 hover:bg-blue-200 dark:border-blue-700-dark dark:bg-gray-0-dark dark:text-blue-700-dark dark:hover:bg-blue-200-dark"
      )}
      onClick={onClick}
    >
      {count > 1 ? (
        <span className="font-bold">{count}</span>
      ) : (
        <FontAwesomeIcon icon={faNewspaper} className="text-[10px]" />
      )}
    </button>
  );
};

export default NewsAnnotationMarker;
