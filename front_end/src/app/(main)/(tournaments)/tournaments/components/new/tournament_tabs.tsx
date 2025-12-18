import React from "react";

import TournamentsTabsShell from "./tournaments-tabs-shell";
import { Section, TournamentsSection } from "../../types";

type Props = { current: TournamentsSection };

const TournamentsTabs: React.FC<Props> = ({ current }) => {
  const sections: Section[] = [
    {
      value: "live",
      href: "/tournaments",
      label: "Live Tournaments",
    },
    {
      value: "series",
      href: "/tournaments/question-series",
      label: "Question Series",
    },
    {
      value: "indexes",
      href: "/tournaments/indexes",
      label: "Indexes",
    },
    {
      value: "archived",
      href: "/tournaments/archived",
      label: "Archived",
    },
  ];

  return <TournamentsTabsShell current={current} sections={sections} />;
};

export default TournamentsTabs;
