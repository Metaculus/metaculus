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

  const startYear = parseInt(match[1], 10);
  const duration = parseInt(match[2], 10);

  if (duration === 1) {
    return `${startYear}`;
  } else {
    const endYear = startYear + duration - 1;
    return `${startYear} - ${endYear}`;
  }
}
