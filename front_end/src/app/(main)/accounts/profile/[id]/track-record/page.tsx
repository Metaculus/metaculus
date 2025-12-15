import TrackRecordCharts from "@/app/(main)/questions/track-record/components/track_record_charts";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { SearchParams } from "@/types/navigation";
import { formatUsername } from "@/utils/formatters/users";

type Props = {
  params: Promise<{ id: number }>;
  searchParams: Promise<SearchParams>;
};

export default async function TrackRecord(props: Props) {
  const params = await props.params;
  const profile = await ServerProfileApi.getProfileById(params.id);

  const keyStatStyles =
    "flex w-full md:w-1/3 flex-col min-h-[100px] justify-center gap-1.5 rounded bg-blue-200 p-3 text-center dark:bg-blue-950";

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <TrackRecordCharts
        scatterPlot={profile.score_scatter_plot}
        calibrationCurve={profile.calibration_curve}
        scoreHistogram={profile.score_histogram}
        username={formatUsername(profile)}
        className="bg-white p-6 dark:bg-blue-900"
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
              {profile.average_score
                ? Math.round(profile.average_score * 100) / 100
                : "-"}
            </span>
            <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
              AVERAGE PEER SCORE
            </span>
          </div>
          <div className={keyStatStyles}>
            <span className="text-2xl font-normal text-gray-800 dark:text-gray-200">
              {profile.forecasts_count}
            </span>
            <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
              TOTAL PREDICTIONS
            </span>
          </div>
          <div className={keyStatStyles}>
            <span className="text-2xl font-normal text-gray-800 dark:text-gray-200">
              {profile.questions_predicted_count}
            </span>
            <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
              QUESTIONS PREDICTED
            </span>
          </div>
          <div className={keyStatStyles}>
            <span className="text-2xl font-normal text-gray-800 dark:text-gray-200">
              {profile.score_count}
            </span>
            <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
              QUESTIONS SCORED
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col rounded bg-white p-6 dark:bg-blue-900 ">
        <div className="flex w-full flex-row items-center justify-between">
          <h3 className="my-0 py-0 text-gray-700 dark:text-gray-300">
            Authoring Stats
          </h3>
        </div>
        <h3 className="mb-5 mt-0 pt-0 text-gray-700 dark:text-gray-300"></h3>
        <div className="flex flex-col gap-2 md:flex-row md:gap-4">
          <div className={keyStatStyles}>
            <span className="text-2xl font-normal text-gray-800 dark:text-gray-200">
              {profile.posts_authored_count}
            </span>
            <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
              QUESTIONS AUTHORED
            </span>
          </div>
          <div className={keyStatStyles}>
            <span className="text-2xl font-normal text-gray-800 dark:text-gray-200">
              {profile.forecasts_on_authored_questions_count}
            </span>
            <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
              FORECASTS ON AUTHORED QUESTIONS
            </span>
          </div>
          <div className={keyStatStyles}>
            <span className="text-2xl font-normal text-gray-800 dark:text-gray-200">
              {profile.notebooks_authored_count}
            </span>
            <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
              NOTEBOOKS AUTHORED
            </span>
          </div>
          <div className={keyStatStyles}>
            <span className="text-2xl font-normal text-gray-800 dark:text-gray-200">
              {profile.comments_count}
            </span>
            <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
              COMMENTS AUTHORED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
