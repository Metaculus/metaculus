"use client";
import Slider from "rc-slider";
import { FC, useEffect, useRef, useState } from "react";

import "./slider.css";

import SliderThumb from "@/components/sliders/primitives/thumb";

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
  step: number;
  onChange: (value: MultiSliderValue) => void;
  shouldSyncWithDefault?: boolean;
};

const MultiSlider: FC<Props> = ({
  value,
  min,
  max,
  step,
  onChange,
  shouldSyncWithDefault,
}) => {
  const [controlledValue, setControlledValue] = useState<ControlledValue>([
    value.left,
    value.center,
    value.right,
  ]);
  const persistedPositionOrigin = useRef<ControlledValue | null>(null);
  const handlePressIn = (index: number) => {
    if (index === 1) {
      persistedPositionOrigin.current = controlledValue;
    }
  };

  useEffect(() => {
    if (shouldSyncWithDefault) {
      setControlledValue([value.left, value.center, value.right]);
    }
  }, [value, shouldSyncWithDefault]);

  return (
    <Slider
      min={min}
      max={max}
      step={step}
      value={controlledValue}
      range
      onChange={(_value) => {
        const value = _value as ControlledValue;
        let newValue = value;
        if (persistedPositionOrigin.current !== null) {
          const firstItemDelta = calculateCenterMovementDiff(
            {
              origin: persistedPositionOrigin.current[1],
              value: persistedPositionOrigin.current[0],
            },
            { origin: value[1], value: value[0] }
          );
          const lastItemDelta = calculateCenterMovementDiff(
            {
              origin: persistedPositionOrigin.current[1],
              value: persistedPositionOrigin.current[2],
            },
            { origin: value[1], value: value[2] }
          );

          newValue = [
            value[0] + firstItemDelta,
            value[1],
            value[2] + lastItemDelta,
          ];
        }
        setControlledValue(newValue);
        onChange({
          left: newValue[0],
          center: newValue[1],
          right: newValue[2],
        });
      }}
      onChangeComplete={() => {
        persistedPositionOrigin.current = null;
      }}
      pushable={true}
      allowCross={true}
      handleRender={(origin, props) => {
        return (
          <SliderThumb
            {...origin.props}
            active={props.index === 1}
            onMouseDown={() => {
              handlePressIn(props.index);
            }}
            onTouchStartCapture={() => {
              handlePressIn(props.index);
            }}
          />
        );
      }}
    />
  );
};

type Position = { origin: number; value: number };
function calculateCenterMovementDiff(
  persistedValue: Position,
  value: Position
) {
  const persistedValueDiff = persistedValue.value - persistedValue.origin;
  const valueDiff = value.value - value.origin;
  return persistedValueDiff - valueDiff;
}

export default MultiSlider;
