"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import CalibrationChart from "@/app/(main)/charts/calibration_chart";
import { UserProfile } from "@/types/users";

const TrackRecord: FC<{ profile: UserProfile }> = ({ profile }) => {
  const t = useTranslations();

  return (
    <div>
      <div className="flex flex-col gap-6 rounded bg-white p-6 dark:bg-blue-900">
        {profile.calibration_curve && (
          <CalibrationChart data={profile.calibration_curve} />
        )}
      </div>
    </div>
  );
};

export default TrackRecord;
