import React from "react";
import {
  VictoryChart,
  VictoryLine,
  VictoryArea,
  VictoryAxis,
  VictoryBar,
  VictoryLabel,
  VictoryScatter,
} from "victory";

const CalibrationChart: React.FC<{ data: any }> = ({ data }) => {
  const calibrationData = data;
  console.log(
    calibrationData.map((d: any, index: number) => {
      return {
        x: 1 - 1 / (index + 1),
        y0: d.y_perfect_ci[0],
        y: d.y_perfect_ci[1],
      };
    })
  );
  return (
    <VictoryChart domain={{ x: [0, 1], y: [0, 1] }}>
      <VictoryScatter
        data={calibrationData.map((d: any, index: number) => {
          const y = d.y_real;
          return {
            x: (index + 0.5) / calibrationData.length,
            y0: y - 0.01,
            y: y,
            symbol: "diamond",
          };
        })}
        style={{
          data: {
            fill: "orange",
            stroke: "none",
          },
        }}
      />
      <VictoryBar
        barRatio={1.4}
        data={calibrationData.map((d: any, index: number) => {
          const y = d.y_perfect;
          return {
            x: (index + 0.5) / calibrationData.length,
            y0: y - 0.01,
            y: y,
          };
        })}
        style={{ data: { fill: "darkgray", opacity: 1 } }}
      />
      {/* Confidence interval area */}
      <VictoryBar
        barRatio={1.4}
        data={calibrationData.map((d: any, index: number) => {
          return {
            x: (index + 0.5) / calibrationData.length,
            y0: d.y_perfect_ci[0],
            y: d.y_perfect_ci[1],
          };
        })}
        style={{ data: { fill: "lightgray", opacity: 0.5 } }}
      />

      <VictoryAxis
        tickValues={[0, 0.2, 0.4, 0.6, 0.8, 1]}
        tickFormat={(t: number) => `${(t * 100).toFixed(0)}%`}
        label="Predicted probability"
      />
      <VictoryAxis
        tickValues={[0, 0.2, 0.4, 0.6, 0.8, 1]}
        tickFormat={(t: number) => `${(t * 100).toFixed(0)}%`}
        dependentAxis
        label="Actual frequency"
        axisLabelComponent={<VictoryLabel dy={-12} />}
      />
    </VictoryChart>
  );
};

export default CalibrationChart;
