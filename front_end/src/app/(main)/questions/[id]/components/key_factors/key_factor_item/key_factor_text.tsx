import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import useScrollTo from "@/hooks/use_scroll_to";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";

type Props = {
  text: string;
  linkAnchor?: string;
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
      <div className="relative inline xs:ml-0">{text}</div>
      {linkAnchor && (
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
            sendAnalyticsEvent("KeyFactorClick", {
              event_label: linkToComment ? "fromList" : "fromComment",
            });
          }}
          className="target visible ml-1 inline-flex items-center overflow-visible rounded-full p-2 text-blue-600 hover:bg-blue-400 hover:font-bold hover:text-blue-700 can-hover:invisible dark:text-blue-600 dark:hover:bg-blue-400-dark"
        >
          <FontAwesomeIcon
            icon={faArrowUpRightFromSquare}
            className={cn(
              "size-3 scale-110",
              linkToComment && "rotate-180 scale-x-[-1]"
            )}
          />
        </a>
      )}
    </div>
  );
};

export default KeyFactorText;
