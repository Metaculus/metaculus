export type ServicesQuizCategory =
  | "enterprise"
  | "government"
  | "non-profit"
  | "academia";

export const SERVICES_QUIZ_CHALLENGES: Record<ServicesQuizCategory, string[]> =
  {
    enterprise: [
      "Product and feature strategy",
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
      "Assessing program impact",
      "AI for monitoring, evaluation, and learning",
      "Cause and region prioritization",
      "Understanding evolving community needs",
      "Policy and advocacy",
      "Donor and partner dynamics",
    ],
    academia: [
      "Academic workforce systems",
      "Using AI for research",
      "Using AI for teaching and learning",
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
