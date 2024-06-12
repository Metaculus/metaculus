"use client";
import { FC, useState } from "react";

import Slider from "@/components/sliders/slider";
import { QuestionWithForecasts } from "@/types/question";

type Props = {
  question: QuestionWithForecasts;
};

const ForecastMakerBinary: FC<Props> = () => {
  const [sliderValue, setSliderValue] = useState(1);

  return (
    <div>
      <span>{sliderValue}</span>
      <Slider
        min={1}
        max={99}
        defaultValue={sliderValue}
        onChange={setSliderValue}
        step={1}
        arrowStep={0.1}
      />
    </div>
  );
};

export default ForecastMakerBinary;
