"use client";

import { TournamentPreview } from "@/types/projects";

import { useTournamentFilters } from "../../../hooks/use_tournament_filters";

type Props = {
  items: TournamentPreview[];
  render: (items: TournamentPreview[]) => React.ReactNode;
};

const TournamentsGrid: React.FC<Props> = ({ items, render }) => {
  const { filtered } = useTournamentFilters(items);
  return <div>{render(filtered)}</div>;
};

export default TournamentsGrid;
