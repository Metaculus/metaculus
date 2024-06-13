"use client";
import { clamp } from "lodash";
import RcSlider from "rc-slider";
import { FC, useEffect, useState } from "react";

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
  shouldSyncWithDefault?: boolean;
  arrowClassName?: string;
};

const Slider: FC<Props> = ({
  defaultValue,
  min,
  max,
  onChange,
  step,
  arrowStep,
  round = false,
  shouldSyncWithDefault,
  arrowClassName,
}) => {
  const [controlledValue, setControlledValue] = useState(defaultValue);
  const [controlledStep, setControlledStep] = useState(step);

  useEffect(() => {
    if (shouldSyncWithDefault) {
      setControlledValue(defaultValue);
    }
  }, [defaultValue, shouldSyncWithDefault]);

  return (
    <RcSlider
      className="group h-9 w-full"
      value={controlledValue}
      min={min}
      max={max}
      step={controlledStep}
      onChange={(_value) => {
        const value = _value as number;
        const roundedValue = dynamicRound(value, step, min, max);
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
            const roundedValue = dynamicRound(
              newValue,
              arrowStep ?? step,
              min,
              max
            );
            setControlledValue(roundedValue);
            onChange(roundedValue);
          }}
          arrowClassName={arrowClassName}
        />
      )}
    />
  );
};

function dynamicRound(num: number, step: number, min: number, max: number) {
  const stepString = step.toString();
  const split = stepString.split(".");
  let decimalPlaces = 0;
  if (split.length > 1) {
    decimalPlaces = split[1].length;
  }
  const multiplier = Math.pow(10, decimalPlaces);
  return clamp(Math.round(num * multiplier) / multiplier, min, max);
}

export default Slider;
