import { useTranslations } from "next-intl";
import { FC } from "react";

import { TournamentPreview } from "@/types/projects";
import cn from "@/utils/core/cn";

import EmblaCarousel from "../../components/embla_carousel";
import TournamentCard from "../../components/tournament_card";

type Props = {
  tournaments: TournamentPreview[];
  className?: string;
};

const OtherTournaments: FC<Props> = ({ tournaments, className }) => {
  const t = useTranslations();
  // Duplicate tournaments to allow for infinite scrolling
  const duplicatedTournaments = [...tournaments, ...tournaments];
  return (
    <div className={cn("flex flex-col items-center px-4", className)}>
      <p className="m-0 mb-12 mt-16 text-3xl font-bold tracking-tight text-blue-700 dark:text-blue-700-dark lg:mt-[120px]">
        {t("otherTournaments")}
      </p>
      <EmblaCarousel
        arrowsClassName="text-blue-800/30 dark:text-blue-800-dark/30"
        buttonPosition="loose"
      >
        <div className="-ml-6 flex">
          {duplicatedTournaments.map((tournament, index) => (
            <div
              key={index}
              className="flex-[0_0_100%] pl-6 xs:flex-[0_0_50%] md:flex-[0_0_33.33%] xl:flex-[0_0_25%]"
            >
              <TournamentCard tournament={tournament} className="h-full" />
            </div>
          ))}
        </div>
      </EmblaCarousel>
    </div>
  );
};

export default OtherTournaments;
