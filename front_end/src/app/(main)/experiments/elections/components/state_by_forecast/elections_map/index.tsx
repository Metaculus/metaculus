"use client";
import { FC } from "react";

import { StateByForecastItem, MapType } from "@/types/experiments";
import { getColorInSpectrum } from "@/utils/colors";

import StateHoverCard from "./state_hover_card";
import ExperimentMap from "../../../../components/experiment_map";

type Props = {
  mapAreas: StateByForecastItem[];
};

const ElectionsMap: FC<Props> = ({ mapAreas }) => {
  return (
    <ExperimentMap
      mapAreas={mapAreas}
      mapType={MapType.US}
      getMapAreaColor={getMapAreaColor}
      renderHoverPopover={(props) => <StateHoverCard {...props} />}
    />
  );
};

const getMapAreaColor = (mapArea: StateByForecastItem) => {
  return getColorInSpectrum(
    [0xe0, 0x16, 0x2b], // "#E0162B",
    [0xe0, 0xe0, 0xe1], // "#E0E0E1",
    [0x00, 0x52, 0xa5], // "#0052A5"
    mapArea.democratProbability
  );
};

export default ElectionsMap;
