"use client";

import React from "react";

import { TournamentPreview } from "@/types/projects";

type Props = { items: TournamentPreview[] };

const TournamentsGrid: React.FC<Props> = ({ items }) => {
  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <div key={item.id} className="h-10 bg-red-500"></div>
      ))}
    </div>
  );
};

export default TournamentsGrid;
