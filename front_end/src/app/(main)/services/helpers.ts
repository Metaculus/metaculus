import { TournamentPreview } from "@/types/projects";

import ServiceConfig from "./serviceConfig";

export function sortServiceTournaments(tournaments: TournamentPreview[]) {
  const { tournamentsOrder } = ServiceConfig;
  return tournaments.sort(
    (a, b) =>
      (tournamentsOrder.find((t) => t.id === String(a.slug ?? a.id))?.order ??
        0) -
      (tournamentsOrder.find((t) => t.id === String(b.slug ?? b.id))?.order ??
        0)
  );
}

export function isSpotlightTournament(
  tournament: TournamentPreview,
  spotlightId: string
) {
  return !isNaN(Number(spotlightId))
    ? tournament.id === Number(spotlightId)
    : tournament.slug === spotlightId;
}
