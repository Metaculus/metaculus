"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import CalibrationChart from "@/app/(main)/charts/calibration_chart";
import UserHistogram from "@/app/(main)/charts/user_histogram";
import { UserProfile } from "@/types/users";

const TrackRecord: FC<{ profile: UserProfile }> = ({ profile }) => {
  const t = useTranslations();
  const keyStatStyles =
    "flex w-full md:w-1/3 flex-col min-h-[100px] justify-center gap-1.5 rounded bg-blue-200 p-3 text-center dark:bg-blue-950";

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col rounded bg-white p-6 dark:bg-blue-900">
        <h3 className="my-0 py-0 text-gray-700 dark:text-gray-300">
          {t("scoreHistogram")}
        </h3>
        {profile.score_histogram && (
          <UserHistogram
            rawHistogramData={profile.score_histogram}
            color="gray"
          />
        )}

        <h3 className="my-0 py-0 text-gray-700 dark:text-gray-300">
          Calibration Curve
        </h3>
        {profile.calibration_curve && (
          <CalibrationChart data={profile.calibration_curve} />
        )}
        <div className="flex flex-col items-center space-y-3 divide-y divide-gray-300 dark:divide-gray-700">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 md:gap-x-8">
            <div className="flex flex-row items-center gap-3 text-sm text-gray-800 dark:text-gray-200">
              <span className="block h-4 w-7 bg-gray-500/30"></span>confidence
              interval
            </div>
            <div className="flex flex-row items-center gap-3 text-sm text-gray-800 dark:text-gray-200">
              <span className="block h-1 w-7 bg-gray-500"></span>perfect
              calibration
            </div>
            <div className="flex flex-row items-center gap-3 text-sm text-gray-800 dark:text-gray-200">
              <span className="block size-2 rotate-45 bg-[#ffa500]"></span>
              user&apos;s calibration
            </div>
          </div>
          <span className="pt-3 text-center text-sm text-gray-600 dark:text-gray-400">
            If the diamonds are close to the grey lines, the predictions are
            well-calibrated at that confidence level. If the diamonds are closer
            to the 50% than the diamonds, the predictions were underconfident,
            and vice-versa.
          </span>
        </div>
      </div>

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
              {profile.avg_score
                ? Math.round(profile.avg_score * 100) / 100
                : "-"}
            </span>
            <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
              AVG SCORE
            </span>
          </div>
          <div className={keyStatStyles}>
            <span className="text-2xl font-normal text-gray-800 dark:text-gray-200">
              {profile.nr_forecasts}
            </span>
            <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
              PREDICTIONS
            </span>
          </div>
          <div className={keyStatStyles}>
            <span className="text-2xl font-normal text-gray-800 dark:text-gray-200">
              {profile.questions_predicted}
            </span>
            <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
              QUESTIONS PREDICTED
            </span>
          </div>
          <div className={keyStatStyles}>
            <span className="text-2xl font-normal text-gray-800 dark:text-gray-200">
              {profile.questions_predicted_scored}
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
              {profile.question_authored}
            </span>
            <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
              QUESTIONS AUTHORED
            </span>
          </div>
          <div className={keyStatStyles}>
            <span className="text-2xl font-normal text-gray-800 dark:text-gray-200">
              {0}
            </span>
            <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
              PREDICTIONS ON AUTHORED QUESTIONS
            </span>
          </div>
          <div className={keyStatStyles}>
            <span className="text-2xl font-normal text-gray-800 dark:text-gray-200">
              {profile.notebooks_authored}
            </span>
            <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
              NOTEBOOKS AUTHORED
            </span>
          </div>
          <div className={keyStatStyles}>
            <span className="text-2xl font-normal text-gray-800 dark:text-gray-200">
              {profile.comments_authored}
            </span>
            <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
              COMMENTS AUTHORED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackRecord;
