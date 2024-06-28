import { FC } from "react";

import { Candle } from "@/types/experiments";

import CandleBar from "./candle_bar";

type Props = {
  candles: Candle[];
};

const ExperimentCandleBarGraph: FC<Props> = ({ candles }) => {
  return (
    <div className="relative w-full">
      <div className=" flex w-full flex-col gap-3">
        {candles.map((candle, index) => (
          <CandleBar key={`candle-${index}`} {...candle} />
        ))}
      </div>
    </div>
  );
};

export default ExperimentCandleBarGraph;
