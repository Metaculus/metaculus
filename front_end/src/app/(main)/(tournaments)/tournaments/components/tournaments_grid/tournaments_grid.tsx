"use client";

import React from "react";

import { TournamentPreview } from "@/types/projects";
import cn from "@/utils/core/cn";

type Props = {
  items: TournamentPreview[];
  renderItem?: (item: TournamentPreview) => React.ReactNode;
  className?: string;
};

const TournamentsGrid: React.FC<Props> = ({ items, renderItem, className }) => {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {items.map((item) =>
        renderItem ? (
          renderItem(item)
        ) : (
          <div key={item.id} className="h-[100px] bg-red-500" />
        )
      )}
    </div>
  );
};

export default TournamentsGrid;
