"use client";
import { FC, useMemo } from "react";

import { ByStateExperimentBar, StateByForecastItem } from "@/types/experiments";
import { getColorInSpectrum } from "@/utils/core/colors";

import StateBarHoverPopup from "./state_bar_hover_popup";
import ExperimentBarGraph from "../../../../components/experiment_bar_graph";

type Props = {
  items: StateByForecastItem[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  interactive?: boolean;
};

const ElectionsBarGraph: FC<Props> = ({
  items,
  hoveredId,
  onHover,
  interactive,
}) => {
  const totalValue = useMemo(
    () => items.reduce((acc, item) => acc + item.votes, 0),
    [items]
  );
  const bars = useMemo<ByStateExperimentBar[]>(
    () =>
      items
        .map((item) => ({
          id: item.abbreviation,
          name: item.name,
          value: item.votes,
          abbreviation: item.abbreviation,
          democratProbability: item.democratProbability,
          hasQuestion: !!item.link,
        }))
        .sort((a, b) => b.democratProbability - a.democratProbability),
    [items]
  );

  return (
    <ExperimentBarGraph
      bars={bars}
      totalValue={totalValue}
      getBarColor={getBarColor}
      externalHoveredId={hoveredId}
      onHover={onHover}
      renderHoverPopover={(bar) => <StateBarHoverPopup bar={bar} />}
      interactive={interactive}
    />
  );
};

const getBarColor = (bar: ByStateExperimentBar) => {
  return getColorInSpectrum(
    [0xe0, 0x16, 0x2b], // "#E0162B",
    [0xe0, 0xe0, 0xe1], // "#E0E0E1",
    [0x00, 0x52, 0xa5], // "#0052A5"
    bar.democratProbability
  );
};

export default ElectionsBarGraph;
