"use client";
import { clamp } from "lodash";
import RcSlider from "rc-slider";
import { FC, useState } from "react";

import "./slider.css";

import SliderThumb from "@/components/sliders/primitives/thumb";

type Props = {
  min: number;
  max: number;
  defaultValue: number;
  onChange: (value: number) => void;
  step: number;
  arrowStep?: number;
  round?: boolean;
};

const Slider: FC<Props> = ({
  defaultValue,
  min,
  max,
  onChange,
  step,
  arrowStep,
  round = false,
}) => {
  const [controlledValue, setControlledValue] = useState(defaultValue);
  const [controlledStep, setControlledStep] = useState(step);

  return (
    <RcSlider
      className="group h-9 w-full"
      value={controlledValue}
      min={min}
      max={max}
      step={controlledStep}
      onChange={(_value) => {
        const value = _value as number;
        const roundedValue = Math.round(value * 100) / 100;
        setControlledValue(roundedValue);
        onChange(roundedValue);
      }}
      handleRender={(origin) => (
        <SliderThumb
          {...origin.props}
          onClickIn={() => {
            setControlledStep(step);
          }}
          active={!round}
          onArrowClickIn={() => {
            setControlledStep(arrowStep ?? step);
          }}
          onArrowClickOut={(direction) => {
            const newValue = clamp(
              controlledValue + (arrowStep ?? step) * direction,
              min,
              max
            );
            const roundedValue = Math.round(newValue * 100) / 100;
            setControlledValue(roundedValue);
            onChange(roundedValue);
          }}
        />
      )}
    />
  );
};

export default Slider;
