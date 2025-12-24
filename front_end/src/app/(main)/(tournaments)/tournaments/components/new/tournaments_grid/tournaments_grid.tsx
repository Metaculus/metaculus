"use client";

import React from "react";

import { TournamentPreview } from "@/types/projects";

type Props = {
  items: TournamentPreview[];
  renderItem?: (item: TournamentPreview) => React.ReactNode;
};

const TournamentsGrid: React.FC<Props> = ({ items, renderItem }) => {
  return (
    <div
      className="
        grid
        grid-cols-2
        gap-3 sm:gap-5
        lg:grid-cols-3
        xl:grid-cols-4
      "
    >
      {items.map((item) =>
        renderItem ? (
          renderItem(item)
        ) : (
          <div key={item.id} className="h-[100px] bg-red-500"></div>
        )
      )}
    </div>
  );
};

export default TournamentsGrid;
