"use client";
import { FC } from "react";

import { StateByForecastItem } from "@/types/experiments";

import ElectionsMap from "../state_by_forecast/elections_map";

type Props = {
  items: StateByForecastItem[];
};

const StateByForecastCharts: FC<Props> = ({ items }) => {
  return (
    <>
      <ElectionsMap mapAreas={items} />
    </>
  );
};

export default StateByForecastCharts;
