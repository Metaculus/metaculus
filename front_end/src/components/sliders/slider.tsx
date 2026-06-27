"use client";
import { clamp } from "lodash";
import RcSlider from "rc-slider";
import { SemanticName } from "rc-slider/lib/interface";
import {
  CSSProperties,
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

import "./slider.css";

import {
  clampForecast,
  parseForecastInput,
  roundForecast,
} from "@/components/forecast_maker/forecast_text_input";
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
  editable?: boolean;
  editAriaLabel?: string;
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
  editable = false,
  editAriaLabel,
}) => {
  const [controlledValue, setControlledValue] = useState(defaultValue);
  const [controlledStep, setControlledStep] = useState(step);
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState("");

  useEffect(() => {
    if (shouldSyncWithDefault) {
      setControlledValue(defaultValue);
    }
  }, [defaultValue, shouldSyncWithDefault]);

  const openEditor = useCallback(() => {
    setDraftValue(String(controlledValue));
    setControlledStep(step);
    setIsEditing(true);
  }, [controlledValue, step]);

  const cancelEditor = useCallback(() => setIsEditing(false), []);

  const commitEditor = useCallback(() => {
    setIsEditing(false);
    const parsed = parseForecastInput(draftValue);
    if (parsed === null) return;
    const rounded = roundForecast(clampForecast(parsed, inputMin, inputMax), 1);
    if (rounded === controlledValue) return;
    setControlledValue(rounded);
    onChange(rounded);
  }, [draftValue, inputMin, inputMax, controlledValue, onChange]);

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
          onTouchStartCapture={
            editable && isEditing
              ? undefined
              : (e) => {
                  e.preventDefault();
                }
          }
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
          editable={editable}
          isEditing={editable && isEditing}
          draftValue={draftValue}
          onRequestEdit={editable ? openEditor : undefined}
          onDraftChange={editable ? setDraftValue : undefined}
          onCommit={editable ? commitEditor : undefined}
          onCancel={editable ? cancelEditor : undefined}
          editAriaLabel={editAriaLabel}
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
