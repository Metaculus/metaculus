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
      const temp = ref.current.cloneNode(true) as HTMLElement;
      temp.style.position = "fixed";
      temp.style.overflow = "scroll";
      temp.style.visibility = "hidden";
      temp.style.width = width.toString() + "px";
      ref.current.parentElement?.appendChild(temp);
      const scrollHeight = temp.scrollHeight;
      const displayHeight = ref.current.clientHeight;

      setIsTextTruncated(scrollHeight > displayHeight);
      ref.current.parentElement?.removeChild(temp);
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

export default TruncatedTextTooltip;
