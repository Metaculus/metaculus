import { FC, useEffect, useState } from "react";

import Tooltip from "@/components/ui/tooltip";
import useContainerSize from "@/hooks/use_container_size";
import cn from "@/utils/core/cn";

type Props = {
  text: string;
  className?: string;
  tooltipClassName?: string;
  showDelayMs?: number;
  placement?: "top" | "bottom" | "left" | "right";
  showTooltip?: boolean;
};

const TruncatedTextTooltip: FC<Props> = ({
  text,
  className,
  tooltipClassName,
  showDelayMs = 200,
  placement = "bottom",
  showTooltip = true,
}) => {
  const { ref, width } = useContainerSize<HTMLSpanElement>();
  const [isTextTruncated, setIsTextTruncated] = useState(false);

  useEffect(() => {
    if (ref.current) {
      const element = ref.current;
      const elementStyle = getComputedStyle(element);
      if (isStyledWithEllipsis(elementStyle)) {
        setIsTextTruncated(isOverflowX(element));
      }
      if (isStyledWithClamp(elementStyle)) {
        setIsTextTruncated(isOverflowY(element));
      }
    }
  }, [width, ref]);

  return (
    <Tooltip
      tooltipContent={text}
      showDelayMs={showDelayMs}
      placement={placement}
      tooltipClassName={cn(tooltipClassName, {
        hidden: !isTextTruncated || !showTooltip,
      })}
    >
      <span
        ref={ref}
        className={cn("overflow-hidden", className)}
        onTouchStart={(e) => {
          if (isTextTruncated) {
            const mouseEnterEvent = new MouseEvent("mouseenter", {
              bubbles: true,
              cancelable: true,
            });
            e.currentTarget.dispatchEvent(mouseEnterEvent);
          }
        }}
      >
        {text}
      </span>
    </Tooltip>
  );
};

const isStyledWithEllipsis = (style: CSSStyleDeclaration) =>
  style.overflowX === "hidden" &&
  style.textOverflow === "ellipsis" &&
  style.whiteSpace === "nowrap";

const isStyledWithClamp = (style: CSSStyleDeclaration) => {
  const lineClamp = style.getPropertyValue("-webkit-line-clamp");
  return lineClamp !== "" && parseInt(lineClamp, 10) > 0;
};

const isOverflowX = (element: HTMLSpanElement) =>
  element.offsetWidth < element.scrollWidth;

const isOverflowY = (element: HTMLSpanElement) =>
  element.offsetHeight < element.scrollHeight;

export default TruncatedTextTooltip;
