"use client";

import { FC } from "react";

import { CombinedFeedTile } from "@/types/projects";

import TileShell from "./tile_shell";

type Props = {
  tile: CombinedFeedTile & { type: "ad" };
  size?: "narrow" | "wide";
  onDismiss?: () => void;
};

const AdTile: FC<Props> = ({ tile, onDismiss }) => {
  const { ad, project } = tile;
  const image = ad.image ?? project?.header_image ?? null;
  const hasCta = !!ad.cta_text;

  return (
    <TileShell href={ad.url} image={image} onDismiss={onDismiss}>
      <div className={`relative flex flex-col ${!hasCta ? "text-center" : ""}`}>
        <h4 className="my-0 text-lg font-bold leading-7 text-gray-0">
          {ad.title}
        </h4>
        {ad.description && (
          <p className="my-0 mt-2 text-sm font-normal leading-5 text-gray-0">
            {ad.description}
          </p>
        )}
        {hasCta && (
          <div className="mt-8">
            <span className="inline-flex items-center justify-center rounded-full border border-blue-400 bg-gray-0 px-3 py-2 text-sm font-medium leading-4 text-blue-700">
              {ad.cta_text}
            </span>
          </div>
        )}
      </div>
    </TileShell>
  );
};

export default AdTile;
