"use client";

import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import cn from "@/utils/core/cn";
import { sanitizeHtmlContent } from "@/utils/markdown";

const Bulletin: FC<{
  text: string;
  className?: string;
  onHidden?: () => void;
}> = ({ text, className, onHidden }) => {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center bg-mint-500 px-8 py-2 text-xs text-gray-900 md:text-sm",
        className
      )}
    >
      <FontAwesomeIcon
        className="absolute right-3 top-2 inline cursor-pointer hover:text-gray-700"
        icon={faClose}
        onClick={() => {
          onHidden?.();
        }}
      />
      <div
        dangerouslySetInnerHTML={{
          __html: sanitizeHtmlContent(text),
        }}
        suppressHydrationWarning
      />
    </div>
  );
};

export default Bulletin;
