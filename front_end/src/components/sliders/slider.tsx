import { FC } from "react";
import ReactSlider from "react-slider";

import SliderThumb from "@/components/sliders/primitives/thumb";
import SliderTrack from "@/components/sliders/primitives/track";

type Props = {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
};

const Slider: FC<Props> = ({ value, min, max, onChange }) => {
  return (
    <ReactSlider
      className="h-9 w-full"
      defaultValue={value}
      min={min}
      max={max}
      onChange={onChange}
      renderTrack={(props) => (
        <SliderTrack sliderProps={props} className="top-[18px]" />
      )}
      renderThumb={(props) => (
        <SliderThumb sliderProps={props} active className="top-[10px]" />
      )}
    />
  );
};

export default Slider;
