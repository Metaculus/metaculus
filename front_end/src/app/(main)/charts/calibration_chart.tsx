import React from "react";
import {
  VictoryChart,
  VictoryLine,
  VictoryArea,
  VictoryAxis,
  VictoryBar,
  VictoryLabel,
  VictoryScatter,
  VictoryContainer,
} from "victory";

const CalibrationChart: React.FC<{ data: any }> = ({ data }) => {
  const calibrationData = data;
  return (
    <div className="mb-5 size-full">
      <VictoryChart
        domain={{ x: [0, 1], y: [0, 1] }}
        containerComponent={<VictoryContainer responsive={true} />}
        padding={{ top: 24, bottom: 24, left: 35, right: 12 }}
      >
        <VictoryAxis
          tickValues={[0, 0.2, 0.4, 0.6, 0.8, 1]}
          tickFormat={(t: number) => `${(t * 100).toFixed(0)}%`}
          style={{
            tickLabels: { fontSize: 10, fontWeight: "lighter", opacity: 0.6 },
            axis: { stroke: "#ECEDEE" },
            grid: { stroke: "#ECEDEE" },
          }}
        />
        <VictoryAxis
          tickValues={[0, 0.2, 0.4, 0.6, 0.8, 1]}
          tickFormat={(t: number) => `${(t * 100).toFixed(0)}%`}
          dependentAxis
          axisLabelComponent={<VictoryLabel dy={-12} />}
          style={{
            tickLabels: { fontSize: 10, fontWeight: "lighter", opacity: 0.6 },
            axis: { stroke: "#ECEDEE" },
            grid: { stroke: "#ECEDEE" },
          }}
        />
        <VictoryScatter
          data={calibrationData.map((d: any, index: number) => {
            const y = d.user_middle_quartile;
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
          barRatio={1.2}
          data={calibrationData.map((d: any, index: number) => {
            const y = d.perfect_calibration;
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
              y0: d.user_lower_quartile,
              y: d.user_upper_quartile,
            };
          })}
          style={{ data: { fill: "lightgray", opacity: 0.5 } }}
        />
      </VictoryChart>
    </div>
  );
};

export default CalibrationChart;
