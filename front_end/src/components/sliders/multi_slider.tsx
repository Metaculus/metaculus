"use client";
import { FC, useState } from "react";
import ReactSlider from "react-slider";

import SliderThumb from "@/components/sliders/primitives/thumb";
import SliderTrack from "@/components/sliders/primitives/track";

export type MultiSliderValue = {
  left: number;
  center: number;
  right: number;
};

type ControlledValue = [number, number, number];

type Props = {
  value: MultiSliderValue;
  min: number;
  max: number;
  onChange: (value: MultiSliderValue) => void;
};

const MultiSlider: FC<Props> = ({ min, max, value, onChange }) => {
  const totalDistance = max - min;
  const [controlledValue, setControlledValue] = useState<ControlledValue>([
    value.left,
    value.center,
    value.right,
  ]);
  const [centerActivePosition, setCenterActivePosition] = useState<
    number | null
  >(null);

  return (
    <ReactSlider
      className="h-9 w-full"
      value={controlledValue}
      min={min}
      max={max}
      renderTrack={(props) => (
        <SliderTrack sliderProps={props} className="top-[18px]" />
      )}
      renderThumb={(props, { index }) => (
        <SliderThumb
          sliderProps={props}
          active={index === 1}
          className="top-[10px]"
        />
      )}
      minDistance={Math.round(totalDistance * 0.05)}
      onBeforeChange={(value, index) => {
        if (index === 1) {
          setCenterActivePosition(value[index]);
        }
      }}
      onAfterChange={() => {
        setCenterActivePosition(null);
      }}
      onChange={(value) => {
        let newValue = value;
        if (centerActivePosition !== null) {
          const centerDelta = value[1] - centerActivePosition;
          newValue = [value[0] + centerDelta, value[1], value[2] + centerDelta];
        }
        setControlledValue(newValue);
        onChange({
          left: newValue[0],
          center: newValue[1],
          right: newValue[2],
        });
      }}
    />
  );
};

export default MultiSlider;
