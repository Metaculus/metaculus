import type { Messages } from "next-intl";

import { firstLikelyYear, isLikelyByEndOf, linearPosition } from "./forecast";
import {
  QuestionKind,
  WORLD_QUESTIONS,
  WorldArea,
  WorldQuestion,
} from "../data/questions";

type MessageKey = keyof Messages;

const AREA_ORDER: WorldArea[] = ["sci", "prog", "work", "robo", "media"];

const OPENING_KEYS: MessageKey[] = [
  "worldByYearOverviewOpeningEarly",
  "worldByYearOverviewOpeningEmerging",
  "worldByYearOverviewOpeningWidespread",
  "worldByYearOverviewOpeningComplete",
];

const AREA_BRIEF_KEYS: Record<WorldArea, MessageKey[]> = {
  sci: [
    "worldByYearBriefSciencesEarly",
    "worldByYearBriefSciencesMidway",
    "worldByYearBriefSciencesAdvanced",
  ],
  prog: [
    "worldByYearBriefProgrammingEarly",
    "worldByYearBriefProgrammingMidway",
    "worldByYearBriefProgrammingAdvanced",
  ],
  work: [
    "worldByYearBriefWorkEarly",
    "worldByYearBriefWorkMidway",
    "worldByYearBriefWorkAdvanced",
  ],
  robo: [
    "worldByYearBriefRoboticsEarly",
    "worldByYearBriefRoboticsMidway",
    "worldByYearBriefRoboticsAdvanced",
  ],
  media: [
    "worldByYearBriefMediaEarly",
    "worldByYearBriefMediaMidway",
    "worldByYearBriefMediaAdvanced",
  ],
};

export type YearSummary = {
  openingKey: MessageKey;
  briefKeys: MessageKey[];
  // Capabilities that have arrived while the adoption they unlock has not.
  gapCount: number;
  nextChanges: WorldQuestion[];
};

export const summarizeYear = (year: number): YearSummary => {
  const likely = new Set(
    WORLD_QUESTIONS.filter((q) => isLikelyByEndOf(year, q)).map((q) => q.id)
  );
  const share = likely.size / WORLD_QUESTIONS.length;
  const openingIndex = share < 0.15 ? 0 : share < 0.4 ? 1 : share < 0.8 ? 2 : 3;

  const briefKeys = AREA_ORDER.map((area) => {
    const questions = WORLD_QUESTIONS.filter((q) => q.area === area);
    const areaShare =
      questions.filter((q) => likely.has(q.id)).length / questions.length;
    const tier = areaShare < 0.25 ? 0 : areaShare < 0.7 ? 1 : 2;
    return AREA_BRIEF_KEYS[area][tier] as MessageKey;
  });

  return {
    openingKey: OPENING_KEYS[openingIndex] as MessageKey,
    briefKeys,
    gapCount: WORLD_QUESTIONS.filter(
      (q) => likely.has(q.id) && q.pairId && !likely.has(q.pairId)
    ).length,
    nextChanges: WORLD_QUESTIONS.filter((q) => !likely.has(q.id))
      .sort((a, b) => a.median - b.median)
      .slice(0, 2),
  };
};

export const CHART_WIDTH = 360;
export const CHART_HEIGHT = 180;

type Point = [number, number];

// One step per forecast crossing 50%, placed mid-way through that year.
const buildSteps = (kind: QuestionKind) => {
  const questions = WORLD_QUESTIONS.filter((q) => q.kind === kind);
  const crossings = questions
    .map((question) => ({ question, year: firstLikelyYear(question) }))
    .filter((entry): entry is { question: WorldQuestion; year: number } =>
      Number.isFinite(entry.year)
    )
    .sort((a, b) => a.year - b.year || a.question.median - b.question.median);

  const points: Point[] = [[0, CHART_HEIGHT]];
  crossings.forEach(({ year }, i) => {
    const x = linearPosition(year + 0.5) * CHART_WIDTH;
    points.push(
      [x, CHART_HEIGHT - (i / questions.length) * CHART_HEIGHT],
      [x, CHART_HEIGHT - ((i + 1) / questions.length) * CHART_HEIGHT]
    );
  });
  points.push([CHART_WIDTH, (points[points.length - 1] as Point)[1]]);

  return {
    points,
    share: (year: number) =>
      crossings.filter((entry) => entry.year <= year).length / questions.length,
  };
};

const toPath = (points: Point[]) =>
  "M" + points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L");

const capabilitySteps = buildSteps("cap");
const adoptionSteps = buildSteps("use");

export const OVERVIEW_CHART = {
  capabilityPath: toPath(capabilitySteps.points),
  adoptionPath: toPath(adoptionSteps.points),
  bandPath: `${toPath(capabilitySteps.points)} L${[...adoptionSteps.points]
    .reverse()
    .map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" L")} Z`,
  capabilityShare: capabilitySteps.share,
  adoptionShare: adoptionSteps.share,
};
