export const MIDTERMS_PROJECT_ID = 32840;

// Single group-of-questions post that holds one binary subquestion per
// contested 2026 senate race. Subquestions are matched by `subQuestionLabel`.
export const SENATE_GROUP_POST_ID = 40598;

export type SenateRace = {
  state: string;
  name: string;
  /** Matches `question.label` on a subquestion of SENATE_GROUP_POST_ID. */
  subQuestionLabel: string;
};

// Only contested 2026 senate races (matching subquestions of post 40598).
export const SENATE_RACES: SenateRace[] = [
  { state: "GA", name: "Georgia Senate", subQuestionLabel: "Georgia" },
  { state: "IA", name: "Iowa Senate", subQuestionLabel: "Iowa" },
  { state: "ME", name: "Maine Senate", subQuestionLabel: "Maine" },
  { state: "MI", name: "Michigan Senate", subQuestionLabel: "Michigan" },
  { state: "MN", name: "Minnesota Senate", subQuestionLabel: "Minnesota" },
  {
    state: "NC",
    name: "North Carolina Senate",
    subQuestionLabel: "North Carolina",
  },
  {
    state: "NH",
    name: "New Hampshire Senate",
    subQuestionLabel: "New Hampshire",
  },
  { state: "OH", name: "Ohio Senate", subQuestionLabel: "Ohio" },
  { state: "TX", name: "Texas Senate", subQuestionLabel: "Texas" },
];

export type ChamberQuestionIds = {
  /** Multiple-choice: "Democrats" / "Republicans" / "Other" */
  senateControl: number;
  /** Multiple-choice: "Democrats" / "Republicans" / "Other" */
  houseControl: number;
  /** Multiple-choice with 4 options: "Dem Senate / Dem House" etc. */
  congressOutcome: number;
  /** Numeric distribution */
  voterTurnout: number;
  /** Binary */
  electionIntegrity: number;
};

export const CHAMBER_QUESTIONS: ChamberQuestionIds = {
  senateControl: 36370,
  houseControl: 36369,
  congressOutcome: 34484,
  voterTurnout: 41177,
  electionIntegrity: 36327,
};

// Seat-advantage distribution questions. The Senate question is a
// Discrete Continuous type (integer-spaced bars); the House question
// is a Continuous type (smooth PDF). Both are signed around zero
// where negative = Dem advantage and positive = Rep advantage.
export const SEAT_DISTRIBUTION_POSTS = {
  senate: 40416,
  house: 40413,
} as const;

export type ConsequenceRow = {
  questionKey: "climate" | "minWage" | "immigration" | "shutdown";
  repCongressPct: number;
  demCongressPct: number;
};

// Hardcoded mock rows — swap with real conditional questions when ready
export const MOCK_CONSEQUENCES: ConsequenceRow[] = [
  { questionKey: "climate", repCongressPct: 12, demCongressPct: 67 },
  { questionKey: "minWage", repCongressPct: 8, demCongressPct: 52 },
  { questionKey: "immigration", repCongressPct: 35, demCongressPct: 28 },
  { questionKey: "shutdown", repCongressPct: 18, demCongressPct: 42 },
];

export type TileCell = { abbr: string; row: number; col: number };

// 11-column × 8-row grid approximating US geography
export const US_TILE_GRID: TileCell[] = [
  { abbr: "AK", row: 0, col: 0 },
  { abbr: "ME", row: 0, col: 10 },
  { abbr: "VT", row: 1, col: 9 },
  { abbr: "NH", row: 1, col: 10 },
  { abbr: "WA", row: 2, col: 0 },
  { abbr: "ID", row: 2, col: 1 },
  { abbr: "MT", row: 2, col: 2 },
  { abbr: "ND", row: 2, col: 3 },
  { abbr: "MN", row: 2, col: 4 },
  { abbr: "WI", row: 2, col: 5 },
  { abbr: "MI", row: 2, col: 7 },
  { abbr: "NY", row: 2, col: 8 },
  { abbr: "MA", row: 2, col: 9 },
  { abbr: "RI", row: 2, col: 10 },
  { abbr: "OR", row: 3, col: 0 },
  { abbr: "NV", row: 3, col: 1 },
  { abbr: "WY", row: 3, col: 2 },
  { abbr: "SD", row: 3, col: 3 },
  { abbr: "IA", row: 3, col: 4 },
  { abbr: "IL", row: 3, col: 5 },
  { abbr: "IN", row: 3, col: 6 },
  { abbr: "OH", row: 3, col: 7 },
  { abbr: "PA", row: 3, col: 8 },
  { abbr: "NJ", row: 3, col: 9 },
  { abbr: "CT", row: 3, col: 10 },
  { abbr: "CA", row: 4, col: 0 },
  { abbr: "UT", row: 4, col: 1 },
  { abbr: "CO", row: 4, col: 2 },
  { abbr: "NE", row: 4, col: 3 },
  { abbr: "KS", row: 4, col: 4 },
  { abbr: "MO", row: 4, col: 5 },
  { abbr: "KY", row: 4, col: 6 },
  { abbr: "WV", row: 4, col: 7 },
  { abbr: "VA", row: 4, col: 8 },
  { abbr: "MD", row: 4, col: 9 },
  { abbr: "DE", row: 4, col: 10 },
  { abbr: "AZ", row: 5, col: 1 },
  { abbr: "NM", row: 5, col: 2 },
  { abbr: "OK", row: 5, col: 3 },
  { abbr: "AR", row: 5, col: 4 },
  { abbr: "TN", row: 5, col: 5 },
  { abbr: "NC", row: 5, col: 6 },
  { abbr: "SC", row: 5, col: 7 },
  { abbr: "DC", row: 5, col: 9 },
  { abbr: "TX", row: 6, col: 2 },
  { abbr: "LA", row: 6, col: 4 },
  { abbr: "MS", row: 6, col: 5 },
  { abbr: "AL", row: 6, col: 6 },
  { abbr: "GA", row: 6, col: 7 },
  { abbr: "FL", row: 6, col: 8 },
  { abbr: "HI", row: 7, col: 0 },
];
