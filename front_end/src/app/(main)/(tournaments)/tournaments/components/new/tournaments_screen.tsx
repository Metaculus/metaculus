import React from "react";

import { TournamentPreview } from "@/types/projects";

import TournamentsContainer from "./tournaments_container";
import TournamentsHeader from "./tournaments_header";
import { TournamentsSectionProvider } from "./tournaments_provider";
import { TournamentsSection } from "../../types";

type Props = {
  current: TournamentsSection;
  tournaments: TournamentPreview[];
  children: React.ReactNode;
};

const TournamentsScreen: React.FC<Props> = ({
  current,
  tournaments,
  children,
}) => {
  return (
    <TournamentsContainer>
      <TournamentsSectionProvider tournaments={tournaments} current={current}>
        <TournamentsHeader />
        <div className="mt-10">{children}</div>
      </TournamentsSectionProvider>
    </TournamentsContainer>
  );
};

export default TournamentsScreen;
