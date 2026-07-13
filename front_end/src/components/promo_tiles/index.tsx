"use client";

import { FC } from "react";

import { CombinedFeedTile } from "@/types/projects";

import AdTile from "./ad_tile";
import TournamentTile from "./tournament_tile";

export { default as AdTile } from "./ad_tile";
export { default as TournamentTile } from "./tournament_tile";
export { TileStatusRow } from "./tile_status_row";

type Props = {
  tile: CombinedFeedTile;
  feedPage?: number;
  onDismiss?: (id: string) => void;
};

const PromoTile: FC<Props> = ({ tile, feedPage = 0, onDismiss }) => {
  const handleDismiss = onDismiss ? () => onDismiss(tile.id) : undefined;
  if (tile.type === "ad") {
    return <AdTile tile={tile} onDismiss={handleDismiss} />;
  }
  return (
    <TournamentTile tile={tile} feedPage={feedPage} onDismiss={handleDismiss} />
  );
};

export { PromoTile };
