import { merge } from "lodash";
import { CSSProperties } from "react";
import { VictoryThemeDefinition } from "victory";

import { EMBED_THEME, EmbedTheme } from "../constants/embed_theme";

export function getEmbedTheme(
  themeParam: string | string[] | undefined,
  cssVariablesParam: string | string[] | undefined
): EmbedTheme {
  const cssVariables = processCssVariables(cssVariablesParam);
  const theme = typeof themeParam === "string" ? EMBED_THEME[themeParam] : null;

  const { card, predictionChip, chart, ...rest } = theme ?? {};
  const chartTheme = getEmbeddedChartTheme(chart, cssVariables);
  const cardTheme = getEmbeddedCardTheme(card, cssVariables);
  const chipTheme = getEmbeddedChipTheme(predictionChip, cssVariables);

  return {
    card: cardTheme,
    chart: chartTheme,
    predictionChip: chipTheme,
    ...rest,
  };
}

function processCssVariables(
  cssVariables: string | string[] | undefined
): Record<string, string> {
  const mapCssVariablesToObject = (
    variables: string[]
  ): Record<string, string> =>
    variables.reduce(
      (acc, param) => {
        const [key, value] = param.split("=");
        acc[key.replace(/-/g, "_")] = value;
        return acc;
      },
      {} as Record<string, string>
    );

  if (typeof cssVariables === "string") {
    return mapCssVariablesToObject([cssVariables]);
  }

  if (Array.isArray(cssVariables)) {
    return mapCssVariablesToObject(cssVariables);
  }

  return {};
}

function getEmbeddedChartTheme(
  theme: VictoryThemeDefinition | undefined,
  cssVariables: Record<string, string>
): VictoryThemeDefinition {
  const baseTheme: VictoryThemeDefinition = {
    axis: { style: { tickLabels: { fontSize: 16 } } },
    line: { style: { data: { strokeWidth: 2 } } },
  };

  if (theme) {
    return merge(baseTheme, theme);
  }

  // support legacy customization via css variables
  if (Object.values(cssVariables).length) {
    const lineColor = cssVariables["community_prediction_color"];
    const areaColor = cssVariables["community_prediction_graph_color"];
    return merge(baseTheme, {
      line: { style: { data: { stroke: lineColor } } },
      area: { style: { data: { fill: areaColor } } },
    });
  }

  return baseTheme;
}

function getEmbeddedCardTheme(
  theme: CSSProperties | undefined,
  cssVariables: Record<string, string>
): CSSProperties {
  if (theme) {
    return theme;
  }

  if (Object.values(cssVariables).length) {
    return {
      backgroundColor: cssVariables["forecast_card_background"],
    };
  }

  return {};
}

function getEmbeddedChipTheme(
  theme: CSSProperties | undefined,
  cssVariables: Record<string, string>
): CSSProperties {
  if (theme) {
    return theme;
  }

  if (Object.values(cssVariables).length) {
    return {
      backgroundColor: cssVariables["community_prediction_color"],
    };
  }

  return {};
}
