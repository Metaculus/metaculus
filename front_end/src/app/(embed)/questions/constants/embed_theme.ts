import { CSSProperties } from "react";
import { VictoryThemeDefinition } from "victory";

export type EmbedTheme = {
  container: CSSProperties;
  card: CSSProperties;
  predictionChip: CSSProperties;
  chart: VictoryThemeDefinition;
  title?: CSSProperties;
};

export const EMBED_THEME: Record<string, EmbedTheme> = {
  "verity-light": {
    container: {
      backgroundColor: "#F0F0F0",
    },
    chart: {
      line: { style: { data: { stroke: "#89BFD1" } } },
      area: { style: { data: { fill: "#89BFD1" } } },
    },
    card: {
      backgroundColor: "#F0F0F0",
      fontFamily: "serif",
    },
    predictionChip: {
      backgroundColor: "#89BFD1",
    },
  },
  "verity-dark": {
    container: {
      backgroundColor: "#19191C",
    },
    chart: {
      line: { style: { data: { stroke: "#89BFD1" } } },
      area: { style: { data: { fill: "#89BFD1" } } },
    },
    card: {
      backgroundColor: "#19191C",
      fontFamily: "serif",
    },
    predictionChip: {
      backgroundColor: "#89BFD1",
    },
  },
};
