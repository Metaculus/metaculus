import React from "react";

import { TournamentPreview } from "@/types/projects";

import TournamentsContainer from "./tournaments_container";
import TournamentsHeader from "./tournaments_header";
import TournamentsHero from "./tournaments_hero";
import TournamentsMobileCtrl from "./tournaments_mobile_ctrl";
import { TournamentsSectionProvider } from "./tournaments_provider";
import { TournamentsSection } from "../types";

type Props = {
  current: TournamentsSection;
  tournaments: TournamentPreview[];
  children: React.ReactNode;
  nowTs?: number;
};

const TournamentsScreen: React.FC<Props> = ({
  current,
  tournaments,
  children,
  nowTs,
}) => {
  return (
    <TournamentsContainer>
      <TournamentsSectionProvider
        nowTs={nowTs}
        tournaments={tournaments}
        current={current}
      >
        <TournamentsHeader />
        <div className="mt-8">
          <TournamentsHero />
          <TournamentsMobileCtrl />
          <div className="mt-8 lg:mt-[50px]">{children}</div>
        </div>
      </TournamentsSectionProvider>
    </TournamentsContainer>
  );
};

export default TournamentsScreen;
