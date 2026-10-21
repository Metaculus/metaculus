import { DiseaseId } from "./diseases";
import { GHM_VALUES, GhmValueKey } from "./questions";

export type SectionCardConfig = {
  postId: number;
  // Value whose move since the previous edition is shown on the card. Group cards have none.
  value?: GhmValueKey;
};

export type SectionConfig = {
  id: DiseaseId;
  // "column" sections show only their title and cards, together in the "Other emerging diseases" row.
  layout?: "column";
  cards: SectionCardConfig[];
};

// Anchor of the "Other emerging diseases" row; its diseases' own anchors land on it too.
export const OTHER_DISEASES_ID = "other-diseases";

// Live page order, used by the latest edition. Past editions render the layout baked into their
// archive. Removing a card hides a question; value keys stay because past editions reference them.
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
  {
    id: "plague",
    layout: "column",
    cards: [{ postId: 45987, value: "plagueRussiaFatalities" }],
  },
];

export type SectionRow =
  | { kind: "section"; section: SectionConfig }
  | { kind: "columns"; sections: SectionConfig[] };

// "column" sections share a single row, placed where the first of them appears.
export function getSectionRows(sections: SectionConfig[]): SectionRow[] {
  const rows: SectionRow[] = [];
  let columns: SectionConfig[] | null = null;
  for (const section of sections) {
    if (section.layout !== "column") {
      rows.push({ kind: "section", section });
    } else if (columns) {
      columns.push(section);
    } else {
      columns = [section];
      rows.push({ kind: "columns", sections: columns });
    }
  }
  return rows;
}

export function getSectionPostIds(sections: SectionConfig[]): number[] {
  return sections.flatMap((section) =>
    section.cards.map((card) => card.postId)
  );
}

// Posts the live page and the edition tooling read.
export function getAllGhmPostIds(): number[] {
  return [
    ...new Set([
      ...Object.values(GHM_VALUES).map((ref) => ref.postId),
      ...getSectionPostIds(SECTIONS),
    ]),
  ];
}
