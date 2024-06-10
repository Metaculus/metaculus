import { FC, useState } from "react";

import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { getIsForecastEmpty } from "@/utils/forecasts";

import MultiSlider, { MultiSliderValue } from "./sliders/multi_slider";
import Slider from "./sliders/slider";

type Props = {
  question: QuestionWithForecasts;
  prevSlider: MultiSliderValue | null;
};

const ForecastMakerNumeric: FC<Props> = ({ question, prevSlider }) => {
  const isForecastEmpty = getIsForecastEmpty(question.forecasts);

  const [forecast, setForecast] = useState<MultiSliderValue>({
    left: prevSlider ? prevSlider.left : 0.4,
    center: prevSlider ? prevSlider.center : 0.5,
    right: prevSlider ? prevSlider.right : 0.6,
  });

  if (isForecastEmpty) {
    return <div></div>;
  }

  return (
    <div>
      <MultiSlider
        min={0}
        max={1}
        value={
          prevSlider
            ? prevSlider
            : {
                left: 0.4,
                right: 0.6,
                center: 0.5,
              }
        }
        onChange={setForecast}
      />
    </div>
  );
};

export default ForecastMakerNumeric;
