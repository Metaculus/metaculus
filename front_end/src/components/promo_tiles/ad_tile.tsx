"use client";

import Image from "next/image";
import Link from "next/link";
import { FC } from "react";

import { AdCombinedFeedTile } from "@/types/projects";
import { sendAnalyticsEvent } from "@/utils/analytics";

import { TileStatusRow } from "./tile_status_row";

type Props = {
  tile: AdCombinedFeedTile;
  onDismiss?: () => void;
};

const AdTile: FC<Props> = ({ tile, onDismiss }) => {
  const { ad, project } = tile;
  const image = ad.image ?? project?.header_image ?? null;
  const hasCta = !!ad.cta_text;

  return (
    <Link
      href={ad.url}
      onClick={() =>
        sendAnalyticsEvent("internalAdClicked", { ad_title: ad.title })
      }
      className="group relative flex flex-col gap-3 overflow-hidden rounded border border-transparent px-6 py-5 text-gray-0 no-underline transition-colors hover:border-gray-0/70"
    >
      <div className="absolute inset-0 bg-blue-900" />
      {image && (
        <Image
          src={image}
          alt=""
          fill
          className="size-full object-cover object-center"
          unoptimized
        />
      )}

      {onDismiss && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss();
          }}
          className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded text-gray-0/60 transition-colors hover:text-gray-0"
          aria-label="Dismiss"
        >
          ×
        </button>
      )}

      <div className={`relative flex flex-col ${!hasCta ? "text-center" : ""}`}>
        <h4 className="my-0 text-lg font-bold leading-7 text-gray-0">
          {ad.title}
        </h4>
        {ad.description && (
          <p className="my-0 mt-2 text-sm font-normal leading-5 text-gray-0">
            {ad.description}
          </p>
        )}
      </div>

      {(hasCta || project) && (
        <div className="relative flex flex-wrap items-center gap-4">
          {hasCta && (
            <span className="inline-flex items-center justify-center rounded-full border border-blue-400 bg-gray-0 px-3 py-2 text-sm font-medium leading-4 text-blue-700">
              {ad.cta_text}
            </span>
          )}
          {project && <TileStatusRow project={project} className="p-0" />}
        </div>
      )}
    </Link>
  );
};

export default AdTile;
