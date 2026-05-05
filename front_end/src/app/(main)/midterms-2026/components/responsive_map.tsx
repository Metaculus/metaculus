import { FC } from "react";

import GeographicMap from "./geographic_map";
import TileMap from "./tile_map";
import { SenateRaceWithPost } from "../helpers/post_utils";

type Props = {
  races: SenateRaceWithPost[];
};

const ResponsiveMap: FC<Props> = ({ races }) => {
  return (
    <>
      <div className="hidden md:block">
        <GeographicMap races={races} />
      </div>
      <div className="block md:hidden">
        <TileMap races={races} />
      </div>
    </>
  );
};

export default ResponsiveMap;
