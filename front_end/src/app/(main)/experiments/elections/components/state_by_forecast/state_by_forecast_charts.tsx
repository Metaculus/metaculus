"use client";
import { FC, useState } from "react";

import { StateByForecastItem } from "@/types/experiments";

import ElectionsBarGraph from "./elections_bar_graph";
import ElectionsMap from "./elections_map";

type Props = {
  items: StateByForecastItem[];
};

const StateByForecastCharts: FC<Props> = ({ items }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <>
      <ElectionsBarGraph
        items={items}
        hoveredId={hoveredId}
        onHover={setHoveredId}
      />
      <div className="relative mt-4 flex flex-col items-center gap-10 md:mt-10">
        <ElectionsMap
          mapAreas={items}
          hoveredId={hoveredId}
          onHover={setHoveredId}
        />
      </div>
    </>
  );
};

export default StateByForecastCharts;
