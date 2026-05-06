import { FC } from "react";

import ChamberTabs from "./chamber_tabs";
import GeographicMap from "./geographic_map";
import TileMap from "./tile_map";
import { SenateRaceWithQuestion } from "../helpers/post_utils";

type Props = {
  races: SenateRaceWithQuestion[];
};

const ResponsiveMap: FC<Props> = ({ races }) => {
  return (
    <>
      {/* Geographic map shown only at lg+ where the map column has enough
          room to render the country comfortably. Below lg the layout
          collapses to a single column and the tile map takes over. */}
      <div className="hidden h-full lg:block">
        <GeographicMap races={races} tabsSlot={<ChamberTabs />} />
      </div>
      <div className="flex h-full items-center p-5 lg:hidden">
        <div className="w-full">
          <TileMap races={races} />
        </div>
      </div>
    </>
  );
};

export default ResponsiveMap;
