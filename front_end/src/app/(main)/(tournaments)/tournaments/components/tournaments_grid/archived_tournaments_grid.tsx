"use client";

import React from "react";

import { TournamentType } from "@/types/projects";

import { useTournamentsSection } from "../tournaments_provider";
import LiveTournamentCard from "./live_tournament_card";
import QuestionSeriesCard from "./question_series_card";
import TournamentsGrid from "./tournaments_grid";

const ArchivedTournamentsGrid: React.FC = () => {
  const { items, nowTs } = useTournamentsSection();

  return (
    <TournamentsGrid
      items={items}
      renderItem={(item) => {
        if (item.type === TournamentType.QuestionSeries) {
          return <QuestionSeriesCard key={item.id} item={item} />;
        }

        return <LiveTournamentCard key={item.id} item={item} nowTs={nowTs} />;
      }}
    />
  );
};

export default ArchivedTournamentsGrid;
