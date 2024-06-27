import { FC, forwardRef, SVGProps } from "react";

import { MapType } from "@/types/experiments";

import RawOtherMap from "./raw_other_map";
import RawUsMap from "./raw_us_map";

type Props = {
  mapType: MapType;
} & SVGProps<SVGSVGElement>;

const RawMap: FC<Props> = forwardRef(({ mapType, ...props }, ref) => {
  switch (mapType) {
    case MapType.US:
      return <RawUsMap {...props} ref={ref} />;
    // testing other svg path
    // TODO: remove this
    case MapType.Other:
      return <RawOtherMap {...props} ref={ref} />;
    default:
      return null;
  }
});
RawMap.displayName = "RawMap";

export default RawMap;
