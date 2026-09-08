"use client";

import { FC, useState } from "react";

import ChamberTabs, { ChamberView } from "./chamber_tabs";
import GeographicMap from "./geographic_map";
import RaceLeanSummary from "./race_lean_summary";
import TileMap from "./tile_map";
import { SenateRaceWithQuestion } from "../helpers/post_utils";

type Props = {
  senateRaces: SenateRaceWithQuestion[];
  governorRaces: SenateRaceWithQuestion[];
};

const ResponsiveMap: FC<Props> = ({ senateRaces, governorRaces }) => {
  const [view, setView] = useState<ChamberView>("senate");
  const races = view === "senate" ? senateRaces : governorRaces;
  // Built per branch rather than shared: alignment differs between the two maps,
  // and RaceLeanSummary sets a text-align class on itself, so only a className
  // passed in can override it — a wrapper's class would lose.
  const summaryProps = {
    races,
    withCloseRaces: view === "senate",
  };

  return (
    <>
      {/* Geographic map shown only at lg+ where the map column has enough
          room to render the country comfortably. Below lg the layout
          collapses to a single column and the tile map takes over. */}
      <div className="hidden h-full lg:block">
        <GeographicMap
          races={races}
          tabsSlot={<ChamberTabs value={view} onChange={setView} />}
          // Right-aligned: it sits in the corner the party legend used to hold,
          // so it wraps leftwards into empty space instead of towards the tabs.
          summarySlot={
            <RaceLeanSummary {...summaryProps} className="text-right" />
          }
        />
      </div>
      <div className="flex h-full items-center lg:hidden">
        <div className="w-full">
          <div className="mb-4 flex justify-center">
            <ChamberTabs value={view} onChange={setView} />
          </div>
          {/* empty:hidden so the gap collapses when the summary renders nothing
              — it bails to null before any race is forecast. */}
          <div className="mb-4 empty:hidden">
            <RaceLeanSummary {...summaryProps} />
          </div>
          <TileMap races={races} />
        </div>
      </div>
    </>
  );
};

export default ResponsiveMap;
