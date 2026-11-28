import { buildMilestoneGroups, MilestoneGroup } from "./forecast";
import { buildOverviewChart, OverviewChartData } from "./overview";
import { WorldQuestion } from "../data/questions";

export type WorldModel = {
  questions: WorldQuestion[];
  byId: Map<string, WorldQuestion>;
  milestoneGroups: MilestoneGroup[];
  overviewChart: OverviewChartData;
  // How many forecasts first reach 50% in each year.
  arrivalsByYear: Map<number, number>;
};

// Everything derived from the whole question list, built once per data load.
export const buildWorldModel = (questions: WorldQuestion[]): WorldModel => ({
  questions,
  byId: new Map(questions.map((question) => [question.id, question])),
  milestoneGroups: buildMilestoneGroups(questions),
  overviewChart: buildOverviewChart(questions),
  arrivalsByYear: questions.reduce((counts, { firstLikelyYear: year }) => {
    if (year != null) counts.set(year, (counts.get(year) ?? 0) + 1);
    return counts;
  }, new Map<number, number>()),
});
