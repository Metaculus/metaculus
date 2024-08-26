import { FC } from "react";

import TrackRecordApi from "@/services/track_record";

import TrackRecordCharts from "./track_record_charts";

const AsyncTrackRecord: FC = async () => {
  const trackRecord = await TrackRecordApi.getGlobalTrackRecord();

  return (
    <TrackRecordCharts
      scoreHistogram={trackRecord.score_histogram}
      calibrationCurve={trackRecord.calibration_curve}
      scatterPlot={trackRecord.score_scatter_plot}
    />
  );
};

export default AsyncTrackRecord;
