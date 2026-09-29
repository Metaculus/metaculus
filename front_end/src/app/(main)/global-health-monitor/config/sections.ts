import { DiseaseId } from "./diseases";
import { GHM_VALUES, GhmValueKey } from "./questions";

// "column" sections sit side by side in one row, like Midterms' Key Drivers.
export type SectionLayout = "carousel" | "dualPane" | "column";

export type SectionCardConfig = {
  postId: number;
  // Values whose change since the previous edition is shown on the card.
  values: GhmValueKey[];
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
      {
        postId: 44971,
        values: [
          "respPeakInfluenza",
          "respPeakCovid",
          "respPeakRsvInfants",
          "respPeakRsvElderly",
          "respPeakCombined",
        ],
      },
      { postId: 45086, values: ["respPeakWeek"] },
      { postId: 44967, values: ["fluSeverityTop"] },
      { postId: 44977, values: ["fluH1n1Share"] },
      {
        postId: 44985,
        values: ["rsvImmunizationInfants", "rsvImmunizationAdults75"],
      },
    ],
  },
  {
    id: "measles",
    cards: [
      { postId: 44970, values: ["measlesUs2027", "measlesEea2027"] },
      { postId: 42089, values: ["measlesUs2026"] },
      { postId: 42477, values: ["measlesUsHospitalization2026"] },
      { postId: 42517, values: ["measlesUsElimination"] },
    ],
  },
  {
    id: "ebola",
    cards: [
      { postId: 45008, values: ["ebolaUsCaseBeforeJul2027"] },
      { postId: 43606, values: ["ebolaUsCaseBefore2027"] },
      {
        postId: 43726,
        values: ["ebolaCasesSep1", "ebolaCasesOutbreakEnd"],
      },
      { postId: 44250, values: ["ebolaPheicEnd"] },
    ],
  },
  {
    id: "screwworm",
    cards: [
      { postId: 44965, values: ["screwwormUs2027"] },
      { postId: 43869, values: ["screwwormUs2026"] },
    ],
  },
  { id: "chikungunya", cards: [{ postId: 45018, values: ["chikEea2026"] }] },
  {
    id: "h5",
    layout: "column",
    cards: [{ postId: 45011, values: ["h5Pheic"] }],
  },
  {
    id: "mpox",
    layout: "column",
    cards: [{ postId: 42530, values: ["mpoxUsCases"] }],
  },
  {
    id: "hantavirus",
    layout: "column",
    cards: [{ postId: 43468, values: ["hantaPheic"] }],
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
