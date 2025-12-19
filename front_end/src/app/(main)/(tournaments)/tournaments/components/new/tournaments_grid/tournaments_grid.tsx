"use client";

import React from "react";

import { TournamentPreview } from "@/types/projects";

type Props = { items: TournamentPreview[] };

const TournamentsGrid: React.FC<Props> = ({ items }) => {
  return <div className="grid gap-4">{items.length}</div>;
};

export default TournamentsGrid;
