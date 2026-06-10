export const GOVERNMENT_BASELINES = {
  "2025": 0,
  "2027": 0.62,
  "2030": 1.55,
  "2035": 3.09,
};

export type CuratedInsightType = "up" | "down" | "neutral";

export type CuratedInsight = {
  type: CuratedInsightType;
  body: string;
};

export type JobDefinition = {
  name: string;
  slug: string;
  post_id: number;
  felten: number;
  mna: number;
  aoe: number;
  /** Optional per-occupation wage forecast post (used by the Wages bento card). */
  wage_post_id?: number;
  /** Optional hand-written ticker line for the All Jobs wall (see fetch_tile_tickers). */
  curated_insights?: CuratedInsight[];
  /** Comment IDs to suppress from the tile tickers (e.g. off-topic, low-quality). */
  excluded_comment_ids?: number[];
};

export const JOBS_DATA: JobDefinition[] = [
  {
    name: "Laborers and Movers",
    slug: "laborers-and-movers",
    post_id: 42626,
    felten: -1.07,
    mna: 0.257,
    aoe: 0,
  },
  {
    name: "Construction Workers",
    slug: "construction-workers",
    post_id: 42625,
    wage_post_id: 43109,
    felten: -1.263,
    mna: 0.158,
    aoe: 0.9,
  },
  {
    name: "Janitors and Cleaners",
    slug: "janitors-and-cleaners",
    post_id: 42624,
    felten: -1.076,
    mna: 0.179,
    aoe: 0,
  },
  {
    name: "Restaurant Servers",
    slug: "restaurant-servers",
    post_id: 42623,
    felten: -0.38,
    mna: 0.295,
    aoe: 0,
  },
  {
    name: "Law Enforcement",
    slug: "law-enforcement",
    post_id: 42622,
    felten: -0.567,
    mna: 0.252,
    aoe: 7.3,
  },
  {
    name: "Physicians",
    slug: "physicians",
    post_id: 42621,
    felten: 0.754,
    mna: 0.243,
    aoe: 3.5,
  },
  {
    name: "Registered Nurses",
    slug: "registered-nurses",
    post_id: 42620,
    felten: 0.272,
    mna: 0.28,
    aoe: 6,
  },
  {
    name: "K-12 Teachers",
    slug: "k12-teachers",
    post_id: 42619,
    felten: 1.004,
    mna: 0.32,
    aoe: 16.4,
  },
  {
    name: "Lawyers and Law Clerks",
    slug: "lawyers-and-law-clerks",
    post_id: 42618,
    felten: 1.455,
    mna: 0.236,
    aoe: 16.7,
  },
  {
    name: "Services Sales Representatives",
    slug: "services-sales-representatives",
    post_id: 42617,
    felten: 1.279,
    mna: 0.317,
    aoe: 36.1,
  },
  {
    name: "Designers",
    slug: "designers",
    post_id: 42615,
    felten: 0.079,
    mna: 0.215,
    aoe: 14,
  },
  {
    name: "Engineers",
    slug: "engineers",
    post_id: 42614,
    wage_post_id: 43110,
    felten: 0.829,
    mna: 0.23,
    aoe: 5.2,
  },
  {
    name: "Software Developers",
    slug: "software-developers",
    post_id: 42613,
    wage_post_id: 43106,
    felten: 1.011,
    mna: 0.116,
    aoe: 33.8,
  },
  {
    name: "Financial Specialists",
    slug: "financial-specialists",
    post_id: 42612,
    wage_post_id: 43107,
    felten: 1.257,
    mna: 0.342,
    aoe: 31.3,
  },
  {
    name: "General Managers",
    slug: "general-managers",
    post_id: 41308,
    wage_post_id: 43108,
    felten: 0.678,
    mna: 0.264,
    aoe: 13.8,
  },
];

export const ALL_JOB_SLUGS = JOBS_DATA.map((j) => j.slug);

export function getJobBySlug(slug: string): JobDefinition | undefined {
  return JOBS_DATA.find((j) => j.slug === slug);
}

const SLUG_BY_NAME = new Map(JOBS_DATA.map((j) => [j.name, j.slug]));

/** Resolves a job's display name (as shown in the Jobs Monitor) to its slug. */
export function getJobSlugByName(name: string): string | undefined {
  return SLUG_BY_NAME.get(name);
}

/** Compact labels for tight chips (e.g. the metric comparison chart). */
const SHORT_BY_SLUG: Record<string, string> = {
  "laborers-and-movers": "Laborers",
  "construction-workers": "Construction",
  "janitors-and-cleaners": "Janitors",
  "restaurant-servers": "Servers",
  "law-enforcement": "Law Enf.",
  physicians: "Physicians",
  "registered-nurses": "Nurses",
  "k12-teachers": "Teachers",
  "lawyers-and-law-clerks": "Lawyers",
  "services-sales-representatives": "Sales Reps",
  designers: "Designers",
  engineers: "Engineers",
  "software-developers": "Software Devs",
  "financial-specialists": "Financial",
  "general-managers": "GMs",
};

/** Short label for a job, falling back to its full name. */
export function getJobShort(slug: string): string {
  return SHORT_BY_SLUG[slug] ?? getJobBySlug(slug)?.name ?? slug;
}
