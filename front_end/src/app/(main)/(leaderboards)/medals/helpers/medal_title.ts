import { isNil } from "lodash";

import { Medal, MedalProjectType } from "@/types/scoring";

export function getMedalDisplayTitle(medal: Medal): string {
  if (medal.projectType === MedalProjectType.Tournament) {
    return medal.projectName;
  }

  const { name } = medal;
  const match = name.match(/^(\d{4}): (\d+) year .+$/);
  if (!match) {
    return "";
  }

  const rawStartYear = match[1];
  const rawDuration = match[2];
  if (isNil(rawStartYear) || isNil(rawDuration)) {
    return "";
  }

  const startYear = parseInt(rawStartYear, 10);
  const duration = parseInt(rawDuration, 10);

  if (duration === 1) {
    return `${startYear}`;
  } else {
    const endYear = startYear + duration - 1;
    return `${startYear} - ${endYear}`;
  }
}
