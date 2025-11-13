import { isNil } from "lodash";

import { CategoryKey } from "@/types/scoring";

export const LEADERBOARD_CATEGORIES = [
  "baseline",
  "peer",
  "comments",
  "questionWriting",
  "tournament",
  "all",
] as const;
export const DEFAULT_LEADERBOARD_CATEGORY: CategoryKey = "all";

const LEADERBOARD_YEARS = [
  // 1 year leaderboards
  "2016,1",
  "2017,1",
  "2018,1",
  "2019,1",
  "2020,1",
  "2021,1",
  "2022,1",
  "2023,1",
  "2024,1",
  "2025,1",
  // "2026,1", // coming soon
  // 2 year leaderboards
  "2016,2",
  "2018,2",
  "2020,2",
  "2021,2",
  "2022,2",
  "2023,2",
  "2024,2",
  // "2025,2", // coming soon
  // 5 year leaderboards
  "2016,5",
  "2021,5",
  // "2026,5", // coming soon
  // 10 year leaderboards
  "2016,10",
  // "2026,10", // coming soon
];
export const LEADERBOARD_YEAR_OPTIONS = LEADERBOARD_YEARS.reduce<
  Array<{ year: string; duration: string }>
>((acc, opt) => {
  const [year, duration] = opt.split(",");
  if (!isNil(year) && !isNil(duration)) {
    acc.push({ year, duration });
  }

  return acc;
}, []);
