import { FC } from "react";

import { PageSection, SECTION_TILES, TileCell } from "../helpers/top_bar";

const Cells: FC<{ cells: TileCell[]; theme: "dark" | "light" }> = ({
  cells,
  theme,
}) =>
  cells.map(({ x, y, ...colors }) => (
    <rect
      key={`${x},${y}`}
      x={x}
      y={y}
      width={1}
      height={1}
      fill={colors[theme] ?? undefined}
      className={colors[theme] ? undefined : "fill-[var(--wby-bg)]"}
    />
  ));

const SectionTile: FC<{ section: PageSection }> = ({ section }) => (
  <svg
    viewBox="0 0 8 8"
    shapeRendering="crispEdges"
    aria-hidden
    className="block size-full"
  >
    <g className="hidden dark:inline">
      <Cells cells={SECTION_TILES[section]} theme="dark" />
    </g>
    <g className="dark:hidden">
      <Cells cells={SECTION_TILES[section]} theme="light" />
    </g>
  </svg>
);

export default SectionTile;
