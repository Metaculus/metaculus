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
};

const TournamentCarousel = ({ tournaments, className }: Props) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    watchDrag: false,
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
              className="flex-[0_0_100%] pl-6 xs:flex-[0_0_50%] md:flex-[0_0_33.33%] xl:hidden"
            >
              <TournamentCard tournament={tournament} className="h-full" />
            </div>
          ))}
        </div>
      </div>
      {/* Desktop carousel */}
      <div className="hidden gap-6 xl:flex">
        {tournaments.map((tournament) => (
          <div key={tournament.id} className="flex-1">
            <TournamentCard key={tournament.id} tournament={tournament} />
          </div>
        ))}
      </div>
      {/* Carousel controls */}
      <div className="xl:hidden">
        <Button
          className="absolute -left-6 top-1/2 h-auto -translate-y-1/2"
          variant="text"
          presentationType="icon"
          onClick={() => emblaApi?.scrollPrev()}
        >
          <FontAwesomeIcon
            icon={faChevronLeft}
            className="h-11 w-5 text-gray-0"
          />
        </Button>
        <Button
          className="absolute -right-6 top-1/2 h-auto -translate-y-1/2"
          variant="text"
          presentationType="icon"
          onClick={() => emblaApi?.scrollNext()}
        >
          <FontAwesomeIcon
            icon={faChevronRight}
            className="h-11 w-5 text-gray-0"
          />
        </Button>
      </div>
    </div>
  );
};

export default TournamentCarousel;
