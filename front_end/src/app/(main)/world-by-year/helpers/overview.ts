import type { Messages } from "next-intl";

import { isLikelyByEndOf, linearPosition } from "./forecast";
import { AREA_ORDER } from "../data/area_sections";
import { QuestionKind, WorldArea, WorldQuestion } from "../data/questions";

type MessageKey = keyof Messages;

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

export const summarizeYear = (
  questions: WorldQuestion[],
  year: number
): YearSummary => {
  const likely = new Set(
    questions.filter((q) => isLikelyByEndOf(year, q)).map((q) => q.id)
  );
  const share = questions.length ? likely.size / questions.length : 0;
  const openingIndex = share < 0.15 ? 0 : share < 0.4 ? 1 : share < 0.8 ? 2 : 3;

  // An area with no questions on the page has nothing to summarise.
  const briefKeys = AREA_ORDER.flatMap((area) => {
    const inArea = questions.filter((q) => q.area === area);
    if (!inArea.length) return [];
    const areaShare =
      inArea.filter((q) => likely.has(q.id)).length / inArea.length;
    const tier = areaShare < 0.25 ? 0 : areaShare < 0.7 ? 1 : 2;
    return [AREA_BRIEF_KEYS[area][tier] as MessageKey];
  });

  return {
    openingKey: OPENING_KEYS[openingIndex] as MessageKey,
    briefKeys,
    gapCount: questions.filter(
      (q) => likely.has(q.id) && q.pairId && !likely.has(q.pairId)
    ).length,
    nextChanges: questions
      .filter((q) => !likely.has(q.id))
      .sort((a, b) => a.median - b.median)
      .slice(0, 2),
  };
};

export const CHART_WIDTH = 360;
export const CHART_HEIGHT = 180;

type Point = [number, number];

// One step per forecast crossing 50%, placed mid-way through that year.
const buildSteps = (questions: WorldQuestion[], kind: QuestionKind) => {
  const ofKind = questions.filter((q) => q.kind === kind);
  const total = Math.max(1, ofKind.length);
  const crossings = ofKind
    .flatMap((question) =>
      question.firstLikelyYear == null
        ? []
        : [{ question, year: question.firstLikelyYear }]
    )
    .sort((a, b) => a.year - b.year || a.question.median - b.question.median);

  const points: Point[] = [[0, CHART_HEIGHT]];
  crossings.forEach(({ year }, i) => {
    const x = linearPosition(year + 0.5) * CHART_WIDTH;
    points.push(
      [x, CHART_HEIGHT - (i / total) * CHART_HEIGHT],
      [x, CHART_HEIGHT - ((i + 1) / total) * CHART_HEIGHT]
    );
  });
  points.push([CHART_WIDTH, (points[points.length - 1] as Point)[1]]);

  return {
    points,
    share: (year: number) =>
      crossings.filter((entry) => entry.year <= year).length / total,
  };
};

const toPath = (points: Point[]) =>
  "M" + points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L");

export type OverviewChartData = ReturnType<typeof buildOverviewChart>;

export const buildOverviewChart = (questions: WorldQuestion[]) => {
  const capabilitySteps = buildSteps(questions, "cap");
  const adoptionSteps = buildSteps(questions, "use");
  return {
    capabilityPath: toPath(capabilitySteps.points),
    adoptionPath: toPath(adoptionSteps.points),
    bandPath: `${toPath(capabilitySteps.points)} L${[...adoptionSteps.points]
      .reverse()
      .map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" L")} Z`,
    capabilityShare: capabilitySteps.share,
    adoptionShare: adoptionSteps.share,
  };
};
