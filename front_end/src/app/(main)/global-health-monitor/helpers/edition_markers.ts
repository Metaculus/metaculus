import { GroupTimelineMarker } from "@/components/charts/primitives/timeline_markers/types";

import { EditionMarker } from "./snapshot";

export function toTimelineMarkers(
  markers: EditionMarker[]
): GroupTimelineMarker[] {
  return markers.map(({ slug, timestamp, label }) => ({
    id: slug,
    timestamp,
    dateLabel: label,
  }));
}
