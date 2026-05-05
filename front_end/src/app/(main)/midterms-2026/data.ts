export const MIDTERMS_PROJECT_ID = 32840;

export type SenateRace = {
  state: string;
  name: string;
  postId: number;
};

// Placeholder post IDs — real values supplied later from project 32840
export const SENATE_RACES: SenateRace[] = [
  { state: "AL", name: "Alabama Senate", postId: 0 },
  { state: "AK", name: "Alaska Senate", postId: 0 },
  { state: "AR", name: "Arkansas Senate", postId: 0 },
  { state: "CO", name: "Colorado Senate", postId: 0 },
  { state: "DE", name: "Delaware Senate", postId: 0 },
  { state: "FL", name: "Florida Senate", postId: 0 },
  { state: "GA", name: "Georgia Senate", postId: 0 },
  { state: "ID", name: "Idaho Senate", postId: 0 },
  { state: "IL", name: "Illinois Senate", postId: 0 },
  { state: "IA", name: "Iowa Senate", postId: 0 },
  { state: "KS", name: "Kansas Senate", postId: 0 },
  { state: "KY", name: "Kentucky Senate", postId: 0 },
  { state: "LA", name: "Louisiana Senate", postId: 0 },
  { state: "ME", name: "Maine Senate", postId: 0 },
  { state: "MA", name: "Massachusetts Senate", postId: 0 },
  { state: "MI", name: "Michigan Senate", postId: 0 },
  { state: "MN", name: "Minnesota Senate", postId: 0 },
  { state: "MS", name: "Mississippi Senate", postId: 0 },
  { state: "MT", name: "Montana Senate", postId: 0 },
  { state: "NE", name: "Nebraska Senate", postId: 0 },
  { state: "NH", name: "New Hampshire Senate", postId: 0 },
  { state: "NJ", name: "New Jersey Senate", postId: 0 },
  { state: "NM", name: "New Mexico Senate", postId: 0 },
  { state: "NC", name: "North Carolina Senate", postId: 0 },
  { state: "OH", name: "Ohio Senate", postId: 0 },
  { state: "OK", name: "Oklahoma Senate", postId: 0 },
  { state: "OR", name: "Oregon Senate", postId: 0 },
  { state: "RI", name: "Rhode Island Senate", postId: 0 },
  { state: "SC", name: "South Carolina Senate", postId: 0 },
  { state: "SD", name: "South Dakota Senate", postId: 0 },
  { state: "TN", name: "Tennessee Senate", postId: 0 },
  { state: "TX", name: "Texas Senate", postId: 0 },
  { state: "VA", name: "Virginia Senate", postId: 0 },
  { state: "WV", name: "West Virginia Senate", postId: 0 },
  { state: "WY", name: "Wyoming Senate", postId: 0 },
];

export type ChamberQuestionIds = {
  senateControl: number;
  houseControl: number;
  congressOutcomeGroup: number;
  voterTurnout: number;
  electionIntegrity: number;
};

export const CHAMBER_QUESTIONS: ChamberQuestionIds = {
  senateControl: 0,
  houseControl: 0,
  congressOutcomeGroup: 0,
  voterTurnout: 0,
  electionIntegrity: 0,
};

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
