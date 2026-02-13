export type ServicesQuizCategory =
  | "enterprise"
  | "government"
  | "non-profit"
  | "academia";

export const SERVICES_QUIZ_CHALLENGES: Record<ServicesQuizCategory, string[]> =
  {
    enterprise: [
      "Product or feature bets",
      "AI and automation impact",
      "Technology timing",
      "Competitive landscape",
      "Market size and adoption",
      "Disruptive shocks and supply chains",
    ],
    government: [
      "Policy options and outcomes",
      "AI in security, defense, services, etc.",
      "Crisis and conflict risk",
      "Public sentiment and legitimacy",
      "Timing of intervention",
      "National and cyber threats",
    ],
    "non-profit": [
      "Intervention effectiveness",
      "AI for monitoring, delivery, and evaluation",
      "Cause and region prioritization",
      "Evolving community needs",
      "Policy and agenda influence",
      "Donor and partner dynamics",
    ],
    academia: [
      "Academic labor markets and career paths",
      "AI tools and methods in research",
      "AI in teaching and student learning",
      "Funding priorities",
      "Replication and robustness",
      "Regulatory risks and opportunities",
    ],
  };

export const SERVICES_QUIZ_CATEGORIES: ServicesQuizCategory[] = [
  "enterprise",
  "government",
  "non-profit",
  "academia",
];

export function isServicesQuizCategory(
  v: string | null
): v is ServicesQuizCategory {
  return !!v && (SERVICES_QUIZ_CATEGORIES as string[]).includes(v);
}
