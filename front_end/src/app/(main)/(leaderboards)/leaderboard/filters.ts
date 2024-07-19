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
  "2024,2",
  "2024,1",
  "2023,1",
  "2022,2",
  "2022,1",
  "2021,5",
  "2021,1",
  "2020,2",
  "2020,1",
  "2019,1",
  "2018,2",
  "2018,1",
  "2017,1",
  "2016,10",
  "2016,5",
  "2016,2",
  "2016,1",
];
export const LEADERBOARD_YEAR_OPTIONS = LEADERBOARD_YEARS.map((opt) => {
  const [year, duration] = opt.split(",");
  return { year, duration };
});
