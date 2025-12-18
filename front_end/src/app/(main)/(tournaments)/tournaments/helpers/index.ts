import { isValid } from "date-fns";
import { toDate } from "date-fns-tz";

import { TournamentPreview, TournamentType } from "@/types/projects";

import { TournamentsSection } from "../types";

const archiveEndTs = (t: TournamentPreview) =>
  [t.forecasting_end_date, t.close_date, t.start_date]
    .map((s) => (s ? toDate(s.trim(), { timeZone: "UTC" }) : null))
    .find((d) => d && isValid(d))
    ?.getTime() ?? 0;

export function extractTournamentLists(tournaments: TournamentPreview[]) {
  const activeTournaments: TournamentPreview[] = [];
  const archivedTournaments: TournamentPreview[] = [];
  const questionSeries: TournamentPreview[] = [];
  const indexes: TournamentPreview[] = [];

  for (const t of tournaments) {
    if (t.is_ongoing) {
      if (t.type === TournamentType.QuestionSeries) {
        questionSeries.push(t);
      } else if (t.type === TournamentType.Index) {
        indexes.push(t);
      } else {
        activeTournaments.push(t);
      }
    } else {
      archivedTournaments.push(t);
    }
  }

  archivedTournaments.sort((a, b) => archiveEndTs(b) - archiveEndTs(a));
  return { activeTournaments, archivedTournaments, questionSeries, indexes };
}

export function selectTournamentsForSection(
  tournaments: TournamentPreview[],
  section: TournamentsSection
): TournamentPreview[] {
  if (section === "archived") {
    const archived = tournaments.filter((t) => !t.is_ongoing);
    archived.sort((a, b) => archiveEndTs(b) - archiveEndTs(a));
    return archived;
  }

  const ongoing = tournaments.filter((t) => t.is_ongoing);

  if (section === "series") {
    return ongoing.filter((t) => t.type === TournamentType.QuestionSeries);
  }

  if (section === "indexes") {
    return ongoing.filter((t) => t.type === TournamentType.Index);
  }

  return ongoing.filter(
    (t) =>
      t.type !== TournamentType.QuestionSeries &&
      t.type !== TournamentType.Index
  );
}
