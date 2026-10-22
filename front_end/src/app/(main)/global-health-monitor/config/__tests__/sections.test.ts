import { getLatestEdition } from "../../editions";
import { getSectionRows, SectionConfig } from "../sections";

function section(id: string, layout?: "column"): SectionConfig {
  return { id, layout, cards: [] } as unknown as SectionConfig;
}

describe("getSectionRows", () => {
  it("puts every column section in one row, where the first one appears", () => {
    const rows = getSectionRows([
      section("respiratory"),
      section("h5", "column"),
      section("measles"),
      section("mpox", "column"),
    ]);

    expect(
      rows.map((row) =>
        row.kind === "section"
          ? row.section.id
          : row.sections.map(({ id }) => id)
      )
    ).toEqual(["respiratory", ["h5", "mpox"], "measles"]);
  });

  it("groups the four live emerging diseases together", () => {
    const columns = getSectionRows(getLatestEdition().layout).filter(
      (row) => row.kind === "columns"
    );

    expect(columns).toHaveLength(1);
    expect(
      columns[0]?.kind === "columns" && columns[0].sections.map(({ id }) => id)
    ).toEqual(["h5", "mpox", "hantavirus", "plague"]);
  });
});
