import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import ServerTrackRecordApi from "@/services/api/track_record/track_record.server";

import TrackRecordCharts from "./track_record_charts";

const AsyncTrackRecord: FC = async () => {
  const trackRecord = await ServerTrackRecordApi.getGlobalTrackRecord();
  const keyStatStyles =
    "flex w-full md:w-1/3 flex-col min-h-[100px] justify-center gap-1.5 rounded bg-blue-200 p-3 text-center dark:bg-blue-950";

  return (
    <div>
      <TrackRecordCharts
        scoreHistogram={trackRecord.score_histogram}
        calibrationCurve={trackRecord.calibration_curve}
        scatterPlot={trackRecord.score_scatter_plot}
      />
      <div className="flex flex-col rounded bg-white p-6 dark:bg-blue-900 ">
        <div className="flex w-full flex-row items-center justify-between">
          <h3 className="my-0 py-0 text-gray-700 dark:text-gray-300">
            Forecasting Stats
          </h3>
        </div>
        <h3 className="mb-5 mt-0 pt-0 text-gray-700 dark:text-gray-300"></h3>
        <div className="flex flex-col gap-2 md:flex-row md:gap-4">
          <div className={keyStatStyles}>
            <span className="text-2xl font-normal text-gray-800 dark:text-gray-200">
              {trackRecord.average_score
                ? Math.round(trackRecord.average_score * 100) / 100
                : "-"}
            </span>
            <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
              AVERAGE BASELINE SCORE
            </span>
          </div>
          <div className={keyStatStyles}>
            <span className="text-2xl font-normal text-gray-800 dark:text-gray-200">
              {trackRecord.forecasts_count}
            </span>
            <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
              TOTAL PREDICTIONS
            </span>
          </div>
          <div className={keyStatStyles}>
            <span className="text-2xl font-normal text-gray-800 dark:text-gray-200">
              {trackRecord.questions_predicted_count}
            </span>
            <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
              QUESTIONS PREDICTED
            </span>
          </div>
          <div className={keyStatStyles}>
            <span className="text-2xl font-normal text-gray-800 dark:text-gray-200">
              {trackRecord.score_count}
            </span>
            <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
              QUESTIONS SCORED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithServerComponentErrorBoundary(AsyncTrackRecord);
