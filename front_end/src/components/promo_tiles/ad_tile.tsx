"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { FC } from "react";

import { AdCombinedFeedTile } from "@/types/projects";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import { getProjectLink } from "@/utils/navigation";

import { TileStatusRow } from "./tile_status_row";

type Props = {
  tile: AdCombinedFeedTile;
  onDismiss?: () => void;
};

const AdTile: FC<Props> = ({ tile, onDismiss }) => {
  const { ad, project } = tile;
  const href = ad.url || (project ? getProjectLink(project) : "");
  const image = ad.image ?? project?.header_image ?? null;
  const hasCta = !!ad.cta_text;

  return (
    <Link
      href={href}
      onClick={() =>
        sendAnalyticsEvent("internalAdClicked", { ad_title: ad.title })
      }
      className={cn(
        "group relative flex min-h-40 flex-col justify-center overflow-hidden rounded border border-blue-700 px-6 py-5 text-gray-0 no-underline transition-colors hover:border-gray-0/70",
        hasCta ? "gap-8" : "gap-3"
      )}
    >
      <div className="absolute inset-0 bg-blue-700" />
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
          <FontAwesomeIcon icon={faXmark} />
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
        <div
          className={`relative flex flex-wrap items-center gap-4 ${!hasCta ? "justify-center" : ""}`}
        >
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
