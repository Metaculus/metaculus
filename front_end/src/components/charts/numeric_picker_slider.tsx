"use client";
import React, { FC, useState } from "react";
import { VictoryScatter } from "victory";

import { METAC_COLORS } from "@/contants/colors";
import useThemeDetector from "@/hooks/use_is_dark_mode";

type InternalProps = {
  left: number;
  center: number;
  right: number;
  handleSliderChange: any;
};

const NumericPickerSliderInternal: FC<InternalProps> = ({
  left,
  center,
  right,
  handleSliderChange,
}) => {
  const isDarkTheme = useThemeDetector();
  let strokeColor = isDarkTheme ? "white" : "black";

  return (
    <VictoryScatter
      data={[
        { x: left, y: 0 },
        { x: center, y: 0 },
        { x: right, y: 0 },
      ]}
      size={8}
      style={{
        data: {
          fill: "rgba(1,1,1,0)",
          stroke: strokeColor,
          strokeWidth: 2,
          cursor: "pointer",
        },
      }}
      events={[
        {
          target: "data",
          eventHandlers: {
            onMouseDown: () => [
              {
                target: "data",
                mutation: (props) => {
                  const { x } = props;
                  const type =
                    x === left ? "left" : x === center ? "center" : "right";
                  return {
                    style: {
                      fill: "rgba(1,1,1,0)",
                      stroke: strokeColor,
                    },
                    onMouseMove: (_: any, { x: newX }: { x: number }) => {
                      console.log("move", newX, x);
                      handleSliderChange(newX, type);
                      return [
                        {
                          target: "data",
                          mutation: () => {
                            return {
                              style: {
                                fill: "rgba(1,1,1,0)",
                                stroke: strokeColor,
                              },
                            };
                          },
                        },
                      ];
                    },
                    onMouseUp: () => {
                      console.log("onMouseUp");
                      return [
                        {
                          target: "data",
                          mutation: () => {
                            return {
                              style: {
                                fill: "rgba(1,1,1,0)",
                                stroke: strokeColor,
                              },
                            };
                          },
                        },
                      ];
                    },
                  };
                },
              },
            ],
          },
        },
      ]}
    />
  );
};

type Props = {
  onSliderChange: (
    value: number,
    type: "left" | "center" | "right" | "weight"
  ) => void;
};

const NumericPickerSlider: FC<Props> = ({ onSliderChange }) => {
  const [left, setLeft] = useState(0.4);
  const [center, setCenter] = useState(0.5);
  const [right, setRight] = useState(0.6);
  const [weight, setWeight] = useState(1);

  const handleSliderChange = (
    value: number,
    type: "left" | "center" | "right" | "weight"
  ) => {
    if (type === "left") {
      onSliderChange(value, type);
      setLeft(value);
    } else if (type === "center") {
      onSliderChange(value, type);
      setCenter(value);
    } else if (type === "right") {
      onSliderChange(value, type);
      setRight(value);
    }
  };
  return (
    <div>
      <NumericPickerSliderInternal
        left={left}
        center={center}
        right={right}
        handleSliderChange={handleSliderChange}
      />
    </div>
  );
};

export default NumericPickerSlider;
