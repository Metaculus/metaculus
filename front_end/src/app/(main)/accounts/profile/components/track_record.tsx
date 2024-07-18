"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import CalibrationChart from "@/app/(main)/charts/calibration_chart";
import { UserProfile } from "@/types/users";

const TrackRecord: FC<{ profile: UserProfile }> = ({ profile }) => {
  const t = useTranslations();

  return (
    <div>
      <div className="m-4 flex flex-col rounded bg-gray-0 p-0 p-4 dark:bg-gray-0-dark">
        {profile.calibration_curve && (
          <CalibrationChart data={profile.calibration_curve} />
        )}
      </div>
    </div>
  );
};

export default TrackRecord;
