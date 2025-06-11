import { useTranslations } from "next-intl";
import { FC } from "react";

import { Tournament } from "@/types/projects";
import cn from "@/utils/core/cn";

import TournamentCard from "../../components/tournament_card";
import TournamentCarousel from "../../components/tournament_carousel";

type Props = {
  tournaments: Tournament[];
  className?: string;
};

const OtherTournaments: FC<Props> = ({ tournaments, className }) => {
  const t = useTranslations();

  return (
    <div className={cn("hidden flex-col items-center sm:flex", className)}>
      <p className="m-0 mb-12 mt-16 text-3xl font-bold tracking-tight text-blue-700 dark:text-blue-700-dark lg:mt-[120px]">
        {t("otherTournaments")}
      </p>
      {/* Default div for small screens */}
      <div className="hidden items-center gap-[42px] sm:flex md:hidden">
        {tournaments.slice(0, 2).map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </div>
      <TournamentCarousel
        tournaments={tournaments}
        className="hidden md:block"
        arrowsClassName="text-blue-800/30 dark:text-blue-800-dark/30"
        buttonPosition="loose"
      />
    </div>
  );
};

export default OtherTournaments;
