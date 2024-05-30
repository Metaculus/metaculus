import { FC } from "react";

import NumericChart from "@/components/charts/numeric_chart";
import PredictionChip from "@/components/prediction_chip";
import { NumericForecast } from "@/types/question";

const HEIGHT = 100;

type Props = {
  forecast: NumericForecast;
};

const NumericTile: FC<Props> = ({ forecast }) => {
  return (
    <div className="flex justify-between">
      <div className="mr-3 inline-flex flex-col justify-center gap-0.5 text-xs font-semibold text-metac-gray-600 xs:max-w-[650px] dark:text-metac-gray-600-dark">
        <PredictionChip chipClassName="bg-metac-olive-700 dark:bg-metac-olive-700-dark" />
      </div>
      <div className="my-1 w-2/3 min-w-24 max-w-[500px] flex-1 overflow-visible">
        <NumericChart dataset={forecast} height={HEIGHT} />
      </div>
    </div>
  );
};

export default NumericTile;
