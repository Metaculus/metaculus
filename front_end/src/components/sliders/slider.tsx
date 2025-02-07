"use client";
import { clamp } from "lodash";
import RcSlider from "rc-slider";
import { SemanticName } from "rc-slider/lib/interface";
import { CSSProperties, FC, ReactNode, useEffect, useState } from "react";

import "./slider.css";

import SliderThumb from "@/components/sliders/primitives/thumb";

type Props = {
  inputMin: number;
  inputMax: number;
  defaultValue: number;
  onChange: (value: number) => void;
  step: number;
  arrowStep?: number;
  round?: boolean;
  shouldSyncWithDefault?: boolean;
  arrowClassName?: string;
  marks?: Record<number, ReactNode>;
  disabled?: boolean;
  styles?: Partial<Record<SemanticName, CSSProperties>>;
  showValue?: boolean;
};

const Slider: FC<Props> = ({
  defaultValue,
  inputMin,
  inputMax,
  onChange,
  step,
  arrowStep,
  round = false,
  shouldSyncWithDefault,
  arrowClassName,
  marks,
  disabled = false,
  styles,
  showValue = false,
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
      min={inputMin}
      max={inputMax}
      step={controlledStep}
      marks={marks}
      onChange={(_value) => {
        const value = _value as number;
        const roundedValue = dynamicRound(value, step, inputMin, inputMax);
        setControlledValue(roundedValue);
        onChange(roundedValue);
      }}
      style={{ touchAction: "pan-y" }}
      styles={styles}
      disabled={disabled}
      handleRender={(origin) => (
        <SliderThumb
          {...origin.props}
          value={controlledValue}
          showValue={showValue}
          onClickIn={() => {
            setControlledStep(step);
          }}
          onTouchStartCapture={(e) => {
            e.preventDefault();
          }}
          active={!round}
          onArrowClickIn={
            arrowStep && !disabled
              ? () => {
                  setControlledStep(arrowStep ?? step);
                }
              : undefined
          }
          onArrowClickOut={
            arrowStep && !disabled
              ? (direction) => {
                  const newValue = clamp(
                    controlledValue + (arrowStep ?? step) * direction,
                    inputMin,
                    inputMax
                  );
                  const roundedValue = dynamicRound(
                    newValue,
                    arrowStep ?? step,
                    inputMin,
                    inputMax
                  );
                  setControlledValue(roundedValue);
                  onChange(roundedValue);
                }
              : undefined
          }
          arrowClassName={arrowClassName}
        />
      )}
    />
  );
};

function dynamicRound(
  num: number,
  step: number,
  inputMin: number,
  inputMax: number
) {
  const stepString = step.toString();
  const split = stepString.split(".");
  let decimalPlaces = 0;
  if (split.length > 1) {
    // okay to do no-non-null-assertion because we know split.length > 1
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    decimalPlaces = split[1]!.length;
  }
  const multiplier = Math.pow(10, decimalPlaces);
  return clamp(Math.round(num * multiplier) / multiplier, inputMin, inputMax);
}

export default Slider;
