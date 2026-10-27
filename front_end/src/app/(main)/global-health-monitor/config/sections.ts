import { DiseaseId } from "./diseases";
import { GhmValueKey } from "./questions";

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
