"use client";

import { FC, useState } from "react";

import ChamberTabs, { ChamberView } from "./chamber_tabs";
import GeographicMap from "./geographic_map";
import TileMap from "./tile_map";
import { SenateRaceWithQuestion } from "../helpers/post_utils";

type Props = {
  senateRaces: SenateRaceWithQuestion[];
  governorRaces: SenateRaceWithQuestion[];
};

const ResponsiveMap: FC<Props> = ({ senateRaces, governorRaces }) => {
  const [view, setView] = useState<ChamberView>("senate");
  const races = view === "senate" ? senateRaces : governorRaces;

  return (
    <>
      {/* Geographic map shown only at lg+ where the map column has enough
          room to render the country comfortably. Below lg the layout
          collapses to a single column and the tile map takes over. */}
      <div className="hidden h-full lg:block">
        <GeographicMap
          races={races}
          tabsSlot={<ChamberTabs value={view} onChange={setView} />}
        />
      </div>
      <div className="flex h-full items-center p-5 lg:hidden">
        <div className="w-full">
          <div className="mb-4 flex justify-center">
            <ChamberTabs value={view} onChange={setView} />
          </div>
          <TileMap races={races} />
        </div>
      </div>
    </>
  );
};

export default ResponsiveMap;
