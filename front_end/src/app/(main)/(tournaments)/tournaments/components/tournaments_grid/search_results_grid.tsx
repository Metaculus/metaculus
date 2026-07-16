"use client";

import React from "react";

import { TournamentType } from "@/types/projects";

import IndexTournamentCard from "./index_tournament_card";
import LiveTournamentCard from "./live_tournament_card";
import QuestionSeriesCard from "./question_series_card";
import TournamentsGrid from "./tournaments_grid";
import { useTournamentsSection } from "../tournaments_provider";

const SearchResultsGrid: React.FC = () => {
  const { items, nowTs } = useTournamentsSection();

  return (
    <TournamentsGrid
      items={items}
      renderItem={(item) => {
        if (item.type === TournamentType.Index) {
          return (
            <IndexTournamentCard key={item.id} item={item} showTypeLabel />
          );
        }

        if (item.type === TournamentType.QuestionSeries) {
          return <QuestionSeriesCard key={item.id} item={item} showTypeLabel />;
        }

        return <LiveTournamentCard key={item.id} item={item} nowTs={nowTs} />;
      }}
    />
  );
};

export default SearchResultsGrid;
