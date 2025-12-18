"use client";
import Slider from "rc-slider";
import { FC, useEffect, useRef, useState, useMemo } from "react";

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

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

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

  const activeIndexRef = useRef<number | null>(null);

  // controls the slide change behaviour
  // undefined - block any changes (e.g. clicking the track)
  // null - regular slide change (a.k.a. dragging a single thumb)
  // ControlledValue - dragging the center thumb (a.k.a. sync boundary thumbs according to the center thumb position)
  const persistedPositionOrigin = useRef<ControlledValue | null | undefined>(
    undefined
  );
  const handlePressIn = (index: number) => {
    activeIndexRef.current = index;

    if (index === 1) {
      persistedPositionOrigin.current = controlledValue;
    } else {
      persistedPositionOrigin.current = null;
    }
  };

  useEffect(() => {
    if (shouldSyncWithDefault) {
      // prevent slider thumbs from being stuck one on top of the other
      const center = value.center;
      const left = Math.min(value.left, center - clampStep);
      const right = Math.max(value.right, center + clampStep);

      setControlledValue([left, center, right]);
      if (left !== value.left || right !== value.right) {
        onChange({
          left,
          center,
          right,
        });
      }
    } else {
      setControlledValue([value.left, value.center, value.right]);
    }
  }, [value, shouldSyncWithDefault, onChange, clampStep]);

  const uiValue = useMemo<ControlledValue>(() => {
    return [
      clamp01(controlledValue[0]),
      clamp01(controlledValue[1]),
      clamp01(controlledValue[2]),
    ];
  }, [controlledValue]);

  const handleValueChange = (nextUi: ControlledValue) => {
    if (persistedPositionOrigin.current === undefined) {
      return;
    }

    const active = activeIndexRef.current;

    const incoming: ControlledValue = [
      active === 0 ? nextUi[0] : controlledValue[0],
      active === 1 ? nextUi[1] : controlledValue[1],
      active === 2 ? nextUi[2] : controlledValue[2],
    ];

    let newValue: ControlledValue;
    if (persistedPositionOrigin.current !== null) {
      setAllowCross(true);
      const firstItemDelta = calculateCenterMovementDiff(
        {
          origin: persistedPositionOrigin.current[1],
          value: persistedPositionOrigin.current[0],
        },
        { origin: incoming[1], value: incoming[0] }
      );
      const lastItemDelta = calculateCenterMovementDiff(
        {
          origin: persistedPositionOrigin.current[1],
          value: persistedPositionOrigin.current[2],
        },
        { origin: incoming[1], value: incoming[2] }
      );

      newValue = [
        incoming[0] + firstItemDelta,
        incoming[1],
        incoming[2] + lastItemDelta,
      ];
    } else {
      setAllowCross(false);
      newValue = [
        Math.min(incoming[0], incoming[1] - clampStep),
        incoming[1],
        Math.max(incoming[2], incoming[1] + clampStep),
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
      value={uiValue}
      range
      disabled={disabled}
      onChange={(v) => handleValueChange(v as ControlledValue)}
      onChangeComplete={() => {
        persistedPositionOrigin.current = undefined;
        activeIndexRef.current = null;
      }}
      pushable={true}
      allowCross={allowCross}
      draggableTrack={false}
      style={{ touchAction: "pan-y" }}
      handleRender={(origin, props) => {
        return (
          <SliderThumb
            {...origin.props}
            value={getThumbValue(uiValue, props.index)}
            active={props.index === 1}
            onClickIn={() => {
              handlePressIn(props.index);
            }}
            onTouchStartCapture={(e) => {
              e.preventDefault();
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

const getThumbValue = (values: ControlledValue, index: number): number => {
  if (index === 0) return values[0];
  if (index === 1) return values[1];
  if (index === 2) return values[2];
  return values[1];
};

export default MultiSlider;
