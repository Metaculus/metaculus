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
  /** Optional hand-curated insights for the Job Detail page. Overrides the comments fallback. */
  curated_insights?: CuratedInsight[];
  /**
   * Optional aliases used by the keyword fallback when the job's own post has too few
   * comments. Should include common synonyms / role variants — e.g. "developer", "engineer",
   * "coding" for Software Developers.
   */
  keyword_aliases?: string[];
  /** Comment IDs to suppress from the Curated Insights list (e.g. off-topic, low-quality). */
  excluded_comment_ids?: number[];
  /**
   * Hand-picked comment IDs (on this job's own post) to feature, in display order.
   * When set, the Curated Insights list shows ONLY these — no top-comment/keyword
   * fallback — and silently skips any ID not present in the DB.
   */
  curated_comment_ids?: number[];
};

export const JOBS_DATA: JobDefinition[] = [
  {
    name: "Laborers and Movers",
    slug: "laborers-and-movers",
    post_id: 42626,
    felten: -1.07,
    mna: 0.257,
    aoe: 0,
    keyword_aliases: ["laborer", "mover", "warehouse", "logistics"],
    curated_comment_ids: [799619, 799482, 792968],
  },
  {
    name: "Construction Workers",
    slug: "construction-workers",
    post_id: 42625,
    wage_post_id: 43109,
    felten: -1.263,
    mna: 0.158,
    aoe: 0.9,
    keyword_aliases: ["construction", "builder", "trades"],
    curated_comment_ids: [792763, 776050],
  },
  {
    name: "Janitors and Cleaners",
    slug: "janitors-and-cleaners",
    post_id: 42624,
    felten: -1.076,
    mna: 0.179,
    aoe: 0,
    keyword_aliases: ["janitor", "cleaner", "cleaning"],
    curated_comment_ids: [792762, 799110, 773358],
  },
  {
    name: "Restaurant Servers",
    slug: "restaurant-servers",
    post_id: 42623,
    felten: -0.38,
    mna: 0.295,
    aoe: 0,
    keyword_aliases: ["server", "restaurant", "waiter", "hospitality"],
    curated_comment_ids: [821674, 799120],
  },
  {
    name: "Law Enforcement",
    slug: "law-enforcement",
    post_id: 42622,
    felten: -0.567,
    mna: 0.252,
    aoe: 7.3,
    keyword_aliases: ["police", "officer", "law enforcement"],
    curated_comment_ids: [798844, 771922, 772605],
  },
  {
    name: "Physicians",
    slug: "physicians",
    post_id: 42621,
    felten: 0.754,
    mna: 0.243,
    aoe: 3.5,
    keyword_aliases: ["physician", "doctor", "medical"],
    curated_comment_ids: [796544, 785300, 779170],
  },
  {
    name: "Registered Nurses",
    slug: "registered-nurses",
    post_id: 42620,
    felten: 0.272,
    mna: 0.28,
    aoe: 6,
    keyword_aliases: ["nurse", "nursing", "healthcare"],
    curated_comment_ids: [805475, 799627, 799626],
  },
  {
    name: "K-12 Teachers",
    slug: "k12-teachers",
    post_id: 42619,
    felten: 1.004,
    mna: 0.32,
    aoe: 16.4,
    keyword_aliases: ["teacher", "education", "school", "k-12"],
    curated_comment_ids: [797855, 783466, 797966],
  },
  {
    name: "Lawyers and Law Clerks",
    slug: "lawyers-and-law-clerks",
    post_id: 42618,
    felten: 1.455,
    mna: 0.236,
    aoe: 16.7,
    keyword_aliases: ["lawyer", "attorney", "legal", "law clerk"],
    curated_comment_ids: [773363, 777876],
  },
  {
    name: "Services Sales Representatives",
    slug: "services-sales-representatives",
    post_id: 42617,
    felten: 1.279,
    mna: 0.317,
    aoe: 36.1,
    keyword_aliases: ["sales", "salesperson", "representative"],
    curated_comment_ids: [801586, 798904, 778131],
  },
  {
    name: "Designers",
    slug: "designers",
    post_id: 42615,
    felten: 0.079,
    mna: 0.215,
    aoe: 14,
    keyword_aliases: ["designer", "design", "ux", "graphic"],
    curated_comment_ids: [801539, 774787, 774105],
  },
  {
    name: "Engineers",
    slug: "engineers",
    post_id: 42614,
    wage_post_id: 43110,
    felten: 0.829,
    mna: 0.23,
    aoe: 5.2,
    keyword_aliases: ["engineer", "engineering"],
    curated_comment_ids: [799629, 798889, 773926],
  },
  {
    name: "Software Developers",
    slug: "software-developers",
    post_id: 42613,
    wage_post_id: 43106,
    felten: 1.011,
    mna: 0.116,
    aoe: 33.8,
    keyword_aliases: ["developer", "software", "programmer", "coding"],
    curated_comment_ids: [772388, 779168, 797821],
  },
  {
    name: "Financial Specialists",
    slug: "financial-specialists",
    post_id: 42612,
    wage_post_id: 43107,
    felten: 1.257,
    mna: 0.342,
    aoe: 31.3,
    keyword_aliases: ["financial", "finance", "analyst", "specialist"],
    curated_comment_ids: [801593, 772256, 801865],
  },
  {
    name: "General Managers",
    slug: "general-managers",
    post_id: 41308,
    wage_post_id: 43108,
    felten: 0.678,
    mna: 0.264,
    aoe: 13.8,
    keyword_aliases: ["manager", "management", "general manager"],
    curated_comment_ids: [768208, 768524, 771087],
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
