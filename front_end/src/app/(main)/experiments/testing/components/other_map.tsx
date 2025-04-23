"use client";
import { FC } from "react";

import { StateByForecastItem, MapType } from "@/types/experiments";
import { getColorInSpectrum } from "@/utils/core/colors";

import ExperimentMap from "../../components/experiment_map";

const OTHER_MAP_AREAS: StateByForecastItem[] = [
  {
    name: "Alabama",
    abbreviation: "Alabama",
    votes: 9,
    democratProbability: 0.1,
    x_adjust: 0,
    y_adjust: 0,
  },
  {
    name: "Alaska",
    abbreviation: "Alaska",
    votes: 3,
    democratProbability: 0.2,
    x_adjust: 0,
    y_adjust: 0,
  },
  {
    name: "Montana",
    abbreviation: "Montana",
    votes: 4,
    democratProbability: 0.2,
    x_adjust: 0,
    y_adjust: 0,
  },
  {
    name: "California",
    abbreviation: "California",
    votes: 54,
    democratProbability: 0.8,
    x_adjust: -20,
    y_adjust: 0,
  },
];

const OtherMap: FC = () => {
  return (
    <ExperimentMap
      mapAreas={OTHER_MAP_AREAS}
      mapType={MapType.Other}
      getMapAreaColor={getStateColor}
    />
  );
};

const getStateColor = (state: StateByForecastItem) => {
  return getColorInSpectrum(
    [0xe0, 0x16, 0x2b], // "#E0162B",
    [0xe0, 0xe0, 0xe1], // "#E0E0E1",
    [0x00, 0x52, 0xa5], // "#0052A5"
    state.democratProbability
  );
};

export default OtherMap;
