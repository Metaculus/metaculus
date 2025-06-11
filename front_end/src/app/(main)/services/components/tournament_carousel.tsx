"use client";

import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useEmblaCarousel from "embla-carousel-react";

import Button from "@/components/ui/button";
import { Tournament } from "@/types/projects";
import cn from "@/utils/core/cn";

import TournamentCard from "./tournament_card";

type Props = {
  tournaments: Tournament[];
  className?: string;
  arrowsClassName?: string;
  buttonPosition?: "tight" | "loose";
};

const TournamentCarousel = ({
  tournaments,
  className,
  arrowsClassName,
  buttonPosition = "tight",
}: Props) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    watchDrag: true,
  });
  // Duplicate tournaments to allow for infinite scrolling
  const duplicatedTournaments = [...tournaments, ...tournaments];
  return (
    <div className={cn("relative w-full", className)}>
      <div ref={emblaRef} className="overflow-hidden">
        <div className="-ml-6 flex">
          {duplicatedTournaments.map((tournament, index) => (
            <div
              key={tournament.id + index}
              className="flex-[0_0_100%] pl-6 xs:flex-[0_0_50%] md:flex-[0_0_33.33%] xl:flex-[0_0_25%]"
            >
              <TournamentCard tournament={tournament} className="h-full" />
            </div>
          ))}
        </div>
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

export default TournamentCarousel;
