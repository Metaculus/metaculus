"use client";

import { faNewspaper } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import cn from "@/utils/core/cn";

type Props = {
  count: number;
  isActive?: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
};

const NewsAnnotationMarker: FC<Props> = ({
  count,
  isActive = false,
  onHoverStart,
  onHoverEnd,
}) => {
  return (
    <div
      className="flex items-center justify-center rounded-full p-1"
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      <div
        className={cn(
          "flex size-[18px] items-center justify-center rounded-full border text-[10px] leading-none transition-colors",
          isActive
            ? "border-blue-800 bg-blue-800 text-gray-0 dark:border-blue-800-dark dark:bg-blue-800-dark dark:text-gray-0-dark"
            : "border-blue-700 bg-gray-0 text-blue-700 dark:border-blue-700-dark dark:bg-gray-0-dark dark:text-blue-700-dark"
        )}
      >
        {count > 1 ? (
          <span className="font-bold">{count}</span>
        ) : (
          <FontAwesomeIcon icon={faNewspaper} className="text-[10px]" />
        )}
      </div>
    </div>
  );
};

export default NewsAnnotationMarker;
