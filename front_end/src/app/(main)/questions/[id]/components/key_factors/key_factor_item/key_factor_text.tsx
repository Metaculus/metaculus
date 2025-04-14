import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { sendGAEvent } from "@next/third-parties/google";
import { FC } from "react";

import useScrollTo from "@/hooks/use_scroll_to";
import cn from "@/utils/cn";

type Props = {
  text: string;
  linkAnchor: string;
  linkToComment?: boolean;
  className?: string;
};

const KeyFactorText: FC<Props> = ({
  text,
  linkAnchor,
  linkToComment = true,
  className,
}) => {
  const scrollTo = useScrollTo();

  return (
    <div
      className={cn(
        "relative inline min-w-0 max-w-full flex-1 break-words text-center xs:text-left",
        className
      )}
    >
      <div className="relative ml-7 inline xs:ml-0">{text}</div>
      <a
        href={linkAnchor}
        onClick={(e) => {
          const target = document.getElementById(linkAnchor.replace("#", ""));
          if (target) {
            if (linkToComment) {
              e.preventDefault();
            }
            scrollTo(target.getBoundingClientRect().top);
          }
          sendGAEvent("event", "KeyFactorClick", {
            event_label: "fromList",
          });
        }}
        className="target invisible ml-1 inline-flex items-center overflow-visible rounded-full p-2 text-blue-600 hover:bg-blue-400 hover:text-blue-700 dark:text-blue-600 dark:hover:bg-blue-400-dark"
      >
        <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="size-3" />
      </a>
    </div>
  );
};

export default KeyFactorText;
