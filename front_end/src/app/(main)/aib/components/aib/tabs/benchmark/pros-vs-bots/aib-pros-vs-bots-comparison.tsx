import { METAC_COLORS } from "@/constants/colors";

import AIBProsVsBotsDiffChart from "./aib-pros-vs-bots-chart";
import { ALL_TYPES, BINARY_ONLY_EXAMPLE } from "./config";

export const AIBProsVsBotsDiffExample: React.FC = () => {
  return (
    <div className="mt-4">
      <AIBProsVsBotsDiffChart
        series={[
          {
            label: "Binary questions only",
            colorToken: METAC_COLORS["mc-option"][1],
            data: BINARY_ONLY_EXAMPLE,
          },
          {
            label: "All question types",
            colorToken: METAC_COLORS["mc-option"][2],
            data: ALL_TYPES,
          },
        ]}
      />
    </div>
  );
};
