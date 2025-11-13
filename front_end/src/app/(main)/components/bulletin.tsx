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
}> = ({ text, id, className }) => {
  const [hidden, setHidden] = useState(false);

  return (
    <div
      className={cn(
        "mt-3 flex w-full max-w-5xl flex-col gap-3 px-3 sm:w-2/3 sm:px-0 md:mt-8",
        {
          hidden: hidden,
        },
        className
      )}
    >
      <div className="relative flex flex-col items-start rounded border border-solid border-blue-700/50 bg-blue-400/75 p-4 pr-8 text-blue-800 dark:border-blue-700/75 dark:bg-blue-800 dark:text-blue-200">
        <FontAwesomeIcon
          className="absolute right-3 top-3 inline cursor-pointer text-xl text-blue-600 hover:text-blue-800 dark:text-blue-600 dark:hover:text-blue-400"
          icon={faClose}
          onClick={async () => {
            if (id) {
              await cancelBulletin(id);
            }
            setHidden(true);
          }}
        />
        <div>
          {typeof text === "string"
            ? text.split("\n").map((line, lineIdx) => (
                <div
                  className="my-3"
                  key={lineIdx}
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtmlContent(line),
                  }}
                  suppressHydrationWarning
                />
              ))
            : text}
        </div>
      </div>
    </div>
  );
};

export default Bulletin;
