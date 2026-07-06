"use client";

import React from "react";

import TournamentsGrid from "./tournaments_grid";
import { useTournamentsSection } from "../tournaments_provider";
import QuestionSeriesCard from "./question_series_card";

const SeriesTournamentsGrid: React.FC = () => {
  const { items } = useTournamentsSection();

  return (
    <TournamentsGrid
      items={items}
      renderItem={(item) => <QuestionSeriesCard key={item.id} item={item} />}
    />
  );
};

export default SeriesTournamentsGrid;
