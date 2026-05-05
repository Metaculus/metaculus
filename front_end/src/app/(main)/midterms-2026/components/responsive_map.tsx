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
      <div className="hidden h-full md:block">
        <GeographicMap races={races} tabsSlot={<ChamberTabs />} />
      </div>
      <div className="p-5 md:hidden">
        <TileMap races={races} />
      </div>
    </>
  );
};

export default ResponsiveMap;
