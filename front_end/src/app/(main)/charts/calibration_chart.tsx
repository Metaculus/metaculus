import React from "react";
import { VictoryChart, VictoryLine, VictoryArea, VictoryAxis } from "victory";

const CalibrationChart: React.FC<{ data: any }> = ({ data }) => {
  const calibrationData = data;

  return (
    <VictoryChart domain={{ x: [0, 1], y: [0, 1] }}>
      {/* Perfect calibration line */}
      <VictoryLine
        style={{ data: { stroke: "gray", strokeDasharray: "5,5" } }}
        data={[
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ]}
      />

      {/* Confidence interval area */}
      <VictoryArea
        data={calibrationData}
        x={(d) => d.y_perfect}
        y0={(d) => d.y_perfect_ci[0]}
        y={(d) => d.y_perfect_ci[1]}
        style={{ data: { fill: "lightgray", opacity: 0.5 } }}
      />

      {/* Real calibration line */}
      <VictoryLine
        data={calibrationData}
        x={(d) => d.y_perfect}
        y={(d) => d.y_real}
        style={{ data: { stroke: "blue" } }}
      />

      <VictoryAxis label="Predicted probability" />
      <VictoryAxis dependentAxis label="Actual frequency" />
    </VictoryChart>
  );
};

export default CalibrationChart;
