import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Aggregation Explorer | Metaculus",
  description:
    "Explore how Metaculus aggregates individual forecasts into community predictions. Visualize aggregation methods, weights, and forecast distributions.",
};

export default function AggregationExplorerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
