"use client";
import RcSlider from "rc-slider";
import { FC } from "react";

import "./slider.css";

import SliderThumb from "@/components/sliders/primitives/thumb";

type Props = {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step: number;
};

const Slider: FC<Props> = ({ value, min, max, onChange, step }) => {
  return (
    <RcSlider
      className="h-9 w-full"
      defaultValue={value}
      min={min}
      max={max}
      step={step}
      onChange={(_value) => {
        const value = _value as number;
        onChange(value);
      }}
      handleRender={(origin) => <SliderThumb {...origin.props} active />}
    />
  );
};

export default Slider;
