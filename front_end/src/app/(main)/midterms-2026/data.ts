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

// Contested 2026 senate races (matching subquestions of post 40598).
export const SENATE_RACES: SenateRace[] = [
  { state: "AK", name: "Alaska Senate", subQuestionLabel: "Alaska" },
  { state: "AR", name: "Arkansas Senate", subQuestionLabel: "Arkansas" },
  { state: "CO", name: "Colorado Senate", subQuestionLabel: "Colorado" },
  { state: "FL", name: "Florida Senate", subQuestionLabel: "Florida" },
  { state: "GA", name: "Georgia Senate", subQuestionLabel: "Georgia" },
  { state: "IA", name: "Iowa Senate", subQuestionLabel: "Iowa" },
  { state: "ID", name: "Idaho Senate", subQuestionLabel: "Idaho" },
  { state: "KS", name: "Kansas Senate", subQuestionLabel: "Kansas" },
  { state: "KY", name: "Kentucky Senate", subQuestionLabel: "Kentucky" },
  { state: "LA", name: "Louisiana Senate", subQuestionLabel: "Louisiana" },
  { state: "ME", name: "Maine Senate", subQuestionLabel: "Maine" },
  { state: "MI", name: "Michigan Senate", subQuestionLabel: "Michigan" },
  { state: "MN", name: "Minnesota Senate", subQuestionLabel: "Minnesota" },
  { state: "MS", name: "Mississippi Senate", subQuestionLabel: "Mississippi" },
  { state: "MT", name: "Montana Senate", subQuestionLabel: "Montana" },
  {
    state: "NC",
    name: "North Carolina Senate",
    subQuestionLabel: "North Carolina",
  },
  {
    state: "NE",
    name: "Nebraska Senate",
    subQuestionLabel: "Nebraska",
  },
  {
    state: "NH",
    name: "New Hampshire Senate",
    subQuestionLabel: "New Hampshire",
  },
  { state: "OH", name: "Ohio Senate", subQuestionLabel: "Ohio" },
  { state: "OR", name: "Oregon Senate", subQuestionLabel: "Oregon" },
  {
    state: "RI",
    name: "Rhode Island Senate",
    subQuestionLabel: "Rhode Island",
  },
  {
    state: "SC",
    name: "South Carolina Senate",
    subQuestionLabel: "South Carolina",
  },
  { state: "TX", name: "Texas Senate", subQuestionLabel: "Texas" },
];

// Single group-of-questions post (one binary subquestion per state) for the
// 2026 gubernatorial races. Alaska and Maine are NOT in this group — they are
// standalone multiple-choice posts (see STANDALONE_GOVERNOR_RACES).
export const GOVERNOR_GROUP_POST_ID = 43448;

export const GOVERNOR_RACES: SenateRace[] = [
  { state: "AZ", name: "Arizona Governor", subQuestionLabel: "Arizona" },
  { state: "FL", name: "Florida Governor", subQuestionLabel: "Florida" },
  { state: "GA", name: "Georgia Governor", subQuestionLabel: "Georgia" },
  { state: "HI", name: "Hawaii Governor", subQuestionLabel: "Hawaii" },
  { state: "IA", name: "Iowa Governor", subQuestionLabel: "Iowa" },
  { state: "KS", name: "Kansas Governor", subQuestionLabel: "Kansas" },
  { state: "MI", name: "Michigan Governor", subQuestionLabel: "Michigan" },
  { state: "NE", name: "Nebraska Governor", subQuestionLabel: "Nebraska" },
  {
    state: "NH",
    name: "New Hampshire Governor",
    subQuestionLabel: "New Hampshire",
  },
  { state: "NM", name: "New Mexico Governor", subQuestionLabel: "New Mexico" },
  { state: "NV", name: "Nevada Governor", subQuestionLabel: "Nevada" },
  { state: "OH", name: "Ohio Governor", subQuestionLabel: "Ohio" },
  { state: "OR", name: "Oregon Governor", subQuestionLabel: "Oregon" },
  {
    state: "SC",
    name: "South Carolina Governor",
    subQuestionLabel: "South Carolina",
  },
  { state: "TX", name: "Texas Governor", subQuestionLabel: "Texas" },
  { state: "VT", name: "Vermont Governor", subQuestionLabel: "Vermont" },
  { state: "WI", name: "Wisconsin Governor", subQuestionLabel: "Wisconsin" },
];

// Standalone gubernatorial posts (multiple-choice: Democrat/Republican/Other)
// that are not part of GOVERNOR_GROUP_POST_ID.
export type StandaloneRace = { state: string; name: string; postId: number };

export const STANDALONE_GOVERNOR_RACES: StandaloneRace[] = [
  { state: "AK", name: "Alaska Governor", postId: 43462 },
  { state: "ME", name: "Maine Governor", postId: 43464 },
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
  /** Binary — courts block USPS mail-in ballot restrictions */
  mailInBallots: number;
};

export const CHAMBER_QUESTIONS: ChamberQuestionIds = {
  senateControl: 36370,
  houseControl: 36369,
  congressOutcome: 34484,
  voterTurnout: 41177,
  electionIntegrity: 36327,
  mailInBallots: 43527,
};

export type CongressOutcomeKey = "RR" | "RD" | "DR" | "DD";

// Option labels of the congress-control multiple-choice question (#34484).
// First letter = Senate, second = House. Strings must match the API options.
export const CONGRESS_OUTCOME_LABELS: Record<CongressOutcomeKey, string> = {
  RR: "Rep Senate / Rep House",
  RD: "Rep Senate / Dem House",
  DR: "Dem Senate / Rep House",
  DD: "Dem Senate / Dem House",
};

// Seat-advantage distribution questions. The Senate question is a
// Discrete Continuous type (integer-spaced bars); the House question
// is a Continuous type (smooth PDF). Both are signed around zero
// where negative = Dem advantage and positive = Rep advantage.
export const SEAT_DISTRIBUTION_POSTS = {
  senate: 40416,
  house: 40413,
} as const;

// Electoral Consequences rows. Each is a group-of-questions post conditional on
// control of Congress, with three subquestions labeled "Democratic" /
// "Republican" / "Mixed" (→ Dem / Rep / Split Congress columns). Binary
// subquestions render as gauges; numeric/discrete ones (NSF budget 43677,
// Democracy Threat Index 43624, Article III judges 43628) render as
// median + (25th–75th).
export const CONSEQUENCE_QUESTION_IDS = [
  43591, 43632, 43628, 43617, 43624, 43630, 43677, 43640,
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
