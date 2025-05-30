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
}>;

const EmblaCarousel: FC<Props> = ({
  className,
  arrowsClassName,
  buttonPosition = "tight",
  children,
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    watchDrag: true,
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
            "absolute top-1/2 h-auto -translate-y-1/2",
            {
              tight: "-left-6 sm:-left-10",
              loose: "-left-6 sm:-left-6 lg:-left-10 xl:-left-14",
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
            "absolute top-1/2 h-auto -translate-y-1/2",
            {
              tight: "-right-6 sm:-right-10",
              loose: "-right-6 sm:-right-6 lg:-right-10 xl:-right-14",
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
