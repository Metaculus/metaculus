"use client";
import { FC, useState } from "react";

import { StateByForecastItem } from "@/types/experiments";

import ElectionsBarGraph from "./elections_bar_graph";
import ElectionsMap from "./elections_map";

type Props = {
  items: StateByForecastItem[];
  interactive?: boolean;
};

const StateByForecastCharts: FC<Props> = ({ items, interactive }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <>
      <ElectionsBarGraph
        items={items}
        hoveredId={hoveredId}
        onHover={setHoveredId}
        interactive={interactive}
      />
      <div className="mt-4 md:mt-10">
        <ElectionsMap
          mapAreas={items}
          hoveredId={hoveredId}
          onHover={setHoveredId}
          interactive={interactive}
        />
      </div>
    </>
  );
};

export default StateByForecastCharts;
