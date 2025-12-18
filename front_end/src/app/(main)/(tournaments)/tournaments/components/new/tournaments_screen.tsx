import React from "react";

import TournamentsContainer from "./tournaments_container";
import TournamentsHeader from "./tournaments_header";
import { TournamentsSection } from "../../types";
type Props = {
  current: TournamentsSection;
  children: React.ReactNode;
};

const TournamentsScreen: React.FC<Props> = ({ current, children }) => {
  return (
    <TournamentsContainer>
      <TournamentsHeader current={current} />
      <div className="mt-10">{children}</div>
    </TournamentsContainer>
  );
};

export default TournamentsScreen;
