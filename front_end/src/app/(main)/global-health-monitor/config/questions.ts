export type ValueTone = "neutral" | "higherIsWorse" | "higherIsBetter";

export type ValueFormat = {
  kind: "probability" | "count" | "percent" | "rate" | "date";
  decimals?: number;
  granularity?: "day" | "month";
};

export type ValueRef = {
  postId: number;
  // Sub-questions are matched by ID: labels and titles are translated by the API.
  subQuestionId?: number;
  // Multiple choice option name, or "top" for the currently most likely option.
  option?: string;
  mode?: "value" | "pAbove" | "pBelow";
  param?: number;
  // English label used by the edition tooling (PR tables, checker reports).
  label: string;
  format: ValueFormat;
  tone?: ValueTone;
  // Overrides the default "steady" threshold: pp, % of median, or days.
  steady?: number;
};

const RATE = { kind: "rate", decimals: 1 } as const;
const COUNT = { kind: "count" } as const;
const PERCENT = { kind: "percent", decimals: 1 } as const;
const PROBABILITY = { kind: "probability" } as const;
const SEVERITY = { kind: "probability", decimals: 1 } as const;

export const GHM_VALUES = {
  respPeakInfluenza: {
    postId: 44971,
    subQuestionId: 45119,
    label: "Peak weekly influenza admissions per 100k, 2026/27",
    format: RATE,
    tone: "higherIsWorse",
  },
  respPeakCovid: {
    postId: 44971,
    subQuestionId: 45120,
    label: "Peak weekly COVID-19 admissions per 100k, 2026/27",
    format: RATE,
    tone: "higherIsWorse",
  },
  respPeakRsvInfants: {
    postId: 44971,
    subQuestionId: 45235,
    label: "Peak weekly RSV admissions per 100k (0-4 years), 2026/27",
    format: RATE,
    tone: "higherIsWorse",
  },
  respPeakRsvElderly: {
    postId: 44971,
    subQuestionId: 45118,
    label: "Peak weekly RSV admissions per 100k (75+ years), 2026/27",
    format: RATE,
    tone: "higherIsWorse",
  },
  respPeakCombined: {
    postId: 44971,
    subQuestionId: 45121,
    label: "Peak weekly combined admissions per 100k, 2026/27",
    format: RATE,
    tone: "higherIsWorse",
  },
  respPeakWeek: {
    postId: 45086,
    label: "Week of the combined respiratory peak, 2026/27",
    format: { kind: "date", granularity: "day" },
  },
  fluSeverityTop: {
    postId: 44967,
    option: "top",
    label: "Most likely CDC flu season severity, 2026/27",
    format: SEVERITY,
  },
  fluSeverityVeryHigh: {
    postId: 44967,
    option: "Very High (or higher)",
    label: "Chance the flu season is rated Very High (or higher)",
    format: SEVERITY,
    tone: "higherIsWorse",
  },
  fluSeverityHigh: {
    postId: 44967,
    option: "High",
    label: "Chance the flu season is rated High",
    format: SEVERITY,
    tone: "higherIsWorse",
  },
  fluSeverityModerate: {
    postId: 44967,
    option: "Moderate",
    label: "Chance the flu season is rated Moderate",
    format: SEVERITY,
  },
  fluSeverityLow: {
    postId: 44967,
    option: "Low (or lower)",
    label: "Chance the flu season is rated Low (or lower)",
    format: SEVERITY,
    tone: "higherIsBetter",
  },
  fluH1n1Share: {
    postId: 44977,
    label: "H1N1 share of influenza A, 2026/27",
    format: PERCENT,
  },
  rsvImmunizationInfants: {
    postId: 44985,
    subQuestionId: 45138,
    label: "RSV immunization coverage, infants under 8 months (Feb 2027)",
    format: PERCENT,
    tone: "higherIsBetter",
  },
  rsvImmunizationAdults75: {
    postId: 44985,
    subQuestionId: 45137,
    label: "RSV immunization coverage, adults 75+ (Feb 2027)",
    format: PERCENT,
    tone: "higherIsBetter",
  },
  measlesUs2027: {
    postId: 44970,
    subQuestionId: 45116,
    label: "US measles cases in 2027",
    format: COUNT,
    tone: "higherIsWorse",
  },
  measlesEea2027: {
    postId: 44970,
    subQuestionId: 45117,
    label: "European Economic Area measles cases in 2027",
    format: COUNT,
    tone: "higherIsWorse",
  },
  measlesUs2026: {
    postId: 42089,
    label: "US measles cases in 2026",
    format: COUNT,
    tone: "higherIsWorse",
  },
  measlesUsHospitalization2026: {
    postId: 42477,
    label: "Share of US measles cases hospitalized in 2026",
    format: PERCENT,
    tone: "higherIsWorse",
  },
  measlesUsElimination: {
    postId: 42517,
    label: "Chance the US loses measles elimination status before 2027",
    format: PROBABILITY,
    tone: "higherIsWorse",
  },
  ebolaUsCaseBeforeJul2027: {
    postId: 45008,
    label: "Chance of a first US Bundibugyo Ebola case before July 2027",
    format: PROBABILITY,
    tone: "higherIsWorse",
  },
  ebolaUsCaseBefore2027: {
    postId: 43606,
    label: "Chance of a first US Bundibugyo Ebola case before 2027",
    format: PROBABILITY,
    tone: "higherIsWorse",
  },
  ebolaCasesSep1: {
    postId: 43726,
    subQuestionId: 43753,
    label: "Confirmed Bundibugyo Ebola cases by Sep 1, 2026",
    format: COUNT,
    tone: "higherIsWorse",
  },
  ebolaCasesOutbreakEnd: {
    postId: 43726,
    subQuestionId: 43754,
    label: "Confirmed Bundibugyo Ebola cases by the end of the outbreak",
    format: COUNT,
    tone: "higherIsWorse",
  },
  ebolaPheicEnd: {
    postId: 44250,
    label: "Date WHO declares the Bundibugyo Ebola emergency over",
    format: { kind: "date", granularity: "month" },
    tone: "higherIsWorse",
    steady: 14,
  },
  screwwormUs2027: {
    postId: 44965,
    label: "US New World screwworm animal cases in 2027",
    format: COUNT,
    tone: "higherIsWorse",
  },
  screwwormUs2026: {
    postId: 43869,
    label: "US New World screwworm animal cases in 2026",
    format: COUNT,
    tone: "higherIsWorse",
  },
  chikEea2026: {
    postId: 45018,
    label: "Locally acquired chikungunya cases in the EEA in 2026",
    format: COUNT,
    tone: "higherIsWorse",
  },
  h5Pheic: {
    postId: 45011,
    label: "Chance WHO declares an H5 emergency before 2028",
    format: PROBABILITY,
    tone: "higherIsWorse",
  },
  mpoxUsCases: {
    postId: 42530,
    label: "US Clade I mpox cases before 2027",
    format: COUNT,
    tone: "higherIsWorse",
  },
  hantaPheic: {
    postId: 43468,
    label: "Chance WHO declares a hantavirus emergency before 2027",
    format: PROBABILITY,
    tone: "higherIsWorse",
  },
} as const satisfies Record<string, ValueRef>;

export type GhmValueKey = keyof typeof GHM_VALUES;

export const GHM_VALUE_KEYS = Object.keys(GHM_VALUES) as GhmValueKey[];

export function getValueRef(key: GhmValueKey): ValueRef {
  return GHM_VALUES[key];
}
