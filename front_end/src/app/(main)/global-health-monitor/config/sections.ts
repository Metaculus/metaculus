import { DiseaseId } from "./diseases";
import { GHM_VALUES, GhmValueKey } from "./questions";

// "column" sections sit side by side in one row, like Midterms' Key Drivers.
export type SectionLayout = "carousel" | "dualPane" | "column";

export type SectionCardConfig = {
  postId: number;
  // Value whose move since the previous edition is shown on the card. Group cards have none.
  value?: GhmValueKey;
};

export type SectionConfig = {
  id: DiseaseId;
  layout?: SectionLayout;
  cards: SectionCardConfig[];
};

// Page order. Removing a card hides a question; value keys stay because past editions reference them.
export const SECTIONS: SectionConfig[] = [
  {
    id: "respiratory",
    cards: [
      { postId: 44971 },
      { postId: 45086, value: "respPeakWeek" },
      { postId: 44967, value: "fluSeverityTop" },
      { postId: 44977, value: "fluH1n1Share" },
      { postId: 44985 },
    ],
  },
  {
    id: "measles",
    cards: [
      { postId: 44970 },
      { postId: 42089, value: "measlesUs2026" },
      { postId: 42477, value: "measlesUsHospitalization2026" },
      { postId: 42517, value: "measlesUsElimination" },
    ],
  },
  {
    id: "ebola",
    cards: [
      { postId: 45008, value: "ebolaUsCaseBeforeJul2027" },
      { postId: 43606, value: "ebolaUsCaseBefore2027" },
      { postId: 43726 },
      { postId: 44250, value: "ebolaPheicEnd" },
    ],
  },
  {
    id: "screwworm",
    cards: [
      { postId: 44965, value: "screwwormUs2027" },
      { postId: 43869, value: "screwwormUs2026" },
    ],
  },
  { id: "chikungunya", cards: [{ postId: 45018, value: "chikEea2026" }] },
  {
    id: "h5",
    layout: "column",
    cards: [{ postId: 45011, value: "h5Pheic" }],
  },
  {
    id: "mpox",
    layout: "column",
    cards: [{ postId: 42530, value: "mpoxUsCases" }],
  },
  {
    id: "hantavirus",
    layout: "column",
    cards: [{ postId: 43468, value: "hantaPheic" }],
  },
];

const CAROUSEL_MIN_POSTS = 4;

export function getSectionLayout(section: SectionConfig): SectionLayout {
  return (
    section.layout ??
    (section.cards.length >= CAROUSEL_MIN_POSTS ? "carousel" : "dualPane")
  );
}

const MAX_COLUMNS_PER_ROW = 3;

export type SectionRow =
  | { kind: "section"; section: SectionConfig }
  | { kind: "columns"; sections: SectionConfig[] };

// Consecutive "column" sections share a row of up to three.
export function getSectionRows(sections: SectionConfig[]): SectionRow[] {
  const rows: SectionRow[] = [];
  for (const section of sections) {
    const lastRow = rows.at(-1);
    if (getSectionLayout(section) !== "column") {
      rows.push({ kind: "section", section });
    } else if (
      lastRow?.kind === "columns" &&
      lastRow.sections.length < MAX_COLUMNS_PER_ROW
    ) {
      lastRow.sections.push(section);
    } else {
      rows.push({ kind: "columns", sections: [section] });
    }
  }
  return rows;
}

export function getAllGhmPostIds(): number[] {
  const ids = new Set<number>();
  for (const ref of Object.values(GHM_VALUES)) {
    ids.add(ref.postId);
  }
  for (const section of SECTIONS) {
    for (const card of section.cards) {
      ids.add(card.postId);
    }
  }
  return [...ids];
}
