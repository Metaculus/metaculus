import type { Messages } from "next-intl";

import type { Scaling } from "@/types/question";

export type WorldArea = "sci" | "prog" | "work" | "robo" | "media";
export type QuestionKind = "cap" | "use";

// The part of a question that is curated here rather than fetched.
export type CuratedQuestion = {
  id: string;
  area: WorldArea;
  kind: QuestionKind;
  metaculusId?: number;
  headlineKey: keyof Messages;
  changeKey: keyof Messages;
  // The adoption question this capability unlocks.
  pairId?: string;
};

// A community forecast as the API returns it: the CDF at evenly spaced points
// across the question's range, which for date questions is in Unix seconds.
export type WorldForecast = {
  cdf: number[];
  scaling: Scaling;
  forecasters: number;
};

// A curated question with what the page reads off its forecast. Dates are
// fractional years.
export type WorldQuestion = CuratedQuestion & {
  forecasters: number;
  median: number;
  // Infinity when the forecast only reaches the percentile past the end of
  // the question's range.
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  // Chance of having happened by the end of each year, YEAR_MIN to YEAR_MAX.
  probabilityByYearEnd: number[];
  firstLikelyYear: number | null;
  // Density relative to its peak, at evenly spaced times across the chart.
  density: number[];
};

export const AREA_TITLE_KEYS: Record<WorldArea, keyof Messages> = {
  sci: "worldByYearAreaSciences",
  prog: "worldByYearAreaProgramming",
  work: "worldByYearAreaWork",
  robo: "worldByYearAreaRobotics",
  media: "worldByYearAreaMedia",
};

export const FORECASTS_READ_AT = new Date(Date.UTC(2026, 8, 26));

// Ids prefixed "mq" are live Metaculus questions (read on FORECASTS_READ_AT);
// the rest are illustrative.
export const CURATED_QUESTIONS: CuratedQuestion[] = [
  {
    id: "he1",
    area: "sci",
    kind: "cap",
    headlineKey: "worldByYearMilestoneHe1",
    changeKey: "worldByYearChangeHe1",
    pairId: "he2",
  },
  {
    id: "he2",
    area: "sci",
    kind: "use",
    headlineKey: "worldByYearMilestoneHe2",
    changeKey: "worldByYearChangeHe2",
  },
  {
    id: "he5",
    area: "sci",
    kind: "cap",
    headlineKey: "worldByYearMilestoneHe5",
    changeKey: "worldByYearChangeHe5",
    pairId: "he6",
  },
  {
    id: "he3",
    area: "sci",
    kind: "use",
    headlineKey: "worldByYearMilestoneHe3",
    changeKey: "worldByYearChangeHe3",
  },
  {
    id: "he6",
    area: "sci",
    kind: "use",
    headlineKey: "worldByYearMilestoneHe6",
    changeKey: "worldByYearChangeHe6",
  },
  {
    id: "he4",
    area: "sci",
    kind: "use",
    headlineKey: "worldByYearMilestoneHe4",
    changeKey: "worldByYearChangeHe4",
  },
  {
    id: "he7",
    area: "sci",
    kind: "use",
    headlineKey: "worldByYearMilestoneHe7",
    changeKey: "worldByYearChangeHe7",
  },
  {
    id: "l6",
    area: "sci",
    kind: "cap",
    headlineKey: "worldByYearMilestoneL6",
    changeKey: "worldByYearChangeL6",
  },
  {
    id: "mq10411",
    area: "sci",
    kind: "cap",
    metaculusId: 10411,
    headlineKey: "worldByYearMilestoneMq10411",
    changeKey: "worldByYearChangeMq10411",
  },
  {
    id: "w5",
    area: "prog",
    kind: "cap",
    headlineKey: "worldByYearMilestoneW5",
    changeKey: "worldByYearChangeW5",
    pairId: "w6",
  },
  {
    id: "w6",
    area: "prog",
    kind: "use",
    headlineKey: "worldByYearMilestoneW6",
    changeKey: "worldByYearChangeW6",
  },
  {
    id: "p3",
    area: "prog",
    kind: "use",
    headlineKey: "worldByYearMilestoneP3",
    changeKey: "worldByYearChangeP3",
  },
  {
    id: "p1",
    area: "prog",
    kind: "cap",
    headlineKey: "worldByYearMilestoneP1",
    changeKey: "worldByYearChangeP1",
    pairId: "p2",
  },
  {
    id: "p2",
    area: "prog",
    kind: "use",
    headlineKey: "worldByYearMilestoneP2",
    changeKey: "worldByYearChangeP2",
  },
  {
    id: "mq38391",
    area: "prog",
    kind: "cap",
    metaculusId: 38391,
    headlineKey: "worldByYearMilestoneMq38391",
    changeKey: "worldByYearChangeMq38391",
  },
  {
    id: "mq406",
    area: "prog",
    kind: "cap",
    metaculusId: 406,
    headlineKey: "worldByYearMilestoneMq406",
    changeKey: "worldByYearChangeMq406",
  },
  {
    id: "w1",
    area: "work",
    kind: "cap",
    headlineKey: "worldByYearMilestoneW1",
    changeKey: "worldByYearChangeW1",
    pairId: "w3",
  },
  {
    id: "w2",
    area: "work",
    kind: "use",
    headlineKey: "worldByYearMilestoneW2",
    changeKey: "worldByYearChangeW2",
  },
  {
    id: "w7",
    area: "work",
    kind: "use",
    headlineKey: "worldByYearMilestoneW7",
    changeKey: "worldByYearChangeW7",
  },
  {
    id: "w3",
    area: "work",
    kind: "use",
    headlineKey: "worldByYearMilestoneW3",
    changeKey: "worldByYearChangeW3",
  },
  {
    id: "w4",
    area: "work",
    kind: "use",
    headlineKey: "worldByYearMilestoneW4",
    changeKey: "worldByYearChangeW4",
  },
  {
    id: "l3",
    area: "work",
    kind: "cap",
    headlineKey: "worldByYearMilestoneL3",
    changeKey: "worldByYearChangeL3",
    pairId: "l4",
  },
  {
    id: "l4",
    area: "work",
    kind: "use",
    headlineKey: "worldByYearMilestoneL4",
    changeKey: "worldByYearChangeL4",
  },
  {
    id: "l5",
    area: "work",
    kind: "use",
    headlineKey: "worldByYearMilestoneL5",
    changeKey: "worldByYearChangeL5",
  },
  {
    id: "c1",
    area: "work",
    kind: "cap",
    headlineKey: "worldByYearMilestoneC1",
    changeKey: "worldByYearChangeC1",
    pairId: "c2",
  },
  {
    id: "c2",
    area: "work",
    kind: "use",
    headlineKey: "worldByYearMilestoneC2",
    changeKey: "worldByYearChangeC2",
  },
  {
    id: "mq19356",
    area: "work",
    kind: "use",
    metaculusId: 19356,
    headlineKey: "worldByYearMilestoneMq19356",
    changeKey: "worldByYearChangeMq19356",
  },
  {
    id: "mq16625",
    area: "robo",
    kind: "cap",
    metaculusId: 16625,
    headlineKey: "worldByYearMilestoneMq16625",
    changeKey: "worldByYearChangeMq16625",
    pairId: "h4",
  },
  {
    id: "h4",
    area: "robo",
    kind: "use",
    headlineKey: "worldByYearMilestoneH4",
    changeKey: "worldByYearChangeH4",
  },
  {
    id: "h5",
    area: "robo",
    kind: "use",
    headlineKey: "worldByYearMilestoneH5",
    changeKey: "worldByYearChangeH5",
  },
  {
    id: "m1",
    area: "robo",
    kind: "cap",
    headlineKey: "worldByYearMilestoneM1",
    changeKey: "worldByYearChangeM1",
    pairId: "m3",
  },
  {
    id: "m2",
    area: "robo",
    kind: "use",
    headlineKey: "worldByYearMilestoneM2",
    changeKey: "worldByYearChangeM2",
  },
  {
    id: "m3",
    area: "robo",
    kind: "use",
    headlineKey: "worldByYearMilestoneM3",
    changeKey: "worldByYearChangeM3",
  },
  {
    id: "m4",
    area: "robo",
    kind: "use",
    headlineKey: "worldByYearMilestoneM4",
    changeKey: "worldByYearChangeM4",
  },
  {
    id: "m5",
    area: "robo",
    kind: "use",
    headlineKey: "worldByYearMilestoneM5",
    changeKey: "worldByYearChangeM5",
  },
  {
    id: "m6",
    area: "robo",
    kind: "use",
    headlineKey: "worldByYearMilestoneM6",
    changeKey: "worldByYearChangeM6",
  },
  {
    id: "mq43262",
    area: "robo",
    kind: "cap",
    metaculusId: 43262,
    headlineKey: "worldByYearMilestoneMq43262",
    changeKey: "worldByYearChangeMq43262",
  },
  {
    id: "mq43263",
    area: "robo",
    kind: "cap",
    metaculusId: 43263,
    headlineKey: "worldByYearMilestoneMq43263",
    changeKey: "worldByYearChangeMq43263",
  },
  {
    id: "h6",
    area: "media",
    kind: "use",
    headlineKey: "worldByYearMilestoneH6",
    changeKey: "worldByYearChangeH6",
  },
  {
    id: "mq17401",
    area: "media",
    kind: "cap",
    metaculusId: 17401,
    headlineKey: "worldByYearMilestoneMq17401",
    changeKey: "worldByYearChangeMq17401",
    pairId: "c4",
  },
  {
    id: "c4",
    area: "media",
    kind: "use",
    headlineKey: "worldByYearMilestoneC4",
    changeKey: "worldByYearChangeC4",
  },
  {
    id: "c5",
    area: "media",
    kind: "use",
    headlineKey: "worldByYearMilestoneC5",
    changeKey: "worldByYearChangeC5",
  },
  {
    id: "md2",
    area: "media",
    kind: "use",
    headlineKey: "worldByYearMilestoneMd2",
    changeKey: "worldByYearChangeMd2",
  },
  {
    id: "md1",
    area: "media",
    kind: "use",
    headlineKey: "worldByYearMilestoneMd1",
    changeKey: "worldByYearChangeMd1",
  },
  {
    id: "mq10955",
    area: "media",
    kind: "use",
    metaculusId: 10955,
    headlineKey: "worldByYearMilestoneMq10955",
    changeKey: "worldByYearChangeMq10955",
  },
  {
    id: "mq11679",
    area: "media",
    kind: "use",
    metaculusId: 11679,
    headlineKey: "worldByYearMilestoneMq11679",
    changeKey: "worldByYearChangeMq11679",
  },
];
