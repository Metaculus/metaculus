"use client";

import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, useState } from "react";

import cn from "@/utils/core/cn";
import { sanitizeHtmlContent } from "@/utils/markdown";

import { cancelBulletin } from "../actions";

const Bulletin: FC<{
  text: string | React.ReactNode;
  id?: number;
  className?: string;
  onHidden?: () => void;
}> = ({ text, id, className, onHidden }) => {
  const [hidden, setHidden] = useState(false);

  if (hidden) {
    return null;
  }

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
        onClick={async () => {
          if (id) {
            await cancelBulletin(id);
          }
          setHidden(true);
          onHidden?.();
        }}
      />
      {typeof text === "string" ? (
        <div
          dangerouslySetInnerHTML={{
            __html: sanitizeHtmlContent(text),
          }}
          suppressHydrationWarning
        />
      ) : (
        text
      )}
    </div>
  );
};

export default Bulletin;
