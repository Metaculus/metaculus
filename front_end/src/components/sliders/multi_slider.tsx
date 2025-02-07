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
  step: number;
  clampStep?: number;
  onChange: (value: MultiSliderValue) => void;
  shouldSyncWithDefault?: boolean;
  disabled?: boolean;
};

const MultiSlider: FC<Props> = ({
  value,
  step,
  clampStep = 0,
  onChange,
  shouldSyncWithDefault,
  disabled = false,
}) => {
  const [controlledValue, setControlledValue] = useState<ControlledValue>([
    value.left,
    value.center,
    value.right,
  ]);
  const [allowCross, setAllowCross] = useState(true);
  // controls the slide change behaviour
  // undefined - block any changes (e.g. clicking the track)
  // null - regular slide change (a.k.a. dragging a single thumb)
  // ControlledValue - dragging the center thumb (a.k.a. sync boundary thumbs according to the center thumb position)
  const persistedPositionOrigin = useRef<ControlledValue | null | undefined>(
    undefined
  );
  const handlePressIn = (index: number) => {
    if (index === 1) {
      persistedPositionOrigin.current = controlledValue;
    } else {
      persistedPositionOrigin.current = null;
    }
  };

  useEffect(() => {
    if (shouldSyncWithDefault) {
      setControlledValue([value.left, value.center, value.right]);
    }
  }, [value, shouldSyncWithDefault]);

  const handleValueChange = (value: ControlledValue) => {
    if (persistedPositionOrigin.current === undefined) {
      return;
    }

    let newValue: ControlledValue;
    if (persistedPositionOrigin.current !== null) {
      setAllowCross(true);
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
    } else {
      setAllowCross(false);
      newValue = [
        Math.min(value[0], value[1] - clampStep),
        value[1],
        Math.max(value[2], value[1] + clampStep),
      ];
    }

    setControlledValue(newValue);
    onChange({
      left: newValue[0],
      center: newValue[1],
      right: newValue[2],
    });
  };

  return (
    <Slider
      min={0}
      max={1}
      step={step}
      value={controlledValue}
      range
      disabled={disabled}
      onChange={(value) => handleValueChange(value as ControlledValue)}
      onChangeComplete={() => {
        persistedPositionOrigin.current = undefined;
      }}
      pushable={true}
      allowCross={allowCross}
      draggableTrack={false}
      style={{ touchAction: "pan-y" }}
      handleRender={(origin, props) => {
        return (
          <SliderThumb
            {...origin.props}
            value={
              // Pass the correct value
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              controlledValue[props.index]!
            }
            active={props.index === 1}
            onClickIn={() => {
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
