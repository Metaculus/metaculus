"use client";

import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useEmblaCarousel from "embla-carousel-react";
import { FC, PropsWithChildren } from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

type Props = PropsWithChildren<{
  className?: string;
  arrowsClassName?: string;
  buttonPosition?: "tight" | "loose";
  config?: {
    loop?: boolean;
    align?: "start" | "center" | "end";
    watchDrag?: boolean;
  };
}>;

const EmblaCarousel: FC<Props> = ({
  className,
  arrowsClassName,
  buttonPosition = "tight",
  children,
  config,
}) => {
  const { loop = true, align = "start", watchDrag = true } = config ?? {};
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop,
    align,
    watchDrag,
  });

  return (
    <div className={cn("relative w-full", className)}>
      <div ref={emblaRef} className="overflow-hidden">
        {children}
      </div>
      {/* Carousel controls */}
      <div>
        <Button
          className={cn(
            "absolute top-1/2 h-auto w-auto -translate-y-1/2 p-3",
            {
              tight: "-left-9 sm:-left-11",
              loose: "-left-9 sm:-left-9 lg:-left-11 xl:-left-14",
            }[buttonPosition]
          )}
          variant="text"
          presentationType="icon"
          onClick={() => emblaApi?.scrollPrev()}
        >
          <FontAwesomeIcon
            icon={faChevronLeft}
            className={cn("h-11 w-5 text-gray-0/30", arrowsClassName)}
          />
        </Button>
        <Button
          className={cn(
            "absolute top-1/2 h-auto w-auto -translate-y-1/2 p-3",
            {
              tight: "-right-9 sm:-right-11",
              loose: "-right-9 sm:-right-9 lg:-right-11 xl:-right-14",
            }[buttonPosition]
          )}
          variant="text"
          presentationType="icon"
          onClick={() => emblaApi?.scrollNext()}
        >
          <FontAwesomeIcon
            icon={faChevronRight}
            className={cn("h-11 w-5 text-gray-0/30", arrowsClassName)}
          />
        </Button>
      </div>
    </div>
  );
};

export default EmblaCarousel;
